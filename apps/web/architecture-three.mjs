/** V8 visualisation. Canonical coordinates are centimetres; dimensions are never camera-derived. */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
export function mountArchitecture(host) {
  const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(1.8,devicePixelRatio||1));
  renderer.setClearColor(0x152727);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.domElement.dataset.testid='architecture-webgl';
  renderer.domElement.setAttribute('aria-label','3D αρχιτεκτονική γεωμετρία με περιστροφή και zoom');
  host.replaceChildren(renderer.domElement);
  renderer.domElement.style.cssText='display:block;width:100%;height:100%;touch-action:none';
  const world=new THREE.Scene();world.background=new THREE.Color('#152727');
  const camera=new THREE.PerspectiveCamera(42,1,.05,150);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.54;controls.minDistance=.6;controls.maxDistance=28;
  world.add(new THREE.HemisphereLight(0xffffff,0x283f39,2.5));const sun=new THREE.DirectionalLight(0xffefd4,2.6);sun.position.set(4,8,5);world.add(sun);
  const grid=new THREE.GridHelper(25,50,'#426157','#2a4d45');grid.position.y=-.01;world.add(grid);
  let group=new THREE.Group();world.add(group);let destroyed=false,frame=0,lastRevision=-1;
  const materials=[];
  function material(kind){const m=new THREE.MeshStandardMaterial({color:kind==='beam'?'#dfb56c':kind==='radiator'?'#b9c2c7':kind==='floor'?'#648776':'#b4cbbf',roughness:.88,transparent:kind==='wall',opacity:kind==='wall'?.53:1,side:THREE.DoubleSide,depthWrite:kind!=='wall'});materials.push(m);return m;}
  function cleanup(){group.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});world.remove(group);group=new THREE.Group();world.add(group);}
  function update(g){if(destroyed||lastRevision===g.revision)return;lastRevision=g.revision;cleanup();
    const pts=g.plan;const shape=new THREE.Shape();shape.moveTo(pts[0].xCm/100,-pts[0].zCm/100);pts.slice(1).forEach(p=>shape.lineTo(p.xCm/100,-p.zCm/100));shape.closePath();
    const floorGeo=new THREE.ShapeGeometry(shape);floorGeo.rotateX(-Math.PI/2);const floor=new THREE.Mesh(floorGeo,material('floor'));floor.position.y=.004;group.add(floor);
    for(const box of g.boxes){const geo=new THREE.BoxGeometry(box.w/100,box.h/100,box.d/100),mesh=new THREE.Mesh(geo,material(box.kind));mesh.position.set(box.cx/100,box.cy/100,box.cz/100);mesh.name=box.label;group.add(mesh);}
    const center=new THREE.Vector3(g.widthCm/200,g.ceilingCm/240,g.depthCm/200);controls.target.copy(center);
    const longest=Math.max(g.widthCm,g.depthCm,g.ceilingCm)/100;
    const aspect=Math.max(.5,host.clientWidth/Math.max(1,host.clientHeight));const distance=longest*(aspect<.9?2.85:1.78);
    camera.position.set(center.x+distance*.79,center.y+distance*.65,center.z+distance*.85);controls.update();
  }
  const resize=()=>{if(destroyed)return;const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  function tick(){if(destroyed)return;controls.update();if(!document.hidden)renderer.render(world,camera);frame=requestAnimationFrame(tick);}tick();
  return {update,dispose(){if(destroyed)return;destroyed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();cleanup();materials.forEach(m=>m.dispose());renderer.dispose();renderer.forceContextLoss();host.replaceChildren();}};
}