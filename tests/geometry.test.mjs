import test from "node:test";
import assert from "node:assert/strict";
import {initial,createStore,derive,cm,editWall,resolveConflict,conflicts,aiSuggestion,editEntity,setReference,confirmItem} from "../dist/packages/geometry-core/index.js";
import {evaluateFit} from "../dist/packages/fit-rules/index.js";
test("260 to 240 cm updates canonical vertices, opposite wall, area, perimeter and fit revision",()=>{
 const store=createStore(),baseline=derive(store.get());assert.equal(cm(baseline.widthM),260);assert.equal(baseline.areaM2,5.2);
 const next=store.editWall("north",240),g=derive(next);
 assert.equal(g.revision,1);assert.equal(cm(g.widthM),240);assert.equal(cm(g.walls.south.valueM),240);
 assert.equal(cm(g.vertices[2].xM),240);assert.equal(g.areaM2,4.8);assert.equal(g.perimeterM,8.8);
 assert.equal(g.walls.north.confirmed,true);assert.equal(g.walls.south.confirmed,false);
 assert.equal(evaluateFit(next).revision,g.revision);
});
test("undo redo remains monotonic for async revision tokens",()=>{
 const store=createStore();const a=store.editWall("north",240).revision;
 const b=store.undo();assert.ok(b.revision>a);assert.equal(cm(derive(b).widthM),260);
 const c=store.redo();assert.ok(c.revision>b.revision);assert.equal(cm(derive(c).widthM),240);
 store.undo();store.editWall("north",225);assert.equal(store.history().redo,0);
});
test("conflicting confirmed measurements do not overwrite a protected anchor",()=>{
 let s=editWall(initial(),"north",240);s=editWall(s,"south",260);
 assert.equal(conflicts(s).length,1);assert.equal(cm(derive(s).widthM),240);
 assert.equal(evaluateFit(s).status,"NEEDS_CONFIRMATION");assert.equal(cm(s.walls.south.valueM),260);
 s=resolveConflict(s,"width","south");
 assert.equal(conflicts(s).length,0);assert.equal(cm(derive(s).widthM),260);
 assert.equal(s.walls.north.confirmed,false);
});
test("stale AI suggestion cannot overwrite user edit or undo",()=>{
 const store=createStore(),token=store.get().revision;
 store.editWall("north",240);
 assert.equal(store.ai({baseRevision:token,wall:"north",centimetres:290}).reason,"stale_revision");
 const later=store.get().revision;store.undo();
 assert.equal(store.ai({baseRevision:later,wall:"north",centimetres:290}).accepted,false);
});
test("AI cannot replace a confirmed dimension",()=>{
 const s=editWall(initial(),"north",240),r=aiSuggestion(s,{baseRevision:s.revision,wall:"north",centimetres:260});
 assert.equal(r.accepted,false);assert.equal(r.reason,"confirmed_anchor");
});
test("uncalibrated or uncertain dimension never passes as verified",()=>{
 let s=initial();assert.equal(evaluateFit(s).status,"NEEDS_CONFIRMATION");
 s=editWall(s,"north",240);s=editWall(s,"east",200);
 s=setReference(s,"Μετροταινία τοίχου");assert.equal(evaluateFit(s).status,"NEEDS_CONFIRMATION");
 s=confirmItem(s);assert.equal(evaluateFit(s).status,"FITS_ESTIMATED");
});
test("confirmed out-of-bounds object and obstacle collision fail",()=>{
 let s=editWall(initial(),"north",240);s=editWall(s,"east",200);s=setReference(s,"Laser");s=confirmItem(s);
 s=editEntity(s,"item","xM",225);assert.equal(evaluateFit(s).status,"DOES_NOT_FIT");
 s=editEntity(s,"item","xM",10);s=editEntity(s,"item","zM",160);
 assert.equal(evaluateFit(s).status,"DOES_NOT_FIT");
 assert.ok(evaluateFit(s).reasons.some(r=>r.includes("Εμπόδιο")));
});
test("reject invalid wall values and missing reference",()=>{
 const original=initial();
 for(const invalid of [0,-1,NaN,Infinity,2001])assert.throws(()=>editWall(original,"north",invalid));
 assert.throws(()=>setReference(original,"unverified"));
 assert.equal(original.revision,0);
});
test("100 rectangular edits preserve closure and derived room area",()=>{
 let s=initial();
 for(let i=0;i<100;i++){
  const width=100+(i*17)%700,depth=110+(i*23)%600;
  s=editWall(s,"north",width);s=editWall(s,"east",depth);
  const d=derive(s);assert.equal(d.conflicts.length,0);
  assert.ok(Math.abs(d.areaM2-width*depth/10000)<1e-9);
  assert.equal(cm(d.vertices[2].xM),width);assert.equal(cm(d.vertices[2].zM),depth);
  assert.equal(cm(d.walls.south.valueM),width);assert.equal(cm(d.walls.west.valueM),depth);
 }
});
