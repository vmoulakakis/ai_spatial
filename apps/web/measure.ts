import {emptyMeasurement,createMeasurementStore,solveMeasurement,type MeasurementScene,type MeasuredPoint} from "../../packages/geometry-core/measurement.js";
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const number=(id:string)=>Number(el<HTMLInputElement>(id).value);
const fmt=(v:number, digits=1)=>new Intl.NumberFormat("el-GR",{maximumFractionDigits:digits}).format(v);
let saved=emptyMeasurement();
try {const raw=localStorage.getItem("fitspace-v4-manual");if(raw){const s=JSON.parse(raw) as MeasurementScene;solveMeasurement(s);saved=s;}}catch{}
const store=createMeasurementStore(saved);
let selected:string|null=null;
let view:"2d"|"3d"="2d",panel:"canvas"|"editor"="canvas";
const say=(message:string)=>{el("notice").textContent=message;};
function update(fn:()=>unknown,message:string){try{fn();say(message);render();}catch(err){say(err instanceof Error?err.message:"Αδύνατη αλλαγή.");}}
const letter=(index:number)=>index===0?"A":index<27?String.fromCharCode(64+index):`P${index}`;
function draw(scene:MeasurementScene):string {
 const s=solveMeasurement(scene),raw=s.points;
 const xs=raw.map(p=>p.xCm),zs=raw.map(p=>p.zCm),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
 const sizeX=Math.max(1,maxX-minX),sizeZ=Math.max(1,maxZ-minZ);
 const factor=Math.min(480/sizeX,315/sizeZ,2.2);
 const px=(x:number)=>90+(x-minX)*factor,py=(z:number)=>90+(z-minZ)*factor;
 const to2=(p:MeasuredPoint)=>({x:px(p.xCm),y:py(p.zCm)});
 let objects="";
 if(view==="2d"){
  const points=raw.map(to2),coords=points.map(p=>`${p.x},${p.y}`).join(" ");
  objects+=s.closed?`<polygon points="${coords}" fill="#719b75" fill-opacity=".28" stroke="none"/>`:"";
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],midX=(a.x+b.x)/2,midY=(a.y+b.y)/2;
   const active=selected===scene.walls[i-1].id;
   objects+=`<line class="wall" stroke="${active?'#fff':'#bce487'}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/><text x="${midX}" y="${midY-13}" text-anchor="middle">${fmt(scene.walls[i-1].lengthCm)} cm</text>`;
  }
  if(points.length>2){const first=points[0],last=points[points.length-1];objects+=`<line class="closing" x1="${last.x}" y1="${last.y}" x2="${first.x}" y2="${first.y}"/>`;}
  points.forEach((p,i)=>{objects+=`<g data-point="${i}" tabindex="0" role="button" aria-label="Σημείο ${letter(i)}"><circle class="point ${i>0&&selected===scene.walls[i-1]?.id?'selected':''}" cx="${p.x}" cy="${p.y}" r="9"/><text x="${p.x+13}" y="${p.y-13}">${letter(i)}</text></g>`;});
 } else {
  // The 3D visualization is an isometric SVG rendering of the same canonical points.
  const projection=(p:MeasuredPoint,y:number)=>({x:400+(p.xCm-p.zCm)*.58*factor,y:160+(p.xCm+p.zCm)*.24*factor-y*.48*factor});
  const bottom=raw.map(p=>projection(p,0));
  const top=raw.map(p=>projection(p,250));
  const polygon=(points:{x:number;y:number}[],fill:string)=>`<polygon points="${points.map(p=>`${p.x},${p.y}`).join(' ')}" fill="${fill}" stroke="#b5daaa" stroke-width="2"/>`;
  if(s.closed){objects+=polygon(bottom,"#385b49");for(let i=0;i<bottom.length;i++)objects+=polygon([bottom[i],bottom[(i+1)%bottom.length],top[(i+1)%top.length],top[i]],"#507b6888");}
  else for(let i=1;i<bottom.length;i++)objects+=`<line x1="${bottom[i-1].x}" y1="${bottom[i-1].y}" x2="${bottom[i].x}" y2="${bottom[i].y}" stroke="#bce487" stroke-width="4"/>`;
  bottom.forEach((p,i)=>{objects+=`<circle r="5" cx="${p.x}" cy="${p.y}" fill="#f3ca83"/><text x="${p.x+8}" y="${p.y-8}">${letter(i)}</text>`;});
 }
 return `<svg data-testid="measured-geometry" role="img" aria-label="${view==='2d'?'Δισδιάστατη κάτοψη':'Ισομετρική τρισδιάστατη προεπισκόπηση'} έκδοση ${scene.revision}" viewBox="0 0 ${view==='2d'?Math.max(670,Math.round((maxX-minX)*factor+180)):850} ${view==='2d'?Math.max(470,Math.round((maxZ-minZ)*factor+180)):550}">${objects}</svg>`;
}
function render(){
 const scene=store.get(),s=solveMeasurement(scene),h=store.history();
 const hasConflict=s.issues.length>0;
 const stateText=hasConflict?"Σύγκρουση μετρήσεων":s.closed?"Κλειστό περίγραμμα":scene.walls.length?"Ανοικτή μέτρηση":"Νέος χώρος";
 el("stats").innerHTML=[
  ["ΤΟΙΧΟΙ",`${scene.walls.length}${s.closed?'+1':''}`],
  ["ΕΜΒΑΔΟΝ",s.areaM2===null?"—":`${fmt(s.areaM2,2)} m²`],
  ["ΠΕΡΙΜΕΤΡΟΣ",s.perimeterM===null?"—":`${fmt(s.perimeterM,2)} m`],
  ["ΚΑΤΑΣΤΑΣΗ",hasConflict?"⚠ Conflict":s.closed?"✓ Closed":"↗ Open"]].map(([label,value])=>`<div class="stat"><small>${label}</small><strong>${value}</strong></div>`).join("");
 el("revision").textContent=`REV ${scene.revision}`;
 const warning=s.issues.includes("CLOSURE_CONFLICT")?`Οι επιβεβαιωμένες μετρήσεις δεν κλείνουν: διαφορά ${fmt(Math.abs(s.closureDifferenceCm||0))} cm. Διόρθωσε τον υπεύθυνο τοίχο ή την τελική πραγματική μέτρηση. Δεν αλλοιώθηκε κανένας τοίχος.`:
  s.issues.includes("SELF_INTERSECTION")?"Οι τοίχοι τέμνονται. Το περίγραμμα δεν είναι έγκυρο.":
  s.issues.includes("DEGENERATE_POLYGON")?"Το σχήμα έχει μηδενικό ή αμελητέο εμβαδό.":
  s.closed?(s.allAnglesConfirmed?"Το περίγραμμα κλείνει μαθηματικά. Η φυσική ακρίβεια δεν έχει επιβεβαιωθεί με ανεξάρτητο έλεγχο.":"Το περίγραμμα κλείνει, αλλά κάποιες γωνίες είναι ακόμη υποθέσεις — όχι μετρήσεις."):
  "Πρόσθεσε μήκη και γωνίες σημείο-σημείο. Το εμβαδόν υπολογίζεται μόνο μετά από συνεπές κλείσιμο.";
 el("banner").className=`banner ${s.closed&&!hasConflict?'good':''}`;
 el("banner").textContent=`${stateText}. ${warning}`;
 el("drawing").innerHTML=draw(scene);
 el("closingHint").textContent=s.calculatedClosingCm===null?"Πρόσθεσε τουλάχιστον δύο τοίχους.":`Υπολογιζόμενο τελευταίο μήκος: ${fmt(s.calculatedClosingCm)} cm. Μέτρησέ το ανεξάρτητα πριν το καταχωρίσεις.`;
 const walls=scene.walls;
 if(!selected||!walls.some(w=>w.id===selected))selected=walls.at(-1)?.id||null;
 el("wallList").innerHTML=walls.length?walls.map((w,i)=>`<button type="button" data-wall="${w.id}" aria-pressed="${selected===w.id}"><span>${letter(i)} → ${letter(i+1)} · ${w.angleConfirmed||i===0?'γωνία επιβεβαιωμένη':'γωνία υπόθεση'}</span><strong>${fmt(w.lengthCm)} cm</strong></button>`).join(""):'<p>Πρόσθεσε τον πρώτο τοίχο Α → Β.</p>';
 const chosen=walls.find(w=>w.id===selected)||null;
 el<HTMLInputElement>("editLength").disabled=!chosen;
 el<HTMLInputElement>("editTurn").disabled=!chosen||chosen===walls[0];
 el<HTMLInputElement>("editAngleConfirmed").disabled=!chosen||chosen===walls[0];
 el<HTMLButtonElement>("editForm").querySelector<HTMLButtonElement>("button[type=submit]")!.disabled=!chosen;
 el<HTMLInputElement>("editLength").value=chosen?String(chosen.lengthCm):"";
 el<HTMLInputElement>("editTurn").value=chosen?String(chosen.turnDeg):"0";
 el<HTMLInputElement>("editAngleConfirmed").checked=!!chosen?.angleConfirmed;
 el<HTMLInputElement>("addTurn").disabled=walls.length===0;
 el<HTMLInputElement>("addAngleConfirmed").disabled=walls.length===0;
 el<HTMLButtonElement>("addForm").querySelector<HTMLButtonElement>("button[type=submit]")!.disabled=!!scene.closure;
 el<HTMLButtonElement>("reopen").disabled=!scene.closure;
 el<HTMLButtonElement>("closeForm").querySelector<HTMLButtonElement>("button[type=submit]")!.disabled=walls.length<2;
 if(scene.closure){el<HTMLInputElement>("closeLength").value=String(scene.closure.measuredCm);el<HTMLInputElement>("tolerance").value=String(scene.closure.toleranceCm);}
 el<HTMLButtonElement>("undo").disabled=h.undo===0;el<HTMLButtonElement>("redo").disabled=h.redo===0;
 el("planBtn").setAttribute("aria-pressed",String(view==="2d"));el("threeBtn").setAttribute("aria-pressed",String(view==="3d"));
 el("canvasTab").setAttribute("aria-pressed",String(panel==="canvas"));el("editorTab").setAttribute("aria-pressed",String(panel==="editor"));
 el("workspace").className=`workspace ${panel==='canvas'?'canvas-only':'editor-only'}`;
 try{localStorage.setItem("fitspace-v4-manual",JSON.stringify(scene));}catch{say("Η τοπική αποθήκευση δεν είναι διαθέσιμη.");}
}
function onForm(id:string,callback:()=>void){el<HTMLFormElement>(id).addEventListener("submit",event=>{event.preventDefault();callback();});}
onForm("addForm",()=>update(()=>{const next=store.add(number("addLength"),number("addTurn"),el<HTMLInputElement>("addAngleConfirmed").checked);selected=next.walls.at(-1)?.id||null;},"Προστέθηκε μετρημένος τοίχος. Οι συντεταγμένες ανανεώθηκαν."));
onForm("editForm",()=>update(()=>{if(!selected)throw Error("Επίλεξε τοίχο.");store.edit(selected,number("editLength"),number("editTurn"),el<HTMLInputElement>("editAngleConfirmed").checked);},"Έγινε επανυπολογισμός όλων των επόμενων σημείων χωρίς αλλαγή των άλλων μετρήσεων."));
onForm("closeForm",()=>update(()=>store.close(number("closeLength"),number("tolerance")),"Καταχωρίστηκε η τελική μέτρηση. Έλεγξε την κατάσταση γεωμετρίας."));
el("reopen").addEventListener("click",()=>update(()=>store.reopen(),"Το περίγραμμα άνοιξε για νέες μετρήσεις."));
el("undo").addEventListener("click",()=>update(()=>store.undo(),"Αναίρεση αλλαγής."));el("redo").addEventListener("click",()=>update(()=>store.redo(),"Επαναφορά αλλαγής."));
el("example").addEventListener("click",()=>update(()=>{store.example();selected="w1";},"Φορτώθηκε ενδεικτικό δωμάτιο Γ. Οι μετρήσεις είναι demo."));
el("reset").addEventListener("click",()=>update(()=>{store.reset();selected=null;},"Νέος κενός χώρος."));
el("wallList").addEventListener("click",event=>{const button=(event.target as Element).closest<HTMLElement>("[data-wall]");if(button){selected=button.dataset.wall||null;render();}});
el("drawing").addEventListener("click",event=>{const group=(event.target as Element).closest<HTMLElement>("[data-point]");if(group){const index=Number(group.dataset.point);selected=store.get().walls[index-1]?.id||null;panel="editor";render();}});
el("drawing").addEventListener("keydown",event=>{if(event.key!=="Enter"&&event.key!==" ")return;const group=(event.target as Element).closest<HTMLElement>("[data-point]");if(group){event.preventDefault();const index=Number(group.dataset.point);selected=store.get().walls[index-1]?.id||null;panel="editor";render();}});
for(const [id,next] of [["planBtn","2d"],["threeBtn","3d"]] as const)el(id).addEventListener("click",()=>{view=next;render();});
for(const [id,next] of [["canvasTab","canvas"],["editorTab","editor"]] as const)el(id).addEventListener("click",()=>{panel=next;render();});
render();