/** FitSpace V4 point-to-point measurement chain. The measured lengths and turns
 * are authoritative inputs; coordinates are disposable deterministic projections.
 * No photo-derived precision, fit certification or general graph optimization.
 */
export type MeasureOrigin = "user" | "example";
export interface MeasuredWall {
  id: string;
  lengthCm: number;
  turnDeg: number;
  angleConfirmed: boolean;
  origin: MeasureOrigin;
  revision: number;
}
export interface ClosureAnchor { measuredCm: number; toleranceCm: number; revision: number }
export interface MeasurementScene {
  revision: number;
  walls: MeasuredWall[];
  closure: ClosureAnchor | null;
}
export interface MeasuredPoint { id: string; xCm: number; zCm: number }
export type MeasurementIssue = "CLOSURE_CONFLICT" | "SELF_INTERSECTION" | "DEGENERATE_POLYGON";
export interface MeasurementSolution {
  revision: number;
  points: MeasuredPoint[];
  lengthsCm: number[];
  calculatedClosingCm: number | null;
  closureDifferenceCm: number | null;
  closed: boolean;
  issues: MeasurementIssue[];
  areaM2: number | null;
  perimeterM: number | null;
  allAnglesConfirmed: boolean;
}
const clone = <T>(value: T): T => structuredClone(value);
const finite = (value: number, min: number, max: number, name: string) => {
  if (!Number.isFinite(value) || value < min || value > max || Math.round(value * 10) !== value * 10) {
    throw new Error(`${name}: αναμένεται τιμή με ακρίβεια 0,1 εντός ${min}–${max}.`);
  }
  return value;
};
const turnValue = (value: number) => finite(value, -180, 180, "Γωνία");
const lengthValue = (value: number) => finite(value, .1, 3000, "Μήκος cm");
const round = (value: number) => Math.round(value * 1_000_000) / 1_000_000;
const cross = (a: MeasuredPoint, b: MeasuredPoint, c: MeasuredPoint) =>
  (b.xCm - a.xCm) * (c.zCm - a.zCm) - (b.zCm - a.zCm) * (c.xCm - a.xCm);
const onSegment = (a: MeasuredPoint, b: MeasuredPoint, c: MeasuredPoint) =>
  Math.abs(cross(a,b,c)) < 1e-7 &&
  c.xCm >= Math.min(a.xCm,b.xCm)-1e-7 && c.xCm <= Math.max(a.xCm,b.xCm)+1e-7 &&
  c.zCm >= Math.min(a.zCm,b.zCm)-1e-7 && c.zCm <= Math.max(a.zCm,b.zCm)+1e-7;
