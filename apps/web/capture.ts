import {SHOT_GUIDES,analyzeImagePixels,captureReadiness,addShot,removeShot,markCorner,metadataExport,validateAnchor,nextGuide,hammingHash,type CaptureSession,type ShotKind,type CaptureShot,type ShotQuality} from '../../packages/capture-core/index.js';
type ImageEntry = {url:string;blob:Blob};
type CaptureEdge={index:number;from:string;to:string;lengthCm:number};
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const scene:CaptureSession={revision:0,shots:[],anchor:null};
const blobs=new Map<string,ImageEntry>();
let kind:ShotKind='overview',activeShot:string|null=null,stream:MediaStream|null=null,opening=false,busy=false,sequence=0;
let lastFocus:HTMLElement|null=null;
const note=(message:string,good=false)=>{$('captureStatus').textContent=message;$('captureStatus').setAttribute('data-ok',String(good));};
const guide=()=>SHOT_GUIDES.find(s=>s.kind===kind)!;
const $video=$<HTMLVideoElement>('captureVideo');
const $photo=$<HTMLImageElement>('capturePreviewImage');
function eraseUrls(){for(const entry of blobs.values())URL.revokeObjectURL(entry.url);blobs.clear();}
function stopCamera(){if(stream){for(const track of stream.getTracks())track.stop();stream=null;}$video.pause();$video.srcObject=null;$video.hidden=true;$('captureTakePhoto').hidden=true;$('captureStopCamera').hidden=true;$('captureStartCamera').hidden=false;$('captureCrosshair').hidden=true;}
function getEdges(){window.dispatchEvent(new CustomEvent('fitspace:capture-edges',{detail:{respond:(edges:CaptureEdge[])=>{
 const sel=$<HTMLSelectElement>('captureAnchorWall'),prev=sel.value;sel.replaceChildren();for(const edge of edges){const option=document.createElement('option');option.value=String(edge.index);option.textContent=`${edge.from}–${edge.to} · ${edge.lengthCm.toLocaleString('el-GR')} cm`;sel.append(option);}if(Array.from(sel.options).some(o=>o.value===prev))sel.value=prev;
}}}));}
function chooseKind(v:ShotKind){kind=v;activeShot=null;stopCamera();render();}
function render(){const next=nextGuide(scene.shots),s=captureReadiness(scene),guideNow=guide();
 $('captureStageName').textContent=guideNow.title;$('captureInstruction').textContent=guideNow.instruction;
 $('captureProgressText').textContent=`${s.views} / ${SHOT_GUIDES.length} διαφορετικές λήψεις`;
 $('captureQualityHeading').textContent=`Κάλυψη βασικών γωνιών ${4-s.coreMissing.length} / 4`;
 ($('captureProgressBar') as HTMLElement).style.width=`${(4-s.coreMissing.length)*25}%`;
 $('captureCoverageNote').textContent=s.usableForHumanReview?'Έχεις λήψεις τεσσάρων βασικών γωνιών και μία μετρημένη διάσταση. Απαιτείται ανθρώπινη επιθεώρηση — δεν έχει δημιουργηθεί 3D από φωτογραφίες.':s.nearDuplicate?'Πιθανώς επαναλαμβανόμενες λήψεις. Προτίμησε διαφορετικές γωνίες με κοινές ορατές επιφάνειες.':s.coreMissing.length?`Απομένουν βασικές λήψεις: ${s.coreMissing.map(k=>SHOT_GUIDES.find(v=>v.kind===k)!.title).join(' · ')}.`:'Ολοκλήρωσε πραγματική μέτρηση τοίχου για βαθμονόμηση.';
 $('captureViews').innerHTML=SHOT_GUIDES.map(g=>`<button type="button" data-capture-kind="${g.kind}" aria-pressed="${g.kind===kind}" data-complete="${scene.shots.some(s=>s.kind===g.kind&&s.quality.status!=='retake')}"><span class="capture-view-icon">${scene.shots.some(s=>s.kind===g.kind&&s.quality.status!=='retake')?'✓':'◌'}</span><span>${g.title}</span></button>`).join('');
 $('capturePhotos').innerHTML=scene.shots.map(s=>{const entry=blobs.get(s.id);return `<div class="capture-photo"><img src="${entry?.url||''}" alt="${SHOT_GUIDES.find(g=>g.kind===s.kind)?.title||'Λήψη'}"/><button type="button" data-show-shot="${s.id}" aria-pressed="${s.id===activeShot}">${s.quality.status==='retake'?'⚠ Επανάληψη':s.quality.status==='review'?'◇ Έλεγχος':'✓ Καλή'} · ${s.corners.length} σημεία</button><button type="button" class="remove" data-remove-shot="${s.id}" title="Διαγραφή φωτογραφίας" aria-label="Διαγραφή φωτογραφίας">×</button></div>`;}).join('');
 $('captureRemovePins').toggleAttribute('disabled',!activeShot||!scene.shots.find(s=>s.id===activeShot)?.corners.length);
 $('captureEmpty').hidden=!!stream||!!activeShot;
 $photo.hidden=!activeShot||!!stream;
 if(activeShot&&!stream){const chosen=scene.shots.find(s=>s.id===activeShot);const url=blobs.get(activeShot)?.url||'';if($photo.src!==url)$photo.src=url;
  $('captureMarkHint').textContent=chosen?` · ${chosen.corners.length} σημ. — πάτησε ορατές γωνίες στη φωτογραφία (χειροκίνητη σήμανση).`:'';
  const pins=$('capturePins');pins.replaceChildren();for(let i=0;i<(chosen?.corners.length||0);i++){const p=chosen!.corners[i],pin=document.createElement('span');pin.className='capture-pin';pin.style.left=`${p.x*100}%`;pin.style.top=`${p.y*100}%`;pin.textContent=String(i+1);pins.append(pin);}
 }else{$('capturePins').replaceChildren();$('captureMarkHint').textContent='';}
 if(!activeShot&&!stream&&next)kind=kind||next.kind;
}
function open(){if(opening)return;opening=true;lastFocus=document.activeElement as HTMLElement;$('captureOverlay').hidden=false;getEdges();render();$('captureClose').focus();}
function close(){stopCamera();$('captureOverlay').hidden=true;opening=false;lastFocus?.focus();}
async function startCamera(){if(busy)return;try{stopCamera();if(!navigator.mediaDevices?.getUserMedia)throw Error('Δεν υποστηρίζεται live camera εδώ. Χρησιμοποίησε «＋ Φωτογραφία».');
 const permission=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}}});
 if(!opening){permission.getTracks().forEach(t=>t.stop());return;}stream=permission;$video.srcObject=stream;await $video.play();$video.hidden=false;$photo.hidden=true;$('captureEmpty').hidden=true;$('captureCrosshair').hidden=false;$('captureStartCamera').hidden=true;$('captureTakePhoto').hidden=false;$('captureStopCamera').hidden=false;note('Η κάμερα λειτουργεί τοπικά. Κράτησε σταθερά το κινητό και πάτησε Λήψη.',true);
 }catch(error){stopCamera();note(error instanceof Error?`Πρόσβαση κάμερας: ${error.message}. Δοκίμασε εισαγωγή φωτογραφίας.`:'Αδύνατο άνοιγμα κάμερας.');}}
