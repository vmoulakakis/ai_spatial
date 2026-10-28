import {demoDesigner,createDesignerStore,metrics,movePoint,moveWall,setEdgeLength,setPointLock,setEdgeLock,setSnap,insertPoint,deletePoint,snapValue,type DesignerScene} from '../../packages/geometry-core/designer.js';
type Selection={type:'point'|'wall';index:number};
type Camera={x:number;y:number;w:number;h:number};
type Drag={pointerId:number;type:'point'|'wall'|'pan';index:number;scene:DesignerScene;preview:DesignerScene;world:{x:number;y:number};client:{x:number;y:number};camera:Camera;didMove:boolean};
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const number=(id:string)=>Number(($<HTMLInputElement>(id).value).replace(',','.'));
const fmt=(n:number,digits=1)=>new Intl.NumberFormat('el-GR',{minimumFractionDigits:0,maximumFractionDigits:digits}).format(n);
let state=demoDesigner();try{const raw=localStorage.getItem('fitspace-v5-design');if(raw){const saved=JSON.parse(raw);metrics(saved);state=saved;}}catch{}
const store=createDesignerStore(state);
let selection:Selection={type:'point',index:1},view:'2d'|'3d'='2d',drawer=false,mode:'select'|'pan'='select';
let drag:Drag|null=null;
let current=store.get();
let camera:Camera={x:-90,y:-90,w:650,h:560};
function fitCamera(scene:DesignerScene){const b=metrics(scene).bounds,margin=85;const w=Math.max(430,b.maxX-b.minX+margin*2),h=Math.max(350,b.maxZ-b.minZ+margin*2);camera={x:(b.maxX+b.minX-w)/2,y:(b.maxZ+b.minZ-h)/2,w,h};}
fitCamera(current);
const info=(message:string,bad=false)=>{const e=$('notice'),s=$('stageStatus');e.textContent=message;e.classList.toggle('error',bad);s.textContent=message;s.classList.toggle('error',bad);};
function dims(scene:DesignerScene){const m=metrics(scene);return m;}
const safe=(v:string)=>v.replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]||ch));
function planSVG(scene:DesignerScene){
 const m=dims(scene),pts=scene.points;const polygon=pts.map(p=>`${p.xCm},${p.zCm}`).join(' ');
 const pane=$('drawing'),screenScale=Math.max(.1,Math.min(pane.clientWidth/camera.w,pane.clientHeight/camera.h));
 const handleR=Math.max(7,9/screenScale),hitR=Math.max(19,23/screenScale),labelSize=Math.max(13,12.5/screenScale),boxHeight=Math.max(24,25/screenScale);
 const edges=m.edges.map(e=>{
  const a=pts[e.index],b=pts[(e.index+1)%pts.length],len=e.lengthCm,dx=b.xCm-a.xCm,dz=b.zCm-a.zCm;
  const nx=-dz/Math.max(1,len),ny=dx/Math.max(1,len),cx=(a.xCm+b.xCm)/2+nx*29,cy=(a.zCm+b.zCm)/2+ny*29;
  const chosen=selection.type==='wall'&&selection.index===e.index;
  const label=`${fmt(len)} cm${e.locked?' 🔒':''}`;
  const box=Math.max(77,label.length*labelSize*.61+18/screenScale);
  return `<g data-edge="${e.index}" role="button" tabindex="0" aria-label="Τοίχος ${safe(e.from)}–${safe(e.to)} ${fmt(len)} εκατοστά"><line class="${chosen?'edge-active':'outline'}" x1="${a.xCm}" y1="${a.zCm}" x2="${b.xCm}" y2="${b.zCm}"/><line class="edge-target" x1="${a.xCm}" y1="${a.zCm}" x2="${b.xCm}" y2="${b.zCm}"/><line class="dim-line" x1="${cx-nx*14}" y1="${cy-ny*14}" x2="${cx+nx*14}" y2="${cy+ny*14}"/><rect x="${cx-box/2}" y="${cy-boxHeight/2}" width="${box}" height="${boxHeight}" rx="6" class="dim-bg ${chosen?'active':''}"/><text class="dim-label ${chosen?'active':''}" style="font-size:${labelSize}px" x="${cx}" y="${cy}">${label}</text></g>`;
 }).join('');
 const points=pts.map((p,index)=>{const chosen=selection.type==='point'&&selection.index===index;return `<g data-vertex="${index}" role="button" tabindex="0" aria-label="Μετακίνηση σημείου ${safe(p.id)}. X ${fmt(p.xCm)} Y ${fmt(p.zCm)} εκατοστά"><circle class="handle-target" cx="${p.xCm}" cy="${p.zCm}" r="${hitR}"/><circle class="handle ${chosen?'active':''} ${p.locked?'locked':''}" cx="${p.xCm}" cy="${p.zCm}" r="${handleR}"/><text class="corner-label" style="font-size:${labelSize}px" x="${p.xCm+handleR+6}" y="${p.zCm-handleR-4}">${safe(p.id)}${p.locked?'🔒':''}</text></g>`;}).join('');
 return `<svg id="cad-svg" data-testid="designer-canvas" role="img" aria-label="Διαδραστική κάτοψη με ${pts.length} σημεία" viewBox="${camera.x} ${camera.y} ${camera.w} ${camera.h}" preserveAspectRatio="xMidYMid meet"><defs><pattern id="micro" patternUnits="userSpaceOnUse" width="10" height="10"><path d="M10 0H0V10" fill="none" stroke="#7fac92" stroke-width=".28"/></pattern><pattern id="major" patternUnits="userSpaceOnUse" width="50" height="50"><rect width="50" height="50" fill="url(#micro)"/><path d="M50 0H0V50" fill="none" stroke="#8fc1a2" stroke-width=".7"/></pattern></defs><rect x="-3000" y="-3000" width="6000" height="6000" fill="url(#major)"/><polygon class="floor" points="${polygon}"/>${edges}${points}</svg>`;
}
function threeSVG(scene:DesignerScene){const pts=scene.points;const project=(p:{xCm:number;zCm:number},height:number)=>({x:(p.xCm-p.zCm)*.66,y:(p.xCm+p.zCm)*.32-height*.58});const floor=pts.map(p=>project(p,0)),top=pts.map(p=>project(p,scene.heightCm));
 const all=[...floor,...top],minX=Math.min(...all.map(x=>x.x)),maxX=Math.max(...all.map(x=>x.x)),minY=Math.min(...all.map(x=>x.y)),maxY=Math.max(...all.map(x=>x.y));
 const poly=(arr:{x:number;y:number}[],fill:string)=>`<polygon points="${arr.map(p=>p.x+','+p.y).join(' ')}" fill="${fill}" stroke="#add2ac" stroke-width="1.5"/>`;
 return `<svg data-testid="designer-3d" role="img" aria-label="Ισομετρική επισκόπηση της ίδιας γεωμετρίας" viewBox="${minX-80} ${minY-80} ${Math.max(340,maxX-minX+160)} ${Math.max(300,maxY-minY+160)}" preserveAspectRatio="xMidYMid meet">${poly(floor,'#31564c')}${floor.map((p,i)=>poly([p,floor[(i+1)%floor.length],top[(i+1)%top.length],top[i]],i%2===0?'#648c7899':'#8daa9490')).join('')}${floor.map((p,i)=>`<text x="${p.x+8}" y="${p.y-8}" class="corner-label">${safe(pts[i].id)}</text>`).join('')}</svg>`;
}
function paint(scene:DesignerScene){current=scene;const m=dims(scene),edge=selection.type==='wall'?m.edges[selection.index]:null,point=selection.type==='point'?scene.points[selection.index]:null;
 $('drawing').innerHTML=view==='2d'?planSVG(scene):threeSVG(scene);
 $('metricFirst').textContent=fmt(m.edges[0].lengthCm)+' cm';
 $('metricSelected').textContent=edge?fmt(edge.lengthCm)+' cm':point?`X ${fmt(point.xCm)} / Y ${fmt(point.zCm)}`:'—';
 $('metrics').innerHTML=`<div><span>ΕΜΒΑΔΟΝ</span><strong>${fmt(m.areaM2,2)} m²</strong></div><div><span>ΠΕΡΙΜΕΤΡΟΣ</span><strong>${fmt(m.perimeterCm)} cm</strong></div><div><span>ΓΩΝΙΕΣ</span><strong>${scene.points.length}</strong></div>`;
 $('selectionTitle').textContent=point?`Σημείο ${point.id}`:edge?`Τοίχος ${edge.from} → ${edge.to}`:'Επιλογή';
 $('selectionDesc').textContent=point?`Ζωντανή θέση: X ${fmt(point.xCm)} cm · Y ${fmt(point.zCm)} cm. Σύρε απευθείας το σημείο στον καμβά.`:edge?`Μήκος ${fmt(edge.lengthCm)} cm · Γωνία ${fmt(edge.angleDeg)}°. Σύρε το σώμα του τοίχου κάθετα.`:'Επίλεξε σημείο ή τοίχο.';
 ($<HTMLInputElement>('pointX')).value=point?String(point.xCm):'';
 ($<HTMLInputElement>('pointZ')).value=point?String(point.zCm):'';
 ($<HTMLInputElement>('lockPoint')).checked=!!point?.locked;
 ($<HTMLInputElement>('wallLength')).value=edge?String(edge.lengthCm):'';
 ($<HTMLInputElement>('lockLength')).checked=!!edge?.locked;
 $('pointProperties').classList.toggle('hide',!point);
 $('wallProperties').classList.toggle('hide',!edge);
 $('revision').textContent=`REV ${scene.revision}`;
 $('snapLabel').textContent=scene.snapCm===0?'FREE':scene.snapCm+' cm';
}
function refresh(){const s=store.get();paint(s);const h=store.history();for(const id of ['undo','undoTool'])($<HTMLButtonElement>(id)).disabled=!h.undo;for(const id of ['redo','redoTool'])($<HTMLButtonElement>(id)).disabled=!h.redo;
 ($<HTMLSelectElement>('gridStep')).value=String(s.snapCm);
 $('inspector').classList.toggle('open',drawer);$('mobileToggle').setAttribute('aria-expanded',String(drawer));$('mobileToggle').textContent=drawer?'✕ Κλείσιμο':'✎ Διαστάσεις';
 $('view2D').setAttribute('aria-pressed',String(view==='2d'));$('view3D').setAttribute('aria-pressed',String(view==='3d'));
 $('selectTool').setAttribute('aria-pressed',String(mode==='select'));$('panTool').setAttribute('aria-pressed',String(mode==='pan'));
 try{localStorage.setItem('fitspace-v5-design',JSON.stringify(s));}catch{info('Δεν είναι διαθέσιμη η τοπική αποθήκευση.',true);}
}
function apply(callback:()=>DesignerScene,message:string){try{callback();info(message);refresh();}catch(e){info(e instanceof Error?e.message:'Μη επιτρεπτή αλλαγή.',true);}}
function mapPointer(e:PointerEvent){const svg=document.querySelector<SVGSVGElement>('#cad-svg');if(!svg)return null;const ctm=svg.getScreenCTM();if(!ctm)return null;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(ctm.inverse());return {x:p.x,y:p.y};}
function snapped(scene:DesignerScene,v:number){return snapValue(v,scene.snapCm);}
const stage=$('stage');
stage.addEventListener('pointerdown',e=>{if(e.target instanceof Element&&e.target.closest('button'))return;
 const target=e.target as Element,vertex=target.closest<SVGGElement>('[data-vertex]'),edge=target.closest<SVGGElement>('[data-edge]');
 if(view!=='2d')return;
 if(mode==='pan'||(!vertex&&!edge)){
  if(!document.querySelector('#cad-svg'))return;drag={pointerId:e.pointerId,type:'pan',index:-1,scene:store.get(),preview:store.get(),world:mapPointer(e)||{x:0,y:0},client:{x:e.clientX,y:e.clientY},camera:{...camera},didMove:false};
 }else{
  const type=vertex?'point':'wall',index=Number((vertex||edge)!.getAttribute(type==='point'?'data-vertex':'data-edge'));
  selection={type,index};drag={pointerId:e.pointerId,type,index,scene:store.get(),preview:store.get(),world:mapPointer(e)||{x:0,y:0},client:{x:e.clientX,y:e.clientY},camera:{...camera},didMove:false};paint(current);
 }
 stage.setPointerCapture(e.pointerId);e.preventDefault();
});
stage.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.pointerId)return;
 const d=drag;if(Math.hypot(e.clientX-d.client.x,e.clientY-d.client.y)<2&&!d.didMove)return;
 d.didMove=true;
 if(d.type==='pan'){
  const svg=document.querySelector<SVGSVGElement>('#cad-svg');const rect=svg?.getBoundingClientRect();const sx=rect?.width||800,sy=rect?.height||600;
  camera={...d.camera,x:d.camera.x-(e.clientX-d.client.x)*d.camera.w/sx,y:d.camera.y-(e.clientY-d.client.y)*d.camera.h/sy};paint(current);return;
 }
 const pt=mapPointer(e);if(!pt)return;
 try{
  const candidate=d.type==='point'?movePoint(d.scene,d.index,snapped(d.scene,pt.x),snapped(d.scene,pt.y)):
    (()=>{const a=d.scene.points[d.index],b=d.scene.points[(d.index+1)%d.scene.points.length],len=Math.hypot(b.xCm-a.xCm,b.zCm-a.zCm);
     const nx=(b.zCm-a.zCm)/len,ny=-(b.xCm-a.xCm)/len,normal=(pt.x-d.world.x)*nx+(pt.y-d.world.y)*ny;
     return moveWall(d.scene,d.index,snapped(d.scene,normal));})();
  d.preview=candidate;paint(candidate);const m=metrics(candidate);
  const adjacent=d.type==='point'?m.edges.filter(x=>x.index===d.index||x.index===(d.index+m.edges.length-1)%m.edges.length):m.edges.filter(x=>x.index===d.index||x.index===(d.index+1)%m.edges.length||x.index===(d.index+m.edges.length-1)%m.edges.length);
  const p=d.type==='point'?candidate.points[d.index]:null;
  info(`${p?`Σημείο ${p.id}: X ${fmt(p.xCm)} cm · Y ${fmt(p.zCm)} cm · `:''}${adjacent.map(w=>`${w.from}–${w.to}: ${fmt(w.lengthCm)} cm`).join('  |  ')}`);
 }catch(err){info(err instanceof Error?err.message:'Μη έγκυρη μετακίνηση.',true);}
});
function finishPointer(e:PointerEvent,cancel=false){if(!drag||e.pointerId!==drag.pointerId)return;const d=drag;drag=null;
 try{if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);}catch{}
 if(!cancel&&d.didMove&&d.type!=='pan'&&JSON.stringify(d.preview.points)!==JSON.stringify(d.scene.points))apply(()=>store.commit(d.preview),'Η μετακίνηση αποθηκεύτηκε ως μία ενέργεια.');
 else refresh();
}
stage.addEventListener('pointerup',e=>finishPointer(e));stage.addEventListener('pointercancel',e=>finishPointer(e,true));
$('drawing').addEventListener('keydown',e=>{
 const event=e as KeyboardEvent;const target=event.target as Element;const vertex=target.closest('[data-vertex]'),edge=target.closest('[data-edge]');if(!vertex&&!edge)return;
 const type=vertex?'point':'wall',index=Number((vertex||edge)!.getAttribute(type==='point'?'data-vertex':'data-edge'));
 if(event.key==='Enter'||event.key===' '){event.preventDefault();selection={type,index};drawer=true;refresh();return;}
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
 event.preventDefault();const step=event.shiftKey?10:1,dx=event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0,dz=event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0;
 selection={type,index};apply(()=>{const s=store.get();const candidate=type==='point'?movePoint(s,index,s.points[index].xCm+dx,s.points[index].zCm+dz):moveWall(s,index,dx||dz);return store.commit(candidate);},'Μετακίνηση με τα πλήκτρα.');
 document.querySelector<SVGElement>(`[data-${type==='point'?'vertex':'edge'}="${index}"]`)?.focus();
});
$('applyPoint').addEventListener('click',()=>apply(()=>store.commit(movePoint(store.get(),selection.index,number('pointX'),number('pointZ'))),'Ορίστηκε ακριβής θέση σε εκατοστά.'));
$('lockPoint').addEventListener('change',()=>apply(()=>store.commit(setPointLock(store.get(),selection.index,$<HTMLInputElement>('lockPoint').checked)),'Αλλάχθηκε το κλείδωμα σημείου.'));
$('applyLength').addEventListener('click',()=>apply(()=>store.commit(setEdgeLength(store.get(),selection.index,number('wallLength'))),'Εφαρμόστηκε το ακριβές μήκος τοίχου.'));
$('lockLength').addEventListener('change',()=>apply(()=>store.commit(setEdgeLock(store.get(),selection.index,$<HTMLInputElement>('lockLength').checked)),'Αλλάχθηκε το κλείδωμα μήκους.'));
$('splitWall').addEventListener('click',()=>apply(()=>{const next=store.commit(insertPoint(store.get(),selection.index));selection={type:'point',index:(selection.index+1)%next.points.length};return next;},'Προστέθηκε ενδιάμεσο σημείο.'));
$('deletePoint').addEventListener('click',()=>apply(()=>{const next=store.commit(deletePoint(store.get(),selection.index));selection={type:'point',index:Math.min(selection.index,next.points.length-1)};return next;},'Το σημείο αφαιρέθηκε.'));
$('gridStep').addEventListener('change',()=>apply(()=>store.commit(setSnap(store.get(),number('gridStep'))),'Ενημερώθηκε το πλέγμα.'));
for(const id of ['undo','undoTool'])$(id).addEventListener('click',()=>{store.undo();info('Αναίρεση.');refresh();});
for(const id of ['redo','redoTool'])$(id).addEventListener('click',()=>{store.redo();info('Επαναφορά.');refresh();});
$('reset').addEventListener('click',()=>{store.reset();selection={type:'point',index:1};fitCamera(store.get());refresh();info('Φορτώθηκε το ενδεικτικό δωμάτιο Γ.');});
$('mobileToggle').addEventListener('click',()=>{drawer=!drawer;refresh();});
for(const [id,next] of [['view2D','2d'],['view3D','3d']] as const)$(id).addEventListener('click',()=>{view=next;refresh();info(view==='2d'?'Άμεση επεξεργασία σημείων και τοίχων.':'3D προεπισκόπηση — επεξεργασία στην 2D κάτοψη.');});
for(const [id,next] of [['selectTool','select'],['panTool','pan']] as const)$(id).addEventListener('click',()=>{mode=next;refresh();});
function zoom(v:number){camera={...camera,x:camera.x+(camera.w-camera.w*v)/2,y:camera.y+(camera.h-camera.h*v)/2,w:camera.w*v,h:camera.h*v};paint(current);}
$('zoomIn').addEventListener('click',()=>zoom(.8));$('zoomOut').addEventListener('click',()=>zoom(1.25));
for(const id of ['fitView','fitTool'])$(id).addEventListener('click',()=>{fitCamera(store.get());paint(current);});
$('gridTool').addEventListener('click',()=>{const steps=[0,1,5,10],v=store.get().snapCm;apply(()=>store.commit(setSnap(store.get(),steps[(steps.indexOf(v)+1)%steps.length])),'Άλλαξε το snap.');});
$('exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({format:'fitspace-designer-v5',unit:'cm',scene:store.get()},null,2)],{type:'application/json'});const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='fitspace-room.json';a.click();URL.revokeObjectURL(u);info('Εξήχθη το γεωμετρικό σχέδιο σε JSON.');});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(drag){const d=drag;drag=null;paint(d.scene);info('Ακυρώθηκε η μετακίνηση.');}else if(drawer){drawer=false;refresh();}}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();store.undo();refresh();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();store.redo();refresh();}});
refresh();