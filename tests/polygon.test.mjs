import test from 'node:test';
import assert from 'node:assert/strict';
import {demoPolygon,metrics,moveVertex,validatePolygon,previewFit,createPolygonStore,applyAiVertex,pointInside} from '../dist/packages/geometry-core/polygon.js';
test('L-shaped room area and perimeter from one canonical graph',()=>{
 const g=metrics(demoPolygon());assert.equal(g.areaM2,9.72);assert.equal(g.perimeterM,13.6);assert.equal(g.vertices.length,6);assert.equal(g.walls[0].lengthCm,380);
});
test('vertex corrected in centimetres updates area, walls and revision',()=>{
 const before=demoPolygon();const after=moveVertex(before,{id:'v2',xCm:360,zCm:0});
 assert.equal(metrics(after).areaM2,9.54);assert.equal(metrics(after).walls[0].lengthCm,360);
 assert.equal(after.revision,1);assert.equal(before.points[1].xCm,380);
});
test('self-crossing polygon rejects edit and leaves input untouched',()=>{
 const before=demoPolygon();assert.throws(()=>moveVertex(before,{id:'v4',xCm:100,zCm:0}),/Self-intersecting|Zero length|negligible/);
 assert.equal(before.revision,0);
});
test('zero length and non-integer/negative coordinates are rejected',()=>{
 assert.throws(()=>moveVertex(demoPolygon(),{id:'v2',xCm:0,zCm:0}),/Zero length/);
 assert.throws(()=>moveVertex(demoPolygon(),{id:'v2',xCm:-1,zCm:0}),/integer centimetres/);
 assert.throws(()=>moveVertex(demoPolygon(),{id:'v2',xCm:10.5,zCm:0}),/integer centimetres/);
});
test('concavity excludes open notch, even if inside bounding box',()=>{
 const p=demoPolygon();assert.equal(pointInside(p.points,300,230),false);
 p.footprint={xCm:255,zCm:200,widthCm:50,depthCm:40,clearanceCm:0};
 const r=previewFit(p);assert.equal(r.footprintInside,false);assert.equal(r.status,'NEEDS_CONFIRMATION');
});
test('plausible footprint remains unverified',()=>{
 const r=previewFit(demoPolygon());assert.equal(r.footprintInside,true);assert.equal(r.status,'NEEDS_CONFIRMATION');
});
test('undo redo revision monotonic and stale AI suggestion rejected',()=>{
 const store=createPolygonStore(),old=store.get().revision;
 store.edit({id:'v2',xCm:360,zCm:0});assert.equal(store.ai(old,{id:'v3',xCm:360,zCm:180}).reason,'stale_revision');
 const revision=store.get().revision;store.undo();assert.ok(store.get().revision>revision);assert.equal(store.get().points[1].xCm,380);
 store.redo();assert.equal(store.get().points[1].xCm,360);
});
test('AI does not replace confirmed vertex',()=>{
 const scene=moveVertex(demoPolygon(),{id:'v2',xCm:360,zCm:0});
 const r=applyAiVertex(scene,scene.revision,{id:'v2',xCm:380,zCm:0});assert.equal(r.reason,'confirmed_vertex');
});
