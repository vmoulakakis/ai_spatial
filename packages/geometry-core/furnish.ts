/** V6 editable furniture footprints. Coordinate unit: centimetres; no assumed photo scale. */
import type { DesignerScene } from './designer.js';
export type FurnitureKind='sofa'|'table'|'desk';
export interface FurnitureItem {id:string;kind:FurnitureKind;xCm:number;zCm:number;widthCm:number;depthCm:number;heightCm:number;rotationDeg:number;color:string}
export interface FurnishingScene {revision:number;items:FurnitureItem[]}
export type FootprintPoint={xCm:number;zCm:number};
const clone=<T>(v:T):T=>structuredClone(v);
const round=(n:number)=>Math.round(n*10)/10;
const validNum=(v:number,min:number,max:number,label:string)=>{if(!Number.isFinite(v)||v<min||v>max)throw Error(`${label}: εκτός ορίων ${min}–${max}.`);return round(v);};
export const emptyFurnishing=():FurnishingScene=>({revision:0,items:[]});
export function footprint(item:FurnitureItem):FootprintPoint[]{
 const rad=item.rotationDeg*Math.PI/180,c=Math.cos(rad),s=Math.sin(rad);
 return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>{const x=u*item.widthCm/2,z=v*item.depthCm/2;return {xCm:item.xCm+x*c-z*s,zCm:item.zCm+x*s+z*c};});
}
function cross(a:FootprintPoint,b:FootprintPoint,p:FootprintPoint){return (b.xCm-a.xCm)*(p.zCm-a.zCm)-(b.zCm-a.zCm)*(p.xCm-a.xCm);}
function between(a:number,b:number,p:number){return p>=Math.min(a,b)-1e-7&&p<=Math.max(a,b)+1e-7;}
function on(a:FootprintPoint,b:FootprintPoint,p:FootprintPoint){return Math.abs(cross(a,b,p))<1e-7&&between(a.xCm,b.xCm,p.xCm)&&between(a.zCm,b.zCm,p.zCm);}
function inside(poly:FootprintPoint[],p:FootprintPoint){let result=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[j],b=poly[i];if(on(a,b,p))return true;
  if((a.zCm>p.zCm)!==(b.zCm>p.zCm) && p.xCm<(b.xCm-a.xCm)*(p.zCm-a.zCm)/(b.zCm-a.zCm)+a.xCm)result=!result;
 }return result;
}
function segments(a:FootprintPoint,b:FootprintPoint,c:FootprintPoint,d:FootprintPoint){
 const s1=cross(a,b,c),s2=cross(a,b,d),s3=cross(c,d,a),s4=cross(c,d,b);
 return ((s1>1e-7&&s2< -1e-7)||(s1< -1e-7&&s2>1e-7))&&((s3>1e-7&&s4< -1e-7)||(s3< -1e-7&&s4>1e-7))||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b);
}
function edgesIntersect(a:FootprintPoint[],b:FootprintPoint[]){for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)if(segments(a[i],a[(i+1)%a.length],b[j],b[(j+1)%b.length]))return true;return false;}
export function validateFurnitureItem(item:FurnitureItem):void{
 if(!['sofa','table','desk'].includes(item.kind)||!/^[a-zA-Z0-9_-]{1,32}$/.test(item.id))throw Error('Μη έγκυρο είδος επίπλου.');
 for(const [value,min,max,label] of [[item.widthCm,20,500,'Πλάτος'],[item.depthCm,20,500,'Βάθος'],[item.heightCm,20,350,'Ύψος'],[item.xCm,-3000,3000,'X'],[item.zCm,-3000,3000,'Z'],[item.rotationDeg,-360,360,'Περιστροφή']] as const)validNum(value,min,max,label);
 if(!/^#[0-9A-Fa-f]{6}$/.test(item.color))throw Error('Μη έγκυρο χρώμα.');
}
export function validateFurniture(room:DesignerScene,scene:FurnishingScene):void{
 if(scene.items.length>30)throw Error('Όριο 30 αντικειμένων.');
 const ids=new Set<string>(),roomPoly=room.points.map(p=>({xCm:p.xCm,zCm:p.zCm}));
 for(const item of scene.items){validateFurnitureItem(item);if(ids.has(item.id))throw Error('Διπλό αναγνωριστικό επίπλου.');ids.add(item.id);
  const poly=footprint(item);
  if(poly.some(p=>!inside(roomPoly,p))||edgesIntersect(roomPoly,poly))throw Error(`Το ${item.kind} δεν χωρά ολόκληρο μέσα στην κάτοψη.`);
 }
 for(let i=0;i<scene.items.length;i++)for(let j=i+1;j<scene.items.length;j++){
  const a=footprint(scene.items[i]),b=footprint(scene.items[j]);
  if(edgesIntersect(a,b)||a.some(p=>inside(b,p))||b.some(p=>inside(a,p)))throw Error('Τα έπιπλα επικαλύπτονται.');
 }
}
export function furnishItem(scene:FurnishingScene,room:DesignerScene,kind:FurnitureKind):FurnishingScene{
 const dims:Record<FurnitureKind,[number,number,number,string]>={sofa:[160,75,78,'#dcae80'],table:[90,60,74,'#afcabc'],desk:[120,58,74,'#bf9d77']};
 const [widthCm,depthCm,heightCm,color]=dims[kind];
 const id=`item${Math.max(0,...scene.items.map(x=>Number(x.id.slice(4))||0))+1}`;
 const xs=room.points.map(p=>p.xCm),zs=room.points.map(p=>p.zCm),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
 for(let z=minZ+depthCm/2+10;z<=maxZ-depthCm/2-10;z+=20)for(let x=minX+widthCm/2+10;x<=maxX-widthCm/2-10;x+=20){
  const item={id,kind,xCm:round(x),zCm:round(z),widthCm,depthCm,heightCm,rotationDeg:0,color};
  const candidate={revision:scene.revision+1,items:[...scene.items,item]};try{validateFurniture(room,candidate);return candidate;}catch{}
 }
 throw Error('Δεν βρέθηκε ελεύθερη θέση για αυτό το έπιπλο.');
}
export function editFurniture(scene:FurnishingScene,room:DesignerScene,id:string,fields:Partial<Omit<FurnitureItem,'id'|'kind'>>):FurnishingScene{
 if(!scene.items.some(x=>x.id===id))throw Error('Άγνωστο έπιπλο.');
 const candidate={revision:scene.revision+1,items:scene.items.map(i=>i.id===id?{...i,...fields}:i)};
 validateFurniture(room,candidate);return candidate;
}
export function removeFurniture(scene:FurnishingScene,id:string):FurnishingScene{return {revision:scene.revision+1,items:scene.items.filter(x=>x.id!==id)};}
export function validateRoomAndFurniture(room:DesignerScene,scene:FurnishingScene){validateFurniture(room,scene);return true;}
export function createFurnishingStore(room:DesignerScene,start=emptyFurnishing()){
 validateFurniture(room,start);let now=clone(start),past:FurnishingScene[]=[],future:FurnishingScene[]=[],clock=start.revision;
 const commit=(candidate:FurnishingScene,room:DesignerScene)=>{validateFurniture(room,candidate);past.push(clone(now));future=[];now={...clone(candidate),revision:++clock};return clone(now);};
 return {get:()=>clone(now),commit,history:()=>({undo:past.length,redo:future.length}),undo:(room:DesignerScene)=>{if(past.length){const target=past.at(-1)!;validateFurniture(room,target);future.push(clone(now));now={...past.pop()!,revision:++clock};}return clone(now);},redo:(room:DesignerScene)=>{if(future.length){const target=future.at(-1)!;validateFurniture(room,target);past.push(clone(now));now={...future.pop()!,revision:++clock};}return clone(now);}};
}