const intersects = (a: MeasuredPoint, b: MeasuredPoint, c: MeasuredPoint, d: MeasuredPoint) => {
  const ab1 = cross(a,b,c), ab2 = cross(a,b,d), cd1 = cross(c,d,a), cd2 = cross(c,d,b);
  if (Math.abs(ab1)<1e-7 && onSegment(a,b,c)) return true;
  if (Math.abs(ab2)<1e-7 && onSegment(a,b,d)) return true;
  if (Math.abs(cd1)<1e-7 && onSegment(c,d,a)) return true;
  if (Math.abs(cd2)<1e-7 && onSegment(c,d,b)) return true;
  return ((ab1>0)!==(ab2>0)) && ((cd1>0)!==(cd2>0));
};
function simplePolygon(points: MeasuredPoint[]) {
  const n = points.length;
  for (let i=0;i<n;i++) for(let j=i+1;j<n;j++) {
    if (j===i+1 || (i===0 && j===n-1)) continue;
    if (intersects(points[i],points[(i+1)%n],points[j],points[(j+1)%n])) return false;
  }
  return true;
}
export const emptyMeasurement = (): MeasurementScene => ({revision:0,walls:[],closure:null});
export function exampleMeasurement(): MeasurementScene {
  const entries: [number,number][] = [[380,0],[180,90],[140,90],[120,-90],[240,90]];
  return {revision:0,walls:entries.map(([lengthCm,turnDeg],index)=>({
    id:`w${index+1}`,lengthCm,turnDeg,angleConfirmed:false,origin:"example",revision:0
  })),closure:{measuredCm:300,toleranceCm:1,revision:0}};
}
export function solveMeasurement(scene: MeasurementScene): MeasurementSolution {
  if(!scene || !Array.isArray(scene.walls) || scene.walls.length>31) throw Error("Μη έγκυρη ακολουθία τοίχων.");
  const points: MeasuredPoint[] = [{id:"A",xCm:0,zCm:0}];
  let bearing=0;
  for(const [index,wall] of scene.walls.entries()) {
    lengthValue(wall.lengthCm);
    if(index===0 && wall.turnDeg!==0) throw Error("Ο πρώτος τοίχος ορίζει την κατεύθυνση 0°.");
    turnValue(wall.turnDeg);
    if(index) bearing+=wall.turnDeg;
    const angle = bearing * Math.PI/180, old=points[points.length-1];
    points.push({id:`P${index+1}`,xCm:round(old.xCm+wall.lengthCm*Math.cos(angle)),zCm:round(old.zCm+wall.lengthCm*Math.sin(angle))});
  }
  const last=points[points.length-1];
  const calculatedClosingCm=scene.walls.length>=2?round(Math.hypot(last.xCm,last.zCm)):null;
  const closureDifferenceCm = scene.closure && calculatedClosingCm!==null ? round(calculatedClosingCm-scene.closure.measuredCm):null;
  const issues: MeasurementIssue[]=[];
  if(scene.closure){
    lengthValue(scene.closure.measuredCm);
    finite(scene.closure.toleranceCm,.1,100,"Ανοχή κλεισίματος");
    if(scene.walls.length<2 || closureDifferenceCm===null || Math.abs(closureDifferenceCm)>scene.closure.toleranceCm+1e-7) issues.push("CLOSURE_CONFLICT");
    if(points.length>=3){
      if(!simplePolygon(points)) issues.push("SELF_INTERSECTION");
      const twiceArea=points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.xCm*q.zCm-q.xCm*p.zCm;},0);
      if(Math.abs(twiceArea)<100) issues.push("DEGENERATE_POLYGON");
    }
  }
  const closed=!!scene.closure && issues.length===0;
  const twiceArea=closed?points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.xCm*q.zCm-q.xCm*p.zCm;},0):0;
  return {revision:scene.revision,points,lengthsCm:scene.walls.map(w=>w.lengthCm),calculatedClosingCm,
    closureDifferenceCm,closed,issues,
    areaM2:closed?round(Math.abs(twiceArea)/20000):null,
    perimeterM:closed?round((scene.walls.reduce((sum,w)=>sum+w.lengthCm,0)+scene.closure!.measuredCm)/100):null,
    allAnglesConfirmed:scene.walls.slice(1).every(w=>w.angleConfirmed) && scene.walls.length>=2};
}
const edit = (scene:MeasurementScene, change:(next:MeasurementScene)=>void):MeasurementScene=>{
  const next=clone(scene);change(next);next.revision=scene.revision+1;solveMeasurement(next);return next;
};
export function addMeasuredWall(scene:MeasurementScene,lengthCm:number,turnDeg:number,angleConfirmed=false):MeasurementScene {
  return edit(scene,next=>{
    if(next.closure)throw Error("Άνοιξε πρώτα το περίγραμμα για προσθήκη τοίχου.");
    if(next.walls.length>=31)throw Error("Μέγιστο πλήθος: 31 τοίχοι πριν το κλείσιμο.");
    next.walls.push({id:`w${Math.max(0,...next.walls.map(w=>Number(w.id.slice(1))||0))+1}`,
      lengthCm:lengthValue(lengthCm),turnDeg:next.walls.length===0?0:turnValue(turnDeg),angleConfirmed:next.walls.length===0||angleConfirmed,origin:"user",revision:next.revision+1});
  });
}
export function editMeasuredWall(scene:MeasurementScene,id:string,lengthCm:number,turnDeg:number,angleConfirmed:boolean):MeasurementScene {
  return edit(scene,next=>{
    const index=next.walls.findIndex(w=>w.id===id);if(index<0)throw Error("Άγνωστος τοίχος.");
    next.walls[index]={...next.walls[index],lengthCm:lengthValue(lengthCm),turnDeg:index===0?0:turnValue(turnDeg),
      angleConfirmed:index===0||angleConfirmed,origin:"user",revision:next.revision+1};
  });
}
export function recordClosingMeasurement(scene:MeasurementScene,measuredCm:number,toleranceCm=1):MeasurementScene {
  return edit(scene,next=>{
    if(next.walls.length<2)throw Error("Χρειάζονται τουλάχιστον δύο μετρημένοι τοίχοι.");
    next.closure={measuredCm:lengthValue(measuredCm),toleranceCm:finite(toleranceCm,.1,100,"Ανοχή κλεισίματος"),revision:next.revision+1};
  });
}
export function reopenMeasurement(scene:MeasurementScene):MeasurementScene {return edit(scene,next=>{next.closure=null;});}
export function createMeasurementStore(start:MeasurementScene=emptyMeasurement()) {
  solveMeasurement(start);
  let state=clone(start),past:MeasurementScene[]=[],future:MeasurementScene[]=[],clock=state.revision;
  let lastConsistent:MeasurementScene|null=solveMeasurement(state).closed?clone(state):null;
  const commit=(next:MeasurementScene)=>{past.push(clone(state));if(past.length>100)past.shift();future=[];state={...next,revision:++clock};
    if(solveMeasurement(state).closed)lastConsistent=clone(state);return clone(state);};
  const restore=(from:MeasurementScene[],to:MeasurementScene[])=>{if(from.length){to.push(clone(state));state={...from.pop()!,revision:++clock};
    if(solveMeasurement(state).closed)lastConsistent=clone(state);}return clone(state);};
  return {get:()=>clone(state),lastConsistent:()=>lastConsistent?clone(lastConsistent):null,
    history:()=>({undo:past.length,redo:future.length}),
    add:(lengthCm:number,turnDeg:number,angleConfirmed=false)=>commit(addMeasuredWall(state,lengthCm,turnDeg,angleConfirmed)),
    edit:(id:string,lengthCm:number,turnDeg:number,angleConfirmed=false)=>commit(editMeasuredWall(state,id,lengthCm,turnDeg,angleConfirmed)),
    close:(measuredCm:number,toleranceCm=1)=>commit(recordClosingMeasurement(state,measuredCm,toleranceCm)),
    reopen:()=>commit(reopenMeasurement(state)),undo:()=>restore(past,future),redo:()=>restore(future,past),
    reset:()=>commit(emptyMeasurement()),example:()=>commit(exampleMeasurement())};
}