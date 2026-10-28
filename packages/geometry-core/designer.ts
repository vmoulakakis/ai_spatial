/** CAD-like editable spatial graph. Canonical coordinates are centimetres, bounded to ±3000 cm.
 * Plan geometry ≠ a measured/photogrammetry-verified physical room.
 * Endpoint and edge locks are exact user-specified constraints (0.1 cm tolerance).
 */
export interface DesignPoint { id:string; xCm:number; zCm:number; locked:boolean; }
export interface DesignEdgeLock { from:string; to:string; lengthCm:number; }
export interface DesignerScene { revision:number; points:DesignPoint[]; edgeLocks:DesignEdgeLock[]; snapCm:number; heightCm:number; }
export interface DesignMetrics { areaM2:number; perimeterCm:number; edges:{index:number;from:string;to:string;lengthCm:number;angleDeg:number;locked:boolean}[]; bounds:{minX:number;minZ:number;maxX:number;maxZ:number}; }
const copy=<T>(v:T):T=>structuredClone(v);
const r1=(v:number)=>Math.round(v*10)/10;
const limit=(v:number)=>{if(!Number.isFinite(v)||Math.abs(v)>3000)throw Error('Οι συντεταγμένες πρέπει να βρίσκονται εντός ±3000 cm.');return r1(v);};
const dist=(a:DesignPoint,b:DesignPoint)=>Math.hypot(b.xCm-a.xCm,b.zCm-a.zCm);
const orientation=(a:DesignPoint,b:DesignPoint,c:DesignPoint)=>(b.xCm-a.xCm)*(c.zCm-a.zCm)-(b.zCm-a.zCm)*(c.xCm-a.xCm);
const onSegment=(a:DesignPoint,b:DesignPoint,c:DesignPoint)=>Math.abs(orientation(a,b,c))<1e-8&&c.xCm>=Math.min(a.xCm,b.xCm)-1e-8&&c.xCm<=Math.max(a.xCm,b.xCm)+1e-8&&c.zCm>=Math.min(a.zCm,b.zCm)-1e-8&&c.zCm<=Math.max(a.zCm,b.zCm)+1e-8;
function intersects(a:DesignPoint,b:DesignPoint,c:DesignPoint,d:DesignPoint){
 const ab=orientation(a,b,c),ac=orientation(a,b,d),cd=orientation(c,d,a),ce=orientation(c,d,b);
 return (ab*ac<0&&cd*ce<0)||(Math.abs(ab)<1e-8&&onSegment(a,b,c))||(Math.abs(ac)<1e-8&&onSegment(a,b,d))||(Math.abs(cd)<1e-8&&onSegment(c,d,a))||(Math.abs(ce)<1e-8&&onSegment(c,d,b));
}
const sameEdge=(l:DesignEdgeLock,a:string,b:string)=>(l.from===a&&l.to===b)||(l.from===b&&l.to===a);
export function edgeLength(s:DesignerScene,index:number){const n=s.points.length;if(!Number.isInteger(index)||index<0||index>=n)throw Error('Άγνωστος τοίχος.');return dist(s.points[index],s.points[(index+1)%n]);}
export function edgeIsLocked(s:DesignerScene,index:number){const a=s.points[index],b=s.points[(index+1)%s.points.length];return !!s.edgeLocks.find(l=>sameEdge(l,a.id,b.id));}
export function validateDesign(s:DesignerScene):void{
 if(!s||!Array.isArray(s.points)||s.points.length<3||s.points.length>40)throw Error('Απαιτούνται 3–40 σημεία.');
 if(new Set(s.points.map(p=>p.id)).size!==s.points.length)throw Error('Διπλό αναγνωριστικό σημείου.');
 for(const p of s.points){if(!Number.isFinite(p.xCm)||!Number.isFinite(p.zCm)||Math.abs(p.xCm)>3000||Math.abs(p.zCm)>3000)throw Error('Μη έγκυρο σημείο.');}
 const n=s.points.length;
 for(let i=0;i<n;i++)if(dist(s.points[i],s.points[(i+1)%n])<5)throw Error('Ο τοίχος πρέπει να έχει τουλάχιστον 5 cm.');
 for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
  if(j===i+1||(i===0&&j===n-1))continue;
  if(intersects(s.points[i],s.points[(i+1)%n],s.points[j],s.points[(j+1)%n]))throw Error('Οι τοίχοι διασταυρώνονται — η αλλαγή δεν εφαρμόστηκε.');
 }
 let twice=0;for(let i=0;i<n;i++){const a=s.points[i],b=s.points[(i+1)%n];twice+=a.xCm*b.zCm-a.zCm*b.xCm;}
 if(Math.abs(twice)<100)throw Error('Το εμβαδόν είναι σχεδόν μηδενικό.');
 for(const lock of s.edgeLocks){const i=s.points.findIndex(p=>p.id===lock.from),j=s.points.findIndex(p=>p.id===lock.to);
  if(i<0||j<0||!((i+1)%n===j||(j+1)%n===i))throw Error('Μη έγκυρο κλειδωμένο μήκος.');
  if(Math.abs(dist(s.points[i],s.points[j])-lock.lengthCm)>.11)throw Error(`Το κλειδωμένο μήκος ${lock.from}–${lock.to} δεν επιτρέπεται να αλλάξει.`);
 }
}
export function metrics(s:DesignerScene):DesignMetrics{validateDesign(s);const n=s.points.length;
 let twice=0,perimeterCm=0;const edges=s.points.map((a,index)=>{const b=s.points[(index+1)%n];const lengthCm=dist(a,b);perimeterCm+=lengthCm;twice+=a.xCm*b.zCm-a.zCm*b.xCm;return {index,from:a.id,to:b.id,lengthCm:r1(lengthCm),angleDeg:r1(Math.atan2(b.zCm-a.zCm,b.xCm-a.xCm)*180/Math.PI),locked:edgeIsLocked(s,index)};});
 const xs=s.points.map(p=>p.xCm),zs=s.points.map(p=>p.zCm);
 return {edges,areaM2:Math.round(Math.abs(twice)/20000*100)/100,perimeterCm:r1(perimeterCm),bounds:{minX:Math.min(...xs),minZ:Math.min(...zs),maxX:Math.max(...xs),maxZ:Math.max(...zs)}};
}
export function demoDesigner():DesignerScene{return {revision:0,points:[[0,0],[380,0],[380,180],[240,180],[240,300],[0,300]].map(([xCm,zCm],i)=>({id:String.fromCharCode(65+i),xCm,zCm,locked:false})),edgeLocks:[],snapCm:1,heightCm:250};}
const changed=(s:DesignerScene,fn:(n:DesignerScene)=>void):DesignerScene=>{const n=copy(s);fn(n);validateDesign(n);n.revision=s.revision+1;return n;};
export function snapValue(v:number,grid:number){if(![0,1,5,10].includes(grid))throw Error('Μη έγκυρο βήμα πλέγματος.');return grid===0?r1(v):r1(Math.round(v/grid)*grid);}
function circleIntersections(a:DesignPoint,r:number,b:DesignPoint,t:number):{x:number;z:number}[]{
 const dx=b.xCm-a.xCm,dz=b.zCm-a.zCm,d=Math.hypot(dx,dz);
 if(d<1e-7||d>r+t+1e-7||d<Math.abs(r-t)-1e-7)throw Error('Τα κλειδωμένα μήκη δεν επιτρέπουν αυτή τη μετακίνηση.');
 const x=(r*r-t*t+d*d)/(2*d),h=Math.sqrt(Math.max(0,r*r-x*x)),ux=dx/d,uz=dz/d;
 return [{x:a.xCm+x*ux-h*uz,z:a.zCm+x*uz+h*ux},{x:a.xCm+x*ux+h*uz,z:a.zCm+x*uz-h*ux}];
}
export function movePoint(s:DesignerScene,index:number,xCm:number,zCm:number):DesignerScene{
 if(!Number.isInteger(index)||index<0||index>=s.points.length)throw Error('Άγνωστο σημείο.');
 const current=s.points[index];if(current.locked)throw Error(`Το σημείο ${current.id} είναι κλειδωμένο. Ξεκλείδωσέ το για μετακίνηση.`);
 const x=limit(xCm),z=limit(zCm),n=s.points.length;
 const prev=s.points[(index+n-1)%n],next=s.points[(index+1)%n];
 const left=s.edgeLocks.find(l=>sameEdge(l,prev.id,current.id)),right=s.edgeLocks.find(l=>sameEdge(l,current.id,next.id));
 let point={x,z};
 if(left&&right){const possibilities=circleIntersections(prev,left.lengthCm,next,right.lengthCm);
  point=possibilities.reduce((best,p)=>Math.hypot(p.x-x,p.z-z)<Math.hypot(best.x-x,best.z-z)?p:best);}
 else if(left||right){const anchor=left?prev:next, radius=(left||right)!.lengthCm;const dx=x-anchor.xCm,dz=z-anchor.zCm,d=Math.hypot(dx,dz);
  if(d<1e-8)throw Error('Μετέφερε το σημείο μακριά από τη σταθερή κορυφή.');
  point={x:anchor.xCm+radius*dx/d,z:anchor.zCm+radius*dz/d};}
 return changed(s,nxt=>{nxt.points[index]={...current,xCm:limit(point.x),zCm:limit(point.z)};});
}
export function moveWall(s:DesignerScene,index:number,normalShiftCm:number):DesignerScene{
 const n=s.points.length;if(!Number.isInteger(index)||index<0||index>=n)throw Error('Άγνωστος τοίχος.');
 const a=s.points[index],b=s.points[(index+1)%n];if(a.locked||b.locked)throw Error('Ξεκλείδωσε τα δύο άκρα του τοίχου.');
 const length=dist(a,b),move=limit(normalShiftCm),dx=(b.zCm-a.zCm)/length*move,dz=-(b.xCm-a.xCm)/length*move;
 return changed(s,c=>{for(const i of [index,(index+1)%n]){const p=c.points[i];p.xCm=limit(p.xCm+dx);p.zCm=limit(p.zCm+dz);}});
}
export function setEdgeLength(s:DesignerScene,index:number,lengthCm:number):DesignerScene{
 const n=s.points.length;if(!Number.isFinite(lengthCm)||lengthCm<5||lengthCm>3000)throw Error('Μήκος τοίχου: από 5 έως 3000 cm.');
 if(!Number.isInteger(index)||index<0||index>=n)throw Error('Άγνωστος τοίχος.');
 const a=s.points[index],b=s.points[(index+1)%n],length=dist(a,b);
 if(a.locked&&b.locked)throw Error('Και τα δύο σημεία είναι κλειδωμένα.');
 return changed(s,c=>{const target=c.points[a.locked?(index+1)%n:b.locked?index:(index+1)%n],anchor=c.points[a.locked?index:b.locked?(index+1)%n:index];
  const scale=r1(lengthCm)/length,dx=target.xCm-anchor.xCm,dz=target.zCm-anchor.zCm;
  target.xCm=limit(anchor.xCm+dx*scale);target.zCm=limit(anchor.zCm+dz*scale);
  const lock=c.edgeLocks.find(l=>sameEdge(l,a.id,b.id));if(lock)lock.lengthCm=dist(c.points[index],c.points[(index+1)%n]);
 });
}
export function setPointLock(s:DesignerScene,index:number,locked:boolean){return changed(s,c=>{if(!c.points[index])throw Error('Άγνωστο σημείο.');c.points[index].locked=locked;});}
export function setEdgeLock(s:DesignerScene,index:number,locked:boolean){return changed(s,c=>{const n=c.points.length;if(!Number.isInteger(index)||index<0||index>=n)throw Error('Άγνωστος τοίχος.');const a=c.points[index],b=c.points[(index+1)%n];c.edgeLocks=c.edgeLocks.filter(l=>!sameEdge(l,a.id,b.id));if(locked)c.edgeLocks.push({from:a.id,to:b.id,lengthCm:dist(a,b)});});}
export function setSnap(s:DesignerScene,snapCm:number){return changed(s,c=>{if(![0,1,5,10].includes(snapCm))throw Error('Μη έγκυρο βήμα.');c.snapCm=snapCm;});}
export function insertPoint(s:DesignerScene,index:number){return changed(s,c=>{if(c.points.length>=40)throw Error('Μέγιστο 40 σημεία.');const n=c.points.length;if(index<0||index>=n)throw Error('Άγνωστος τοίχος.');const a=c.points[index],b=c.points[(index+1)%n],newId='P'+Math.max(1,...c.points.filter(p=>/^P\d+$/.test(p.id)).map(p=>Number(p.id.slice(1))+1));
 const lock=c.edgeLocks.find(l=>sameEdge(l,a.id,b.id));c.edgeLocks=c.edgeLocks.filter(l=>!sameEdge(l,a.id,b.id));
 const p={id:newId,xCm:r1((a.xCm+b.xCm)/2),zCm:r1((a.zCm+b.zCm)/2),locked:false};c.points.splice(index+1,0,p);
 if(lock){c.edgeLocks.push({from:a.id,to:p.id,lengthCm:dist(a,p)},{from:p.id,to:b.id,lengthCm:dist(p,b)});}
 });}