function canvasBlob(canvas:HTMLCanvasElement){return new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Αποτυχία συμπίεσης εικόνας.')),'image/jpeg',.87));}
async function consumePhoto(source:Blob){if(busy)return;busy=true;try{
 if(source.size>24_000_000)throw Error('Η φωτογραφία υπερβαίνει τα 24 MB.');
 const bitmap=await createImageBitmap(source);try{if(bitmap.width<9||bitmap.height<8||bitmap.width*bitmap.height>60_000_000)throw Error('Μη αποδεκτή ανάλυση φωτογραφίας.');
 const sample=document.createElement('canvas');sample.width=128;sample.height=96;const ctx=sample.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Canvas μη διαθέσιμο.');ctx.drawImage(bitmap,0,0,128,96);
 const quality=analyzeImagePixels(ctx.getImageData(0,0,128,96).data,128,96,bitmap.width,bitmap.height);
 const limited=document.createElement('canvas'),scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));limited.width=Math.max(1,Math.round(bitmap.width*scale));limited.height=Math.max(1,Math.round(bitmap.height*scale));limited.getContext('2d')!.drawImage(bitmap,0,0,limited.width,limited.height);
 const encoded=await canvasBlob(limited),url=URL.createObjectURL(encoded),id=`shot-${(++sequence).toString(36)}`;
 const shot:CaptureShot={id,kind,quality,timestamp:new Date().toISOString(),corners:[]};
 scene.shots=addShot(scene,shot).shots;scene.revision++;blobs.set(id,{url,blob:encoded});activeShot=id;
 const others=scene.shots.filter(s=>s.id!==id&&s.kind!==kind);
 const similar=others.some(x=>hammingHash(x.quality.hash,quality.hash)<5);
 note(quality.status==='retake'?`⚠ Συνιστάται επανάληψη: ${quality.warnings.join(' ')}`:similar?'Προσοχή: μοιάζει πολύ με προηγούμενη λήψη. Προτίμησε διαφορετική γωνία.':quality.warnings.length?`Λήψη για έλεγχο: ${quality.warnings.join(' ')}`:'✓ Καταχωρίστηκε λήψη. Συνέχισε από διαφορετική γωνία.',quality.status==='ok'&&!similar);
 render();
 }finally{bitmap.close();}}
 catch(e){note(e instanceof Error?e.message:'Η εικόνα δεν μπορεί να διαβαστεί.');}finally{busy=false;}}
