/** Experimental arbitrary-polygon coordinate layer. Values are integer centimetres.
 * It is NOT an independently verified constrained-wall solver or AI reconstruction.
 */
export type PointSource = "demo" | "manual" | "ai";
export interface Point { id:string; xCm:number; zCm:number; source:PointSource; confirmed:boolean; revision:number }
export interface Footprint { xCm:number; zCm:number; widthCm:number; depthCm:number; clearanceCm:number }
export interface PolygonScene { revision:number; points:Point[]; heightCm:number; reference:string|null; footprint:Footprint }
export type VertexEdit = { id:string; xCm:number; zCm:number };
export type PolygonMetrics = { revision:number; areaM2:number; perimeterM:number; vertices:{id:string;xM:number;zM:number}[]; walls:{from:string;to:string;lengthCm:number}[] };
const clone=<T>(v:T):T=>structuredClone(v);
const cross=(a:Point,b:Point,c:Point)=>(b.xCm-a.xCm)*(c.zCm-a.zCm)-(b.zCm-a.zCm)*(c.xCm-a.xCm);
const between=(a:number,b:number,c:number)=>c>=Math.min(a,b)&&c<=Math.max(a,b);
function onSegment(a:Point,b:Point,c:Point){return cross(a,b,c)===0&&between(a.xCm,b.xCm,c.xCm)&&between(a.zCm,b.zCm,c.zCm);}
function intersects(a:Point,b:Point,c:Point,d:Point){const w=cross(a,b,c),x=cross(a,b,d),y=cross(c,d,a),z=cross(c,d,b);return (w===0&&onSegment(a,b,c))||(x===0&&onSegment(a,b,d))||(y===0&&onSegment(c,d,a))||(z===0&&onSegment(c,d,b))||((w>0)!==(x>0)&&(y>0)!==(z>0));}
function validateValue(n:number){if(!Number.isInteger(n)||n<0||n>2000)throw Error("Coordinates must be integer centimetres between 0 and 2000");}
export function twiceArea(points:Point[]):number{return points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.xCm*q.zCm-q.xCm*p.zCm;},0);}
export function validatePolygon(points:Point[]):void {
 if(points.length<3||points.length>32)throw Error("Room polygon requires 3 to 32 vertices");
 if(new Set(points.map(p=>p.id)).size!==points.length)throw Error("Duplicate vertex id");
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length];validateValue(a.xCm);validateValue(a.zCm);
  if(a.xCm===b.xCm&&a.zCm===b.zCm)throw Error("Zero length wall");
 }
 if(Math.abs(twiceArea(points))<100)throw Error("Room polygon has negligible area");
 for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
  if(j===i+1||(i===0&&j===points.length-1))continue;
  if(intersects(points[i],points[(i+1)%points.length],points[j],points[(j+1)%points.length]))throw Error("Self-intersecting room polygon");
 }
}
export function metrics(s:PolygonScene):PolygonMetrics{
 validatePolygon(s.points);
 return {revision:s.revision,areaM2:Math.abs(twiceArea(s.points))/20000,
  perimeterM:s.points.reduce((sum,p,i)=>{const q=s.points[(i+1)%s.points.length];return sum+Math.hypot(q.xCm-p.xCm,q.zCm-p.zCm)/100;},0),
  vertices:s.points.map(p=>({id:p.id,xM:p.xCm/100,zM:p.zCm/100})),
  walls:s.points.map((p,i)=>{const q=s.points[(i+1)%s.points.length];return {from:p.id,to:q.id,lengthCm:Math.round(Math.hypot(q.xCm-p.xCm,q.zCm-p.zCm)*10)/10};})};
}
export function demoPolygon():PolygonScene{
 const coords:[[number,number],[number,number],[number,number],[number,number],[number,number],[number,number]]=[[0,0],[380,0],[380,180],[240,180],[240,300],[0,300]];
 return {revision:0,points:coords.map(([xCm,zCm],i)=>({id:`v${i+1}`,xCm,zCm,source:"demo",confirmed:false,revision:0})),heightCm:250,reference:null,footprint:{xCm:25,zCm:25,widthCm:100,depthCm:60,clearanceCm:10}};
}
export function moveVertex(scene:PolygonScene,edit:VertexEdit):PolygonScene{
 const next=clone(scene),p=next.points.find(p=>p.id===edit.id);if(!p)throw Error("Unknown vertex");
 validateValue(edit.xCm);validateValue(edit.zCm);
 p.xCm=edit.xCm;p.zCm=edit.zCm;p.confirmed=true;p.source="manual";p.revision=scene.revision+1;
 validatePolygon(next.points);next.revision++;return next;
}
export function applyAiVertex(scene:PolygonScene,baseRevision:number,edit:VertexEdit):{accepted:boolean;reason:string;scene:PolygonScene}{
 if(baseRevision!==scene.revision)return {accepted:false,reason:"stale_revision",scene};
 const p=scene.points.find(p=>p.id===edit.id);if(!p)return {accepted:false,reason:"unknown_vertex",scene};
 if(p.confirmed)return {accepted:false,reason:"confirmed_vertex",scene};
 const next=moveVertex(scene,edit),target=next.points.find(p=>p.id===edit.id)!;target.confirmed=false;target.source="ai";
 return {accepted:true,reason:"accepted",scene:next};
}
export function pointInside(points:Point[],xCm:number,zCm:number):boolean{
 const test={id:"check",xCm,zCm,source:"demo" as const,confirmed:false,revision:0};
 let inside=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const a=points[j],b=points[i];if(onSegment(a,b,test))return false;
  if((a.zCm>zCm)!==(b.zCm>zCm)&&xCm<(b.xCm-a.xCm)*(zCm-a.zCm)/(b.zCm-a.zCm)+a.xCm)inside=!inside;
 }
 return inside;
}
export function previewFit(s:PolygonScene){
 validatePolygon(s.points);const f=s.footprint;
 const {xCm:x,zCm:z,widthCm:w,depthCm:d,clearanceCm:c}=f;
 for(const n of [x,z,w,d,c])if(!Number.isFinite(n)||n<0)throw Error("Invalid footprint");
 if(w<=0||d<=0)throw Error("Unknown footprint dimensions");
 const bounds=[[x-c,z-c],[x+w+c,z-c],[x+w+c,z+d+c],[x-c,z+d+c]] as const;
 const corners=bounds.map(([xCm,zCm],i)=>({id:`r${i}`,xCm,zCm,source:"demo" as const,confirmed:false,revision:0}));
 let inside=corners.every(p=>pointInside(s.points,p.xCm,p.zCm));
 if(inside)for(let i=0;i<s.points.length&&inside;i++)for(let j=0;j<4&&inside;j++){
  if(intersects(s.points[i],s.points[(i+1)%s.points.length],corners[j],corners[(j+1)%4]))inside=false;
 }
 return {revision:s.revision,footprintInside:inside,status:"NEEDS_CONFIRMATION" as const,
   reasons:[inside?"Ενδεικτική τοποθέτηση εντός περιγράμματος.":"Το δοκιμαστικό περίγραμμα διασταυρώνεται με το όριο του χώρου.",
    "Απαιτούνται επιβεβαιωμένες μετρήσεις, εμπόδια, πόρτες και πρόσβαση πριν από έγκυρο fit verdict."]};
}
export function createPolygonStore(start=demoPolygon()){
 let current=clone(start),past:PolygonScene[]=[],future:PolygonScene[]=[],clock=current.revision;
 const commit=(next:PolygonScene)=>{past.push(clone(current));if(past.length>100)past.shift();future=[];current={...next,revision:++clock};return clone(current);};
 return {get:()=>clone(current),history:()=>({undo:past.length,redo:future.length}),
  edit:(change:VertexEdit)=>commit(moveVertex(current,change)),
  ai:(base:number,change:VertexEdit)=>{const r=applyAiVertex(current,base,change);return r.accepted?{...r,scene:commit(r.scene)}:r;},
  undo:()=>{if(past.length){future.push(clone(current));current={...past.pop()!,revision:++clock};}return clone(current);},
  redo:()=>{if(future.length){past.push(clone(current));current={...future.pop()!,revision:++clock};}return clone(current);},
  reset:()=>commit(demoPolygon())};
}