export function deletePoint(s:DesignerScene,index:number){return changed(s,c=>{if(c.points.length<=3)throw Error('Χρειάζονται τουλάχιστον τρία σημεία.');const n=c.points.length;if(!Number.isInteger(index)||index<0||index>=n)throw Error('Άγνωστο σημείο.');const p=c.points[index];if(p.locked||edgeIsLocked(c,index)||edgeIsLocked(c,(index+n-1)%n))throw Error('Ξεκλείδωσε το σημείο και τους γειτονικούς τοίχους.');c.points.splice(index,1);});}
export function createDesignerStore(start=demoDesigner()){
 validateDesign(start);let value=copy(start),past:DesignerScene[]=[],future:DesignerScene[]=[],clock=start.revision;
 const commit=(s:DesignerScene)=>{validateDesign(s);past.push(copy(value));if(past.length>100)past.shift();future=[];value={...copy(s),revision:++clock};return copy(value);};
 return {get:()=>copy(value),history:()=>({undo:past.length,redo:future.length}),commit,
  undo:()=>{if(past.length){future.push(copy(value));value={...past.pop()!,revision:++clock};}return copy(value);},
  redo:()=>{if(future.length){past.push(copy(value));value={...future.pop()!,revision:++clock};}return copy(value);},
  reset:()=>commit(demoDesigner())};
}