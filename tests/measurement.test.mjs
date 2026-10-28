import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyMeasurement,exampleMeasurement,solveMeasurement,createMeasurementStore,addMeasuredWall,editMeasuredWall,recordClosingMeasurement} from '../dist/packages/geometry-core/measurement.js';
const lshape=()=>solveMeasurement(exampleMeasurement());
test('empty room reports no fake area or scale',()=>{const r=solveMeasurement(emptyMeasurement());assert.equal(r.areaM2,null);assert.equal(r.closed,false);assert.equal(r.points.length,1);});
test('measured L shape closes 9.72 m2 and 13.60 m perimeter',()=>{const r=lshape();assert.equal(r.closed,true);assert.equal(r.areaM2,9.72);assert.equal(r.perimeterM,13.6);assert.equal(r.calculatedClosingCm,300);});
test('A-B 380->320 recomputes downstream coordinates and raises locked closure conflict',()=>{
 const original=exampleMeasurement(),next=editMeasuredWall(original,'w1',320,0,true),s=solveMeasurement(next);
 assert.equal(s.points[1].xCm,320);assert.equal(s.points[2].xCm,320);
 assert.deepEqual(next.walls.map(w=>w.lengthCm),[320,180,140,120,240]);
 assert.equal(next.closure.measuredCm,300);assert.equal(s.closed,false);assert.ok(s.issues.includes('CLOSURE_CONFLICT'));
 assert.equal(s.areaM2,null);
});
test('revised closing measurement resolves conflict without overriding other confirmed lengths',()=>{
 let s=exampleMeasurement();s=editMeasuredWall(s,'w1',320,0,true);
 let r=solveMeasurement(s);assert.ok(Math.abs(r.calculatedClosingCm-300)>1);
 s=recordClosingMeasurement(s,Math.round(r.calculatedClosingCm*10)/10,1);r=solveMeasurement(s);
 assert.equal(r.closed,true);assert.deepEqual(s.walls.map(w=>w.lengthCm),[320,180,140,120,240]);
});
test('confirmed segment remains unchanged on neighboring measurement edit',()=>{
 const s=exampleMeasurement();const n=editMeasuredWall(s,'w2',190,90,true);
 assert.equal(n.walls[0].lengthCm,380);assert.equal(n.walls[1].lengthCm,190);assert.equal(n.walls[2].lengthCm,140);
 assert.equal(n.walls[1].angleConfirmed,true);
});
test('no hidden correction when two confirmed anchors disagree',()=>{
 const s=recordClosingMeasurement(exampleMeasurement(),250,.1);const r=solveMeasurement(s);
 assert.ok(r.issues.includes('CLOSURE_CONFLICT'));assert.equal(s.closure.measuredCm,250);assert.equal(s.walls[4].lengthCm,240);
});
test('undo redo use monotonic version and preserve confirmed input',()=>{
 const store=createMeasurementStore(exampleMeasurement());
 const changed=store.edit('w1',320,0,true).revision;
 const undo=store.undo();assert.ok(undo.revision>changed);assert.equal(undo.walls[0].lengthCm,380);
 const redo=store.redo();assert.ok(redo.revision>undo.revision);assert.equal(redo.walls[0].lengthCm,320);
 assert.equal(store.lastConsistent().walls[0].lengthCm,380);
});
test('editing after undo clears redo branch',()=>{
 const store=createMeasurementStore();store.add(200,0);store.add(100,90,true);store.undo();store.add(110,90,true);assert.equal(store.history().redo,0);
});
test('reject invalid values and no mutation of previous state',()=>{
 const s=exampleMeasurement();for(const value of [-1,0,NaN,Infinity,3001,123.456])assert.throws(()=>editMeasuredWall(s,'w1',value,0,false));
 assert.throws(()=>editMeasuredWall(s,'w2',180,185,false));assert.equal(s.walls[0].lengthCm,380);
});
test('open chain cannot be incorrectly certified as a room',()=>{
 let s=emptyMeasurement();s=addMeasuredWall(s,240,0);s=addMeasuredWall(s,200,90,true);
 assert.equal(solveMeasurement(s).closed,false);assert.equal(solveMeasurement(s).areaM2,null);
});
test('closure with nonmatching measured length shows conflict',()=>{
 let s=emptyMeasurement();s=addMeasuredWall(s,240,0);s=addMeasuredWall(s,200,90,true);s=addMeasuredWall(s,240,90,true);
 s=recordClosingMeasurement(s,250,1);assert.equal(solveMeasurement(s).closed,false);
 s=recordClosingMeasurement(s,200,1);assert.equal(solveMeasurement(s).closed,true);
 assert.equal(solveMeasurement(s).areaM2,4.8);
});
test('invalid self-crossing polygon cannot become a valid room even if closure length matches',()=>{
 let s=emptyMeasurement();
 for(const [length,turn] of [[200,0],[282.8,135],[200,-135]])s=addMeasuredWall(s,length,turn,true);
 const r=solveMeasurement(s);
 s=recordClosingMeasurement(s,Math.round(r.calculatedClosingCm*10)/10,1);
 assert.ok(solveMeasurement(s).issues.includes('SELF_INTERSECTION'));
 assert.equal(solveMeasurement(s).areaM2,null);
});
test('all-angle-confirmation is never inferred from default 90 degree input',()=>{
 const r=lshape();assert.equal(r.allAnglesConfirmed,false);
});