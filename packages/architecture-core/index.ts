/**
 * FitSpace V8 architectural interpretation example.
 * All preset lengths are illustrative and UNCALIBRATED: not photo-derived.
 * The output is a parametric model of visually supported topology.
 */
export type Origin='illustrative'|'user-measured';
export type DimKey='leftReturnCm'|'alcoveWidthCm'|'rightReturnCm'|'frontDepthCm'|'alcoveDepthCm'|'ceilingCm'|'beamDropCm'|'beamDepthCm'|'radiatorWidthCm'|'radiatorHeightCm';
export interface Dimension {cm:number;origin:Origin;locked:boolean}
export interface ArchitecturalScene {revision:number;dimensions:Record<DimKey,Dimension>;radiatorVisible:boolean}
export interface PlanPoint{xCm:number;zCm:number}
export interface Rectangle3D {id:string;label:string;cx:number;cy:number;cz:number;w:number;h:number;d:number;kind:'wall'|'beam'|'radiator'|'floor'}
const keys:DimKey[]=['leftReturnCm','alcoveWidthCm','rightReturnCm','frontDepthCm','alcoveDepthCm','ceilingCm','beamDropCm','beamDepthCm','radiatorWidthCm','radiatorHeightCm'];
const bounds:Record<DimKey,[number,number]>={leftReturnCm:[10,450],alcoveWidthCm:[60,950],rightReturnCm:[10,450],frontDepthCm:[40,1250],alcoveDepthCm:[10,450],ceilingCm:[170,450],beamDropCm:[5,130],beamDepthCm:[5,200],radiatorWidthCm:[20,250],radiatorHeightCm:[20,180]};
const num=(n:number)=>Math.round(n*10)/10;
export function exampleArchitecture():ArchitecturalScene{
 const defaults:Record<DimKey,number>={leftReturnCm:58,alcoveWidthCm:320,rightReturnCm:62,frontDepthCm:230,alcoveDepthCm:55,ceilingCm:265,beamDropCm:39,beamDepthCm:43,radiatorWidthCm:68,radiatorHeightCm:102};
 return {revision:0,dimensions:Object.fromEntries(keys.map(k=>[k,{cm:defaults[k],origin:'illustrative',locked:false}])) as Record<DimKey,Dimension>,radiatorVisible:true};
}
export function allDimensions():DimKey[]{return [...keys];}
export function validateArchitecture(s:ArchitecturalScene):void{
 if(!s||!Number.isSafeInteger(s.revision)||s.revision<0||!s.dimensions)throw Error('Μη έγκυρο μοντέλο.');
 for(const key of keys){const d=s.dimensions[key],range=bounds[key];if(!d||!Number.isFinite(d.cm)||d.cm<range[0]||d.cm>range[1]||Math.abs(num(d.cm)-d.cm)>1e-7)throw Error('Μη έγκυρη διάσταση: '+key);if(!['illustrative','user-measured'].includes(d.origin)||typeof d.locked!=='boolean')throw Error('Μη έγκυρη προέλευση διάστασης.');}
 const v=(k:DimKey)=>s.dimensions[k].cm;
 if(v('beamDropCm')>=v('ceilingCm')-170)throw Error('Το δοκάρι αφήνει μη ρεαλιστικό καθαρό ύψος.');
 if(v('beamDepthCm')>v('frontDepthCm')+v('alcoveDepthCm'))throw Error('Το βάθος δοκαριού ξεπερνά τον χώρο.');
 if(v('radiatorWidthCm')>v('alcoveWidthCm')-10)throw Error('Το καλοριφέρ είναι ευρύτερο από τη διαθέσιμη εσοχή.');
 if(v('radiatorHeightCm')>v('ceilingCm')-30)throw Error('Το καλοριφέρ υπερβαίνει το διαθέσιμο ύψος.');
}
export function setArchitectureDimension(s:ArchitecturalScene,key:DimKey,cm:number,measured=false):ArchitecturalScene{
 if(!keys.includes(key))throw Error('Άγνωστη διάσταση.');
 if(s.dimensions[key].locked)throw Error('Η διάσταση είναι κλειδωμένη.');
 const next=structuredClone(s);next.dimensions[key]={cm:num(cm),origin:measured?'user-measured':'illustrative',locked:measured};next.revision++;
 validateArchitecture(next);return next;
}
export function lockArchitectureDimension(s:ArchitecturalScene,key:DimKey,locked:boolean):ArchitecturalScene{
 if(!keys.includes(key))throw Error('Άγνωστη διάσταση.');const next=structuredClone(s);
 if(locked&&next.dimensions[key].origin!=='user-measured')throw Error('Μόνο επιβεβαιωμένη πραγματική μέτρηση μπορεί να κλειδωθεί.');
 next.dimensions[key].locked=locked;next.revision++;validateArchitecture(next);return next;
}
export function toggleRadiator(s:ArchitecturalScene,visible:boolean):ArchitecturalScene{
 const next=structuredClone(s);next.radiatorVisible=visible;next.revision++;validateArchitecture(next);return next;
}
export function geometry(s:ArchitecturalScene){
 validateArchitecture(s);
 const v=(k:DimKey)=>s.dimensions[k].cm;
 const L=v('leftReturnCm'),A=v('alcoveWidthCm'),R=v('rightReturnCm'),D=v('frontDepthCm'),N=v('alcoveDepthCm'),W=L+A+R,H=v('ceilingCm'),BD=v('beamDropCm'),BW=v('beamDepthCm');
 const plan:PlanPoint[]=[{xCm:0,zCm:0},{xCm:W,zCm:0},{xCm:W,zCm:D},{xCm:L+A,zCm:D},{xCm:L+A,zCm:D+N},{xCm:L,zCm:D+N},{xCm:L,zCm:D},{xCm:0,zCm:D}];
 const walls:[PlanPoint,PlanPoint][]=[];
 for(let i=0;i<plan.length;i++){if(i===0)continue;walls.push([plan[i],plan[(i+1)%plan.length]]);} // no imaginary front wall
 const thickness=7;const boxes:Rectangle3D[]=[];
 walls.forEach(([a,b],index)=>{
  const dx=b.xCm-a.xCm,dz=b.zCm-a.zCm,len=Math.hypot(dx,dz);
  if(Math.abs(dx)>1e-5&&Math.abs(dz)>1e-5)throw Error('Μη ορθογωνική ακμή.');
  boxes.push({id:'wall'+index,label:'Τοίχος',cx:(a.xCm+b.xCm)/2,cy:H/2,cz:(a.zCm+b.zCm)/2,w:Math.abs(dx)>0?len:thickness,h:H,d:Math.abs(dz)>0?len:thickness,kind:'wall'});
 });
 boxes.push({id:'beam',label:'Χαμηλωμένο δοκάρι',cx:L+A/2,cy:H-BD/2,cz:D+BW/2,w:A,h:BD,d:BW,kind:'beam'});
 if(s.radiatorVisible){boxes.push({id:'radiator',label:'Καλοριφέρ – ενδεικτική θέση',cx:L+A-v('radiatorWidthCm')/2-12,cy:14+v('radiatorHeightCm')/2,cz:D+N-12,w:v('radiatorWidthCm'),h:v('radiatorHeightCm'),d:14,kind:'radiator'});}
 const allIllustrative=keys.every(k=>s.dimensions[k].origin==='illustrative');
 return {widthCm:W,depthCm:D+N,frontDepthCm:D,alcoveDepthCm:N,alcoveWidthCm:A,leftReturnCm:L,rightReturnCm:R,ceilingCm:H,beamBottomCm:H-BD,beamDepthCm:BW,plan,walls,boxes,sourceStatus:allIllustrative?'illustrative':'partially-user-measured',revision:s.revision};
}
export function asCADScene(s:ArchitecturalScene){const g=geometry(s);return {revision:g.revision,points:g.plan.map((p,i)=>({id:String.fromCharCode(65+i),xCm:p.xCm,zCm:p.zCm,locked:false})),edgeLocks:[],snapCm:1,heightCm:g.ceilingCm};}
export function createArchitectureStore(start:ArchitecturalScene=exampleArchitecture()){
 validateArchitecture(start);let value=structuredClone(start),undo:ArchitecturalScene[]=[],redo:ArchitecturalScene[]=[],clock=value.revision;
 return {get:()=>structuredClone(value),history:()=>({undo:undo.length,redo:redo.length}),commit:(next:ArchitecturalScene)=>{validateArchitecture(next);undo.push(structuredClone(value));if(undo.length>70)undo.shift();redo=[];value={...structuredClone(next),revision:++clock};return structuredClone(value);},undo:()=>{if(undo.length){redo.push(structuredClone(value));value={...undo.pop()!,revision:++clock};}return structuredClone(value);},redo:()=>{if(redo.length){undo.push(structuredClone(value));value={...redo.pop()!,revision:++clock};}return structuredClone(value);},reset:()=>{undo.push(structuredClone(value));redo=[];value={...exampleArchitecture(),revision:++clock};return structuredClone(value);}};
}