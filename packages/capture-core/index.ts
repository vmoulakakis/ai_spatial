/** FitSpace V7: conservative, deterministic client-side capture guidance.
 * No photogrammetry, camera pose, wall-length prediction, or AI inference.
 */
export type ShotKind = 'overview'|'left'|'right'|'opposite'|'ceiling'|'floor';
export type ShotStatus = 'ok'|'review'|'retake';
export interface ShotGuide {kind:ShotKind;title:string;instruction:string;priority:number;}
export const SHOT_GUIDES:readonly ShotGuide[] = [
 {kind:'overview',title:'01 · Είσοδος',instruction:'Στάσου στην είσοδο. Κράτησε και τις δύο γωνίες τοίχου–δαπέδου μέσα στο κάδρο.',priority:1},
 {kind:'left',title:'02 · Αριστερή γωνία',instruction:'Κινήσου αριστερά και στόχευσε διαγώνια. Κράτησε ορατή τη συμβολή δύο τοίχων και το δάπεδο.',priority:2},
 {kind:'right',title:'03 · Δεξιά γωνία',instruction:'Κινήσου δεξιά. Φωτογράφισε τις απέναντι γωνίες με επικάλυψη προς την προηγούμενη λήψη.',priority:3},
 {kind:'opposite',title:'04 · Αντίθετη πλευρά',instruction:'Στάσου απέναντι από την είσοδο. Συμπερίλαβε πόρτες, παράθυρα και όρια δαπέδου.',priority:4},
 {kind:'ceiling',title:'05 · Οροφή (αν χρειάζεται)',instruction:'Φωτογράφισε τις ενώσεις τοίχων–οροφής για ύψος και κρυμμένες γωνίες.',priority:5},
 {kind:'floor',title:'06 · Δάπεδο (αν χρειάζεται)',instruction:'Πλησίασε τα χαμηλά σημεία που καλύπτουν έπιπλα. Μην υποθέτεις τι κρύβεται πίσω τους.',priority:6}
];
export interface ShotQuality {
 brightness:number; clippedDark:number; clippedBright:number; detailScore:number;
 width:number;height:number;status:ShotStatus;warnings:string[];hash:string;
}
export interface CaptureShot {id:string;kind:ShotKind;quality:ShotQuality;timestamp:string;corners:{x:number;y:number}[];}
export interface CalibrationAnchor {edgeIndex:number;measuredCm:number;source:'manual_tape_or_laser';}
export interface CaptureSession {revision:number;shots:CaptureShot[];anchor:CalibrationAnchor|null;}
const clamp=(v:number)=>Math.min(1,Math.max(0,v));
const noGeo = (v:number)=>Number.isFinite(v)&&v>=0&&v<=1;
export function validateAnchor(edgeIndex:number,measuredCm:number):CalibrationAnchor {
 if(!Number.isInteger(edgeIndex)||edgeIndex<0||edgeIndex>39)throw Error('Επίλεξε έγκυρο τοίχο κάτοψης.');
 if(!Number.isFinite(measuredCm)||measuredCm<10||measuredCm>3000||Math.abs(measuredCm*10-Math.round(measuredCm*10))>1e-6)throw Error('Μέτρηση: 10–3000 cm, βήμα 0,1 cm.');
 return {edgeIndex,measuredCm,source:'manual_tape_or_laser'};
}
export function analyzeImagePixels(rgba:Uint8ClampedArray,width:number,height:number,originalWidth=width,originalHeight=height):ShotQuality {
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<9||height<8||rgba.length!==width*height*4)throw Error('Μη έγκυρα pixels εικόνας.');
 const gray=new Float64Array(width*height);let sum=0,dark=0,bright=0;
 for(let k=0;k<gray.length;k++){
  const n=k*4,y=.2126*rgba[n]+.7152*rgba[n+1]+.0722*rgba[n+2];gray[k]=y;sum+=y;if(y<16)dark++;if(y>240)bright++;
 }
 const total=width*height,avg=sum/total;
 // Laplacian edge energy is only a texture heuristic, not a calibrated blur metric.
 let energy=0,count=0;
 for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
  const i=y*width+x;const edge=4*gray[i]-gray[i-1]-gray[i+1]-gray[i-width]-gray[i+width];energy+=Math.abs(edge);count++;
 }
 const detailScore=Math.round((energy/Math.max(1,count))*10)/10;
 // 8x8 differential perceptual hash (safe, never an identity or pixel archive).
 const sample=(col:number,row:number)=>gray[Math.min(height-1,Math.floor((row+.5)*height/8))*width+Math.min(width-1,Math.floor((col+.5)*width/9))];
 let hash='';for(let row=0;row<8;row++)for(let col=0;col<8;col++)hash+=sample(col,row)>sample(col+1,row)?'1':'0';
 const warnings:string[]=[];
 if(Math.min(originalWidth,originalHeight)<720)warnings.push('Χαμηλή ανάλυση: προτίμησε μεγαλύτερη φωτογραφία.');
 if(avg<43)warnings.push('Πολύ σκοτεινή λήψη: άναψε φως ή πλησίασε στο παράθυρο.');
 if(avg>224)warnings.push('Πολύ φωτεινή λήψη: απόφυγε τον έντονο οπίσθιο φωτισμό.');
 if(dark/total>.55||bright/total>.55)warnings.push('Μεγάλο τμήμα της εικόνας είναι υπερβολικά σκοτεινό ή φωτεινό.');
 if(detailScore<7)warnings.push('Λίγες ορατές λεπτομέρειες: έλεγξε την εστίαση και τις γωνίες.');
 const serious=Math.min(originalWidth,originalHeight)<480||avg<28||avg>240||dark/total>.78||bright/total>.78;
 const status:ShotStatus=serious?'retake':warnings.length?'review':'ok';
 return {brightness:Math.round(avg),clippedDark:Math.round(dark/total*1000)/10,clippedBright:Math.round(bright/total*1000)/10,detailScore,width:originalWidth,height:originalHeight,status,warnings,hash};
}
export function hammingHash(a:string,b:string):number{
 if(a.length!==64||b.length!==64||/[^01]/.test(a+b))throw Error('Μη έγκυρο fingerprint.');
 let d=0;for(let i=0;i<64;i++)if(a[i]!==b[i])d++;return d;
}
export function nextGuide(shots:CaptureShot[]):ShotGuide|null {
 const types=new Set(shots.filter(s=>s.quality.status!=='retake').map(s=>s.kind));
 return SHOT_GUIDES.find(g=>!types.has(g.kind))||null;
}
export function captureReadiness(session:CaptureSession){
 const accepted=session.shots.filter(s=>s.quality.status!=='retake'),kinds=new Set(accepted.map(s=>s.kind));
 const coreKinds=['overview','left','right','opposite'] as const;
 const coreMissing=coreKinds.filter(s=>!kinds.has(s));
 const nearDuplicate=session.shots.some((s,i)=>session.shots.some((t,j)=>j<i&&t.kind!==s.kind&&hammingHash(t.quality.hash,s.quality.hash)<5));
 return {views:kinds.size,total:session.shots.length,coreMissing,nearDuplicate,hasAnchor:!!session.anchor,
  usableForHumanReview:coreMissing.length===0&&!nearDuplicate&&!!session.anchor,
  canInferMetric3D:false as const};
}
export function addShot(session:CaptureSession,shot:CaptureShot):CaptureSession {
 if(session.shots.length>=24)throw Error('Μέγιστο 24 λήψεις ανά προσωρινή συνεδρία.');
 if(!SHOT_GUIDES.some(s=>s.kind===shot.kind)||!/^shot-[a-z\d-]+$/.test(shot.id)||session.shots.some(s=>s.id===shot.id))throw Error('Μη έγκυρη λήψη.');
 if(shot.corners.some(p=>!noGeo(p.x)||!noGeo(p.y)))throw Error('Οι ενδείξεις γωνιών πρέπει να βρίσκονται εντός εικόνας.');
 return {...session,revision:session.revision+1,shots:[...session.shots,structuredClone(shot)]};
}
export function removeShot(session:CaptureSession,id:string):CaptureSession {
 return {...session,revision:session.revision+1,shots:session.shots.filter(s=>s.id!==id)};
}
export function markCorner(session:CaptureSession,id:string,x:number,y:number):CaptureSession {
 if(!noGeo(x)||!noGeo(y))throw Error('Σημείο εκτός εικόνας.');
 return {...session,revision:session.revision+1,shots:session.shots.map(s=>s.id===id?{...s,corners:[...s.corners.slice(-7),{x:Math.round(clamp(x)*1000)/1000,y:Math.round(clamp(y)*1000)/1000}]}:s)};
}
export function metadataExport(s:CaptureSession){
 // Never export image pixels, object URLs, EXIF/GPS, or camera hardware details.
 const {views,coreMissing,hasAnchor,usableForHumanReview}=captureReadiness(s);
 return {format:'fitspace-capture-v7',version:1,unit:'cm',status:'GUIDED_CAPTURE_NOT_RECONSTRUCTED',
  privacy:'Photos retained only in live browser session, not included in export',
  sceneProposal:null,calibration:s.anchor,views,coreMissing,hasAnchor,usableForHumanReview,
  shots:s.shots.map(x=>({id:x.id,kind:x.kind,quality:{...x.quality,hash:undefined},corners:x.corners,timestamp:x.timestamp}))};
}