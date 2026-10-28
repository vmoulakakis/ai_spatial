import {createPolygonStore,metrics,previewFit,type PolygonScene} from "../../packages/geometry-core/polygon.js";
const $=(id:string)=>document.getElementById(id)!;
const store=createPolygonStore();
let selected="v2",view:"plan"|"three"="plan";
const fmt=(value:number,digits=1)=>new Intl.NumberFormat("el-GR",{maximumFractionDigits:digits}).format(value);
const project=(x:number,z:number,y=0)=>({x:(x-z)*.78,y:(x+z)*.37-y*.8});
function plan(s:PolygonScene){
 const points=s.points.map(p=>`${p.xCm},${p.zCm}`).join(" ");
 const walls=s.points.map((p,i)=>{const q=s.points[(i+1)%s.points.length];return `<line class="edge" x1="${p.xCm}" y1="${p.zCm}" x2="${q.xCm}" y2="${q.zCm}"/>`;}).join("");
 const vertices=s.points.map(p=>`<g data-vertex="${p.id}" role="button" tabindex="0" aria-label="Επίλεξε κορυφή ${p.id}"><circle class="vertex ${p.id===selected?"active":""}" cx="${p.xCm}" cy="${p.zCm}" r="16"/><text x="${p.xCm}" y="${p.zCm-25}" text-anchor="middle">${p.id.toUpperCase()}</text></g>`).join("");
 const f=s.footprint;
 return `<svg data-testid="polygon-plan" role="group" aria-label="Επεξεργάσιμη κάτοψη πολυγώνου έκδοσης ${s.revision}" viewBox="-70 -70 520 440"><polygon class="floor" points="${points}"/>${walls}<rect class="object" x="${f.xCm}" y="${f.zCm}" width="${f.widthCm}" height="${f.depthCm}"/>${vertices}</svg>`;
}
function three(s:PolygonScene){
 const base=s.points.map(p=>project(p.xCm,p.zCm));
 const top=s.points.map(p=>project(p.xCm,p.zCm,s.heightCm));
 const shape=(ps:{x:number;y:number}[],fill:string)=>`<polygon points="${ps.map(p=>`${p.x},${p.y}`).join(" ")}" fill="${fill}" stroke="#c7ed83" stroke-width="1.5"/>`;
 const walls=base.map((p,i)=>shape([p,base[(i+1)%base.length],top[(i+1)%top.length],top[i]],"#7fac93aa")).join("");
 const all=[...base,...top],xs=all.map(p=>p.x),ys=all.map(p=>p.y);
 const left=Math.min(...xs)-45,up=Math.min(...ys)-45,width=Math.max(...xs)-left+45,height=Math.max(...ys)-up+45;
 return `<svg data-testid="polygon-3d" role="img" aria-label="Ισομετρική τρισδιάστατη προβολή της έκδοσης ${s.revision}" viewBox="${left} ${up} ${width} ${height}">${shape(base,"#35614d")}${walls}${base.map((p,i)=>`<text x="${p.x}" y="${p.y+14}" text-anchor="middle">${s.points[i].id.toUpperCase()}</text>`).join("")}</svg>`;
}
function render(){const s=store.get(),m=metrics(s),f=previewFit(s);
 $("area").textContent=fmt(m.areaM2,2)+" m²";$("perimeter").textContent=fmt(m.perimeterM,2)+" m";$("revision").textContent="REV "+m.revision;
 $("drawing").innerHTML=view==="plan"?plan(s):three(s);
 $("planBtn").setAttribute("aria-pressed",String(view==="plan"));$("threeBtn").setAttribute("aria-pressed",String(view==="three"));
 $("vertices").innerHTML=s.points.map(p=>`<button data-vertex="${p.id}" aria-pressed="${p.id===selected}">${p.id.toUpperCase()} · ${p.confirmed?"✓":"?"}</button>`).join("");
 const p=s.points.find(p=>p.id===selected)!;
 ($("xCm") as HTMLInputElement).value=String(p.xCm);($("zCm") as HTMLInputElement).value=String(p.zCm);
 $("fit").textContent=(f.footprintInside?"Ίχνος αντικειμένου εντός περιγράμματος. ":"Ίχνος αντικειμένου εκτός έγκυρου περιγράμματος. ")+"Fit: "+f.status+" (preview μόνο).";
 const h=store.history();($("undo") as HTMLButtonElement).disabled=h.undo===0;($("redo") as HTMLButtonElement).disabled=h.redo===0;
}
function pick(id:string){if(!store.get().points.some(p=>p.id===id))return;selected=id;render();$("xCm").focus();}
document.addEventListener("click",ev=>{
 const target=ev.target as Element,vertex=target.closest<HTMLElement>("[data-vertex]")?.dataset.vertex;
 if(vertex){pick(vertex);return;}
 const id=target.closest<HTMLElement>("button")?.id;if(!id)return;
 if(id==="planBtn"||id==="threeBtn"){view=id==="planBtn"?"plan":"three";render();return;}
 if(id==="undo"){store.undo();$("notice").textContent="Επαναφορά προηγούμενης γεωμετρίας.";render();return;}
 if(id==="redo"){store.redo();$("notice").textContent="Εφαρμόστηκε ξανά η αλλαγή.";render();return;}
 if(id==="reset"){store.reset();selected="v2";$("notice").textContent="Επαναφέρθηκε ο δοκιμαστικός χώρος.";render();return;}
 if(id==="apply"){try{
  const x=Number(($("xCm") as HTMLInputElement).value),z=Number(($("zCm") as HTMLInputElement).value);
  store.edit({id:selected,xCm:x,zCm:z});$("notice").textContent="Η γεωμετρία ενημερώθηκε. Οι αλλαγές συγχρονίστηκαν μεταξύ 2D/3D.";render();
 }catch(e){$("notice").textContent="Η αλλαγή απορρίφθηκε: "+(e instanceof Error?e.message:"Μη έγκυρη γεωμετρία");}
 }
});
document.addEventListener("keydown",ev=>{const target=ev.target as Element,vertex=target.closest<HTMLElement>("[data-vertex]")?.dataset.vertex;if(vertex&&(ev.key==="Enter"||ev.key===" ")){ev.preventDefault();pick(vertex);}});
render();
