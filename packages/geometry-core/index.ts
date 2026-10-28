export type Wall = "north"|"east"|"south"|"west";
export type Axis = "width"|"depth";
export type Source = "demo"|"manual"|"ai";
export interface Measure { id:Wall; valueM:number; confirmed:boolean; source:Source; revision:number; uncertaintyM:number|null; }
export interface Rect { id:string; label:string; xM:number; zM:number; widthM:number; depthM:number; heightM:number; confirmed:boolean; }
export interface Item extends Rect { clearanceM:number; }
export interface Scene { revision:number; walls:Record<Wall,Measure>; reference:string|null; last:{widthM:number;depthM:number}; heightM:number; obstacles:Rect[]; item:Item; }
export interface Conflict { axis:Axis; walls:[Wall,Wall]; centimetres:[number,number]; }
export const cm=(m:number)=>Math.round(m*1000)/10;
const m=(value:number)=>Math.round(value*10)/1000;
const copy=<T>(obj:T):T=>structuredClone(obj);
const pairs:Record<Axis,[Wall,Wall]>={width:["north","south"],depth:["east","west"]};
const numeric=(value:number,zero=false)=>{if(!Number.isFinite(value)||value<(zero?0:0.1)||value>2000)throw Error("Invalid centimetre measurement");return m(value);};
export function initial():Scene {
 const measure=(id:Wall,valueM:number):Measure=>({id,valueM,confirmed:false,source:"demo",revision:0,uncertaintyM:null});
 return {revision:0,walls:{north:measure("north",2.6),south:measure("south",2.6),east:measure("east",2),west:measure("west",2)},reference:null,last:{widthM:2.6,depthM:2},heightM:2.5,obstacles:[{id:"obstacle",label:"Εμπόδιο",xM:.1,zM:1.55,widthM:.65,depthM:.25,heightM:.6,confirmed:false}],item:{id:"item",label:"Δοκιμαστικό αντικείμενο",xM:.8,zM:.65,widthM:1.35,depthM:.6,heightM:.75,clearanceM:.1,confirmed:false}};
}
export function conflicts(s:Scene):Conflict[] {
 return (["width","depth"] as Axis[]).flatMap(axis=>{const [a,b]=pairs[axis],x=s.walls[a],y=s.walls[b];return x.confirmed&&y.confirmed&&Math.abs(x.valueM-y.valueM)>1e-6?[{axis,walls:[a,b] as [Wall,Wall],centimetres:[cm(x.valueM),cm(y.valueM)] as [number,number]}]:[];});
}
function sync(s:Scene) {
 for(const axis of ["width","depth"] as Axis[]) {
  if(conflicts(s).some(c=>c.axis===axis))continue;
  const [a,b]=pairs[axis],x=s.walls[a],y=s.walls[b],lead=x.confirmed?x:y.confirmed?y:x;
  for(const w of [a,b])if(!s.walls[w].confirmed){s.walls[w].valueM=lead.valueM;s.walls[w].source=lead.source;s.walls[w].revision=s.revision;}
  s.last[axis==="width"?"widthM":"depthM"]=lead.valueM;
 }
}
export function derive(s:Scene) {
 const problems=conflicts(s),value=(axis:Axis)=>{if(problems.some(c=>c.axis===axis))return s.last[axis==="width"?"widthM":"depthM"];const [a,b]=pairs[axis];return s.walls[a].confirmed?s.walls[a].valueM:s.walls[b].confirmed?s.walls[b].valueM:s.walls[a].valueM;};
 const widthM=value("width"),depthM=value("depth");
 const vertices=[{xM:0,zM:0},{xM:widthM,zM:0},{xM:widthM,zM:depthM},{xM:0,zM:depthM}];
 return {revision:s.revision,widthM,depthM,heightM:s.heightM,vertices,areaM2:widthM*depthM,perimeterM:2*(widthM+depthM),conflicts:problems,walls:s.walls,obstacles:s.obstacles,item:s.item,reference:s.reference};
}
export function editWall(prev:Scene,id:Wall,centimetres:number):Scene {
 if(!Object.prototype.hasOwnProperty.call(prev.walls,id))throw Error("Unknown wall");
 const s=copy(prev);s.revision++;s.walls[id]={id,valueM:numeric(centimetres),source:"manual",confirmed:true,uncertaintyM:0,revision:s.revision};sync(s);return s;
}
export function resolveConflict(prev:Scene,axis:Axis,keep:Wall):Scene {
 if(!pairs[axis].includes(keep)||!conflicts(prev).some(c=>c.axis===axis))throw Error("No conflict");
 const s=copy(prev);s.revision++;const other=pairs[axis].find(w=>w!==keep)!;s.walls[other].confirmed=false;s.walls[other].revision=s.revision;sync(s);return s;
}
export function setReference(prev:Scene,description:string):Scene {
 if(!description.trim()||!Object.values(prev.walls).some(w=>w.confirmed))throw Error("Enter a measured wall and reference");
 const s=copy(prev);s.revision++;s.reference=description.trim().slice(0,160);return s;
}
export type EntityField="xM"|"zM"|"widthM"|"depthM"|"heightM"|"clearanceM";
export function editEntity(prev:Scene,kind:"item"|"obstacle",field:EntityField,centimetres:number):Scene {
 const s=copy(prev);s.revision++;const entity=kind==="item"?s.item:s.obstacles[0];
 if(!entity|| (field==="clearanceM" && kind!=="item"))throw Error("Invalid entity or field");
 const value=numeric(centimetres,field==="xM"||field==="zM"||field==="clearanceM");
 Object.assign(entity,{[field]:value,confirmed:true});return s;
}
export function confirmItem(prev:Scene):Scene {const s=copy(prev);s.revision++;s.item.confirmed=true;return s;}
export function aiSuggestion(prev:Scene,proposal:{baseRevision:number;wall:Wall;centimetres:number}) {
 if(proposal.baseRevision!==prev.revision)return {scene:prev,accepted:false,reason:"stale_revision"};
 if(!prev.walls[proposal.wall]||prev.walls[proposal.wall].confirmed)return {scene:prev,accepted:false,reason:"confirmed_anchor"};
 const s=copy(prev);s.revision++;s.walls[proposal.wall]={...s.walls[proposal.wall],valueM:numeric(proposal.centimetres),source:"ai",uncertaintyM:null,revision:s.revision};sync(s);
 return {scene:s,accepted:true,reason:"accepted"};
}
export function createStore(start=initial()) {
 let scene=copy(start),past:Scene[]=[],future:Scene[]=[],clock=scene.revision;const listeners=new Set<()=>void>();
 const publish=()=>{for(const fn of listeners)fn();};
 const commit=(next:Scene)=>{past.push(copy(scene));if(past.length>100)past.shift();future=[];scene={...next,revision:++clock};publish();return copy(scene);};
 return {get:()=>copy(scene),history:()=>({undo:past.length,redo:future.length}),subscribe:(fn:()=>void)=>{listeners.add(fn);return ()=>listeners.delete(fn);},
 editWall:(id:Wall,v:number)=>commit(editWall(scene,id,v)),editEntity:(kind:"item"|"obstacle",field:EntityField,v:number)=>commit(editEntity(scene,kind,field,v)),
 setReference:(d:string)=>commit(setReference(scene,d)),confirmItem:()=>commit(confirmItem(scene)),
 resolve:(axis:Axis,w:Wall)=>commit(resolveConflict(scene,axis,w)),
 ai:(p:{baseRevision:number;wall:Wall;centimetres:number})=>{const r=aiSuggestion(scene,p);return r.accepted?{...r,scene:commit(r.scene)}:r;},
 undo:()=>{if(!past.length)return copy(scene);future.push(copy(scene));scene={...past.pop()!,revision:++clock};publish();return copy(scene);},
 redo:()=>{if(!future.length)return copy(scene);past.push(copy(scene));scene={...future.pop()!,revision:++clock};publish();return copy(scene);},
 reset:()=>commit(initial())};
}