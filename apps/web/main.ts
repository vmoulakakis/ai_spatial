import {initial,createStore,derive,cm,conflicts,type Scene,type Wall,type Axis,type EntityField} from "../../packages/geometry-core/index.js";
import {evaluateFit} from "../../packages/fit-rules/index.js";
type View="scan"|"plan"|"space"|"fit";
const $=(id:string)=>document.getElementById(id)!;
const safe=(value:string)=>value.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]||c));
const fmt=(v:number)=>new Intl.NumberFormat("el-GR",{maximumFractionDigits:1}).format(v);
const numeric=(value:string)=>Number(value.replace(",","."));
const names:Record<Wall,string>={north:"Πάνω τοίχος",east:"Δεξιά πλευρά",south:"Κάτω τοίχος",west:"Αριστερή πλευρά"};
let start=initial();
try{const raw=localStorage.getItem("fitspace-p0");if(raw){const candidate=JSON.parse(raw) as Scene;const solved=derive(candidate);if(solved.widthM>0&&solved.depthM>0&&Number.isFinite(solved.areaM2))start=candidate;}}catch{}
const store=createStore(start);
let selected:Wall="north",view:View="plan",yaw=40,panel:"canvas"|"editor"="canvas";
const notice=(s:string)=>{$("notice").textContent=s;};
const operate=(fn:()=>unknown,success:string)=>{try{fn();notice(success);render();}catch(e){notice(e instanceof Error?e.message:"Αδύνατη ενέργεια.");}};
const walls:Wall[]=["north","east","south","west"];
function plan(s:Scene):string{
 const g=derive(s),k=155,p=85,w=g.widthM*k,h=g.depthM*k;
 const coords=[[p,p,p+w,p],[p+w,p,p+w,p+h],[p+w,p+h,p,p+h],[p,p+h,p,p]];
 const segments=walls.map((id,i)=>{
  const c=coords[i],x=(c[0]+c[2])/2,y=(c[1]+c[3])/2;
  const shift=i===0?-26:i===1?34:i===2?38:-39;
  const tx=i%2===0?x:x+shift,ty=i%2===0?y+shift:y;
  const conflict=conflicts(s).some(q=>q.walls.includes(id));
  return '<g><line class="wall '+(selected===id?"selected ":"")+(conflict?"conflict":"")+'" data-wall="'+id+'" x1="'+c[0]+'" y1="'+c[1]+'" x2="'+c[2]+'" y2="'+c[3]+'"/><text x="'+tx+'" y="'+ty+'" text-anchor="middle">'+fmt(cm(g.walls[id].valueM))+' cm</text></g>';
 }).join("");
 const item=(e:Scene["item"],className:string)=>'<rect class="'+className+'" x="'+(p+e.xM*k)+'" y="'+(p+e.zM*k)+'" width="'+e.widthM*k+'" height="'+e.depthM*k+'" rx="4"><title>'+safe(e.label)+'</title></rect>';
 return '<svg data-testid="floorplan" role="img" aria-label="Κάτοψη, έκδοση '+g.revision+'" viewBox="0 0 '+(w+p*2)+' '+(h+p*2)+'"><defs><pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#557366" stroke-width=".5"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)"/><rect class="floor" x="'+p+'" y="'+p+'" width="'+w+'" height="'+h+'"/>'+g.obstacles.map(o=>item(o as Scene["item"],"obstacle")).join("")+item(g.item,"item")+segments+'</svg>';
}
function threeD(s:Scene):string{
 const g=derive(s),angle=yaw*Math.PI/180,scale=130;
 const projection=(x:number,y:number,z:number)=>({x:scale*(x*Math.cos(angle)-z*Math.sin(angle)),y:scale*((x*Math.sin(angle)+z*Math.cos(angle))*.52-y*.59)});
 const vertices=g.vertices.map(p=>projection(p.xM,0,p.zM)),tops=g.vertices.map(p=>projection(p.xM,g.heightM,p.zM));
 const poly=(pts:{x:number;y:number}[],fill:string)=>'<polygon points="'+pts.map(p=>p.x+','+p.y).join(" ")+'" fill="'+fill+'" stroke="#b8d9b7" stroke-width="2"/>';
 const box=(e:Scene["item"])=>{const x=e.xM,z=e.zM,w=e.widthM,d=e.depthM,h=e.heightM;
 const b=[projection(x,0,z),projection(x+w,0,z),projection(x+w,0,z+d),projection(x,0,z+d)];
 const t=[projection(x,h,z),projection(x+w,h,z),projection(x+w,h,z+d),projection(x,h,z+d)];
 return poly([b[0],b[1],t[1],t[0]],"#9fbd70")+poly([b[1],b[2],t[2],t[1]],"#88a956")+poly(t,"#c7ed83");};
 const points=[...vertices,...tops];const xx=points.map(p=>p.x),yy=points.map(p=>p.y);
 const x=Math.min(...xx)-70,y=Math.min(...yy)-70,w=Math.max(...xx)-x+70,h=Math.max(...yy)-y+70;
 return '<svg data-testid="room3d" role="img" aria-label="Τρισδιάστατη προβολή έκδοσης '+g.revision+'" viewBox="'+x+' '+y+' '+w+' '+h+'">'+poly(vertices,"#284940")+walls.map((wall,i)=>poly([vertices[i],vertices[(i+1)%4],tops[(i+1)%4],tops[i]],"#598f7977")).join("")+g.obstacles.map(o=>box(o as Scene["item"])).join("")+box(g.item)+'</svg>';
}
function field(kind:"item"|"obstacle",label:string,key:EntityField,value:number):string{
 return '<label class="field">'+label+'<input data-kind="'+kind+'" data-field="'+key+'" type="number" step=".1" value="'+cm(value)+'" aria-label="'+label+' '+kind+' σε εκατοστά"></label>';
}
function objectFields(kind:"item"|"obstacle",s:Scene):string{
 const e=kind==="item"?s.item:s.obstacles[0];
 const descriptors:[string,EntityField][]=[["Θέση X","xM"],["Θέση Y","zM"],["Πλάτος","widthM"],["Βάθος","depthM"],["Ύψος","heightM"]];
 if(kind==="item")descriptors.push(["Περιθώριο","clearanceM"]);
 return '<div class="fieldgrid">'+descriptors.map(([label,key])=>field(kind,label,key,(e as Scene["item"])[key])).join("")+'</div>';
}
function inspector(s:Scene):string{
 const g=derive(s);
 if(view==="scan")return '<div class="label">CAPTURE / P1</div><h2>AI Photo Coach</h2><p>Δεν έχει υλοποιηθεί σάρωση ή AI εκτίμηση. Η χειροκίνητη κάτοψη λειτουργεί χωρίς κάμερα.</p><button class="primary" data-view="plan">Ξεκίνα με κάτοψη</button>';
 if(view==="space")return '<div class="label">3D / SHARED GRAPH</div><h2>Ίδια γεωμετρία</h2><p>Πλάτος '+fmt(cm(g.widthM))+' cm · Βάθος '+fmt(cm(g.depthM))+' cm</p><p>Ισομετρική προβολή από ένα canonical scene model. Όχι φωτορεαλιστική ανακατασκευή.</p><button class="primary" data-view="plan">Διόρθωση διαστάσεων</button>';
 if(view==="fit"){const f=evaluateFit(s);return '<div class="label">PHYSICAL FIT / NO COMMERCE</div><h2>'+f.status+'</h2><p>'+f.reasons.map(safe).join("<br>")+'</p><p>Ελάχιστη απόσταση: '+fmt(f.minimumClearanceCm)+' cm</p><h3>Δοκιμαστικό αντικείμενο</h3>'+objectFields("item",s)+'<button class="primary" data-confirm-item '+(s.item.confirmed?"disabled":"")+'>Επιβεβαίωση διαστάσεων αντικειμένου</button><p class="minor">Απλός έλεγχος περιγράμματος και εμποδίων· όχι πιστοποίηση ασφάλειας, θυρών ή πρόσβασης.</p>';}
 const chosen=s.walls[selected];
 const conflictCards=conflicts(s).map(c=>'<div class="conflict" role="alert"><strong>Ασυμφωνία '+c.axis+'</strong><p>'+c.centimetres.join(" / ")+' cm</p>'+c.walls.map((wall,i)=>'<button data-resolve="'+c.axis+':'+wall+'">Κράτησε '+names[wall]+' ('+c.centimetres[i]+' cm)</button>').join("")+'</div>').join("");
 return '<div class="label">DIMENSION EDITOR / LIVE</div>'+conflictCards+'<h3>Επίλεξε τοίχο</h3><div class="wallgrid">'+walls.map(id=>'<button class="'+(selected===id?"selected":"")+'" data-select="'+id+'" aria-pressed="'+(selected===id)+'">'+names[id]+'<strong>'+fmt(cm(s.walls[id].valueM))+' cm</strong></button>').join("")+'</div><label class="field">Μέτρηση '+names[selected]+' · cm<input id="wallCm" type="number" inputmode="decimal" min=".1" step=".1" value="'+cm(chosen.valueM)+'"></label><button class="primary" data-apply>Εφαρμογή μέτρησης ↗</button><p class="minor">'+(chosen.confirmed?"Επιβεβαιωμένο από χρήστη":"Ενδεικτική διάσταση — όχι πραγματική μέτρηση")+'</p><hr><h3>Μετρημένη αναφορά</h3>'+(s.reference?'<p>'+safe(s.reference)+'</p>':'<input id="reference" aria-label="Περιγραφή μετρημένης αναφοράς" placeholder="π.χ. Μετροταινία 240 cm"><button class="secondary" data-calibrate>Καταχώριση αναφοράς</button>')+'<hr><h3>Εμπόδιο</h3>'+objectFields("obstacle",s);
}
function render(){
 const s=store.get(),g=derive(s),f=evaluateFit(s),h=store.history();
 const titles:Record<View,string>={scan:"Μέτρηση χωρίς υποθέσεις.",plan:"Ο χώρος σου. Με ακρίβεια στις αλλαγές.",space:"Ένας χώρος. Δύο συνεπείς προβολές.",fit:"Δοκίμασε διαστάσεις. Όχι υποθέσεις."};
 $("heading").textContent=titles[view];$("revision").textContent="REV "+g.revision;
 const stats:[string,string][]=[["ΠΛΑΤΟΣ",fmt(cm(g.widthM))+" cm"],["ΒΑΘΟΣ",fmt(cm(g.depthM))+" cm"],["ΕΜΒΑΔΟΝ",fmt(g.areaM2)+" m²"],["FIT CHECK",f.status==="NEEDS_CONFIRMATION"?"?":f.status==="DOES_NOT_FIT"?"×":"✓"]];
 $("stats").innerHTML=stats.map(([k,v])=>'<div class="stat"><span>'+k+'</span><strong>'+v+'</strong></div>').join("");
 $("canvasTitle").textContent=view==="space"?"3D / ISOMETRIC ROOM":view==="scan"?"CAPTURE / MANUAL MODE":"2D / FLOOR PLAN";
 $("stage").innerHTML=view==="space"?threeD(s)+'<label class="yaw">Περιστροφή 3D <input id="yaw" type="range" min="-150" max="150" value="'+yaw+'"></label>':view==="scan"?'<div class="scan-visual">◎<p>AI scan · P1<br>Δεν έχουν μεταφορτωθεί φωτογραφίες.</p></div>':plan(s);
 $("inspector").innerHTML=inspector(s);
 const container=document.querySelector<HTMLElement>(".columns")!;
 container.classList.toggle("panel-canvas",panel==="canvas");
 container.classList.toggle("panel-editor",panel==="editor");
 document.querySelectorAll<HTMLButtonElement>("[data-panel]").forEach(b=>{const isCurrent=b.dataset.panel===panel;b.classList.toggle("active",isCurrent);b.setAttribute("aria-selected",String(isCurrent));});
 ($("undo") as HTMLButtonElement).disabled=!h.undo;($("redo") as HTMLButtonElement).disabled=!h.redo;
 document.querySelectorAll<HTMLButtonElement>("[data-view]").forEach(b=>{b.classList.toggle("active",b.dataset.view===view);if(b.dataset.view===view)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});
 try{localStorage.setItem("fitspace-p0",JSON.stringify(s));}catch{notice("Δεν είναι διαθέσιμη η τοπική αποθήκευση.");}
}
document.addEventListener("click",event=>{
 const b=(event.target as Element).closest<HTMLElement>("[data-view],[data-panel],[data-select],[data-wall],[data-apply],[data-calibrate],[data-resolve],[data-confirm-item],#undo,#redo,#reset");if(!b)return;
 if(b.dataset.view){view=b.dataset.view as View;panel=view==="fit"||view==="scan"?"editor":"canvas";render();return;}
 if(b.dataset.panel){panel=b.dataset.panel as "canvas"|"editor";render();return;}
 if(b.dataset.select||b.dataset.wall){selected=(b.dataset.select||b.dataset.wall) as Wall;panel="editor";render();return;}
 if(b.dataset.apply!==undefined){operate(()=>store.editWall(selected,numeric(($("wallCm") as HTMLInputElement).value)),"Ενημερώθηκαν κάτοψη, 3D και fit check.");return;}
 if(b.dataset.calibrate!==undefined){operate(()=>store.setReference(($("reference") as HTMLInputElement).value),"Καταχωρίστηκε η αναφορά.");return;}
 if(b.dataset.resolve){const [axis,wall]=b.dataset.resolve.split(":");operate(()=>store.resolve(axis as Axis,wall as Wall),"Η σύγκρουση επιλύθηκε.");return;}
 if(b.dataset.confirmItem!==undefined){operate(()=>store.confirmItem(),"Οι διαστάσεις δηλώθηκαν.");return;}
 if(b.id==="undo"){store.undo();render();return;}
 if(b.id==="redo"){store.redo();render();return;}
 if(b.id==="reset"){store.reset();view="plan";panel="canvas";render();}
});
document.addEventListener("change",event=>{
 const e=event.target as HTMLInputElement;
 if(e.id==="yaw"){yaw=Number(e.value);render();return;}
 if(e.dataset.kind&&e.dataset.field)operate(()=>store.editEntity(e.dataset.kind as "item"|"obstacle",e.dataset.field as EntityField,numeric(e.value)),"Ενημερώθηκε το αντικείμενο.");
});
render();
if("serviceWorker" in navigator&&(location.protocol==="https:"||location.hostname==="localhost"))navigator.serviceWorker.register("/sw.js").catch(()=>{});