function takePhoto(){if(!stream||!$video.videoWidth)return note('Η κάμερα δεν έχει ακόμη εικόνα.');const c=document.createElement('canvas');c.width=$video.videoWidth;c.height=$video.videoHeight;c.getContext('2d')!.drawImage($video,0,0);canvasBlob(c).then(b=>{stopCamera();return consumePhoto(b);}).catch(e=>note(String(e)));}
function applyAnchor(){try{const edgeIndex=Number($<HTMLSelectElement>('captureAnchorWall').value),measuredCm=Number($<HTMLInputElement>('captureAnchorCm').value);const anchor=validateAnchor(edgeIndex,measuredCm);
 window.dispatchEvent(new CustomEvent('fitspace:apply-anchor',{detail:{...anchor,respond:(result:{ok:boolean;message:string})=>{if(result.ok){scene.anchor=anchor;scene.revision++;$('captureAnchorStatus').textContent=`✓ ${measuredCm} cm επιβεβαιωμένα στον τοίχο CAD. ${result.message}`;render();note('Η πραγματική μέτρηση εφαρμόστηκε στην κάτοψη. Δεν αποτελεί αυτόματη φωτομέτρηση.',true);}else note(result.message);}}}));
 }catch(e){note(e instanceof Error?e.message:'Μη έγκυρη μέτρηση.');}}
function clearShots(){stopCamera();eraseUrls();scene.shots=[];scene.anchor=null;scene.revision++;activeShot=null;kind='overview';$<HTMLInputElement>('captureAnchorCm').value='';note('Οι φωτογραφίες διαγράφηκαν από τη μνήμη αυτής της συνεδρίας.',true);render();}
function exportManifest(){const content=JSON.stringify(metadataExport(scene),null,2),blob=new Blob([content],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='fitspace-capture-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),4000);note('Η αναφορά δεν περιλαμβάνει φωτογραφίες, EXIF ή συντεταγμένες GPS.',true);}
$('captureOpen').addEventListener('click',open);$('captureClose').addEventListener('click',close);
$('captureViews').addEventListener('click',e=>{const b=(e.target as Element).closest<HTMLButtonElement>('[data-capture-kind]');if(b)chooseKind(b.dataset.captureKind as ShotKind);});
$('captureStartCamera').addEventListener('click',startCamera);$('captureStopCamera').addEventListener('click',()=>{stopCamera();render();});$('captureTakePhoto').addEventListener('click',takePhoto);
$('captureUploadButton').addEventListener('click',()=>$<HTMLInputElement>('captureFileInput').click());
$('captureFileInput').addEventListener('change',async()=>{const input=$<HTMLInputElement>('captureFileInput');for(const file of Array.from(input.files||[]).slice(0,8)){await consumePhoto(file);const next=nextGuide(scene.shots);if(next)kind=next.kind;}input.value='';render();});
$('capturePhotos').addEventListener('click',e=>{const target=(e.target as Element),remove=target.closest<HTMLElement>('[data-remove-shot]');if(remove){const id=remove.dataset.removeShot!;const entry=blobs.get(id);if(entry){URL.revokeObjectURL(entry.url);blobs.delete(id);}scene.shots=removeShot(scene,id).shots;scene.revision++;if(activeShot===id)activeShot=null;render();return;}
 const open=target.closest<HTMLElement>('[data-show-shot]');if(open){activeShot=open.dataset.showShot||null;stopCamera();render();}});
$photo.addEventListener('click',e=>{if(!activeShot)return;const r=$photo.getBoundingClientRect(),ratio=Math.min(r.width/$photo.naturalWidth,r.height/$photo.naturalHeight);if(!Number.isFinite(ratio)||ratio<=0)return;const w=$photo.naturalWidth*ratio,h=$photo.naturalHeight*ratio,left=r.left+(r.width-w)/2,top=r.top+(r.height-h)/2;
 const x=(e.clientX-left)/w,y=(e.clientY-top)/h;if(x<0||x>1||y<0||y>1)return;
 const next=markCorner(scene,activeShot,x,y);scene.shots=next.shots;scene.revision++;render();note('Επισημάνθηκε ορατή γωνία. Τα σημεία είναι χειροκίνητες ενδείξεις, όχι αυτόματη ανίχνευση.',true);});
$('captureRemovePins').addEventListener('click',()=>{const shot=scene.shots.find(s=>s.id===activeShot);if(!shot)return;shot.corners=[];scene.revision++;render();});
$('captureApplyAnchor').addEventListener('click',applyAnchor);$('captureExport').addEventListener('click',exportManifest);$('captureClear').addEventListener('click',clearShots);
$('captureOverlay').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}});
window.addEventListener('pagehide',()=>{stopCamera();eraseUrls();});
render();