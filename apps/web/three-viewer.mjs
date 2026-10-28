/** Lazy-loaded real WebGL spatial renderer for the canonical centimetre geometry. */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
export function mountThree(host,{onPick,onMove}){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(1.6,window.devicePixelRatio||1));
 renderer.setClearColor('#122e29');
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.domElement.dataset.testid='fitspace-webgl';
 renderer.domElement.setAttribute('aria-label','Διαδραστικό 3D μοντέλο πραγματικών αναλογιών. Σύρε έπιπλο ή κάνε περιστροφή κάμερας.');
 renderer.domElement.style.cssText='width:100%;height:100%;display:block;touch-action:none';
 host.replaceChildren(renderer.domElement);
 const world=new THREE.Scene();world.background=new THREE.Color('#122e29');
 const camera=new THREE.PerspectiveCamera(43,1,.02,140);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.1;controls.minDistance=1;controls.maxDistance=32;controls.maxPolarAngle=Math.PI*.49;
 controls.target.set(1.4,.8,1.2);camera.position.set(6,5,7);controls.update();
 world.add(new THREE.HemisphereLight(0xeaf6e8,0x25483d,2.1));
 const sun=new THREE.DirectionalLight(0xffefcf,2.4);sun.position.set(-5,9,6);world.add(sun);
 const grid=new THREE.GridHelper(40,80,0x335c4d,0x295245);grid.position.y=-.015;world.add(grid);
 let geometry=new THREE.Group();world.add(geometry);
 let furniture=new THREE.Group();world.add(furniture);
 let destroyed=false,frame=0,roomRev=-1,first=true;
 const selectable=[];
 const mats=[];
 const newMaterial=(params)=>{const m=new THREE.MeshStandardMaterial(params);mats.push(m);return m;};
 function clean(group){group.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material?.dispose();}});world.remove(group);}
 function updateRoom(room){if(room.revision===roomRev)return;clean(geometry);geometry=new THREE.Group();world.add(geometry);roomRev=room.revision;
  const points=room.points,shape=new THREE.Shape();shape.moveTo(points[0].xCm/100,-points[0].zCm/100);
  for(const p of points.slice(1))shape.lineTo(p.xCm/100,-p.zCm/100);shape.closePath();
  const floorGeom=new THREE.ShapeGeometry(shape);floorGeom.rotateX(-Math.PI/2);
  const floor=new THREE.Mesh(floorGeom,newMaterial({color:'#567f6b',roughness:.82,metalness:0,side:THREE.DoubleSide}));floor.position.y=.002;geometry.add(floor);
  const wallMat=newMaterial({color:'#b7d6c4',roughness:.88,transparent:true,opacity:.37,depthWrite:false,side:THREE.DoubleSide});
  const capMat=newMaterial({color:'#deebd7',roughness:.9});
  for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length],dx=(b.xCm-a.xCm)/100,dz=(b.zCm-a.zCm)/100,length=Math.hypot(dx,dz),height=room.heightCm/100;
   const mesh=new THREE.Mesh(new THREE.BoxGeometry(length,.0+height,.065),wallMat);
   mesh.rotation.y=-Math.atan2(dz,dx);mesh.position.set((a.xCm+b.xCm)/200,height/2,(a.zCm+b.zCm)/200);geometry.add(mesh);
   const cap=new THREE.Mesh(new THREE.BoxGeometry(length+.02,.025,.075),capMat);cap.position.set(mesh.position.x,height+.012,mesh.position.z);cap.rotation.y=mesh.rotation.y;geometry.add(cap);
  }
  const bounds=points.reduce((b,p)=>({minX:Math.min(b.minX,p.xCm),maxX:Math.max(b.maxX,p.xCm),minZ:Math.min(b.minZ,p.zCm),maxZ:Math.max(b.maxZ,p.zCm)}),{minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity});
  if(first){const midx=(bounds.minX+bounds.maxX)/200,midz=(bounds.minZ+bounds.maxZ)/200,reach=Math.max(3,(bounds.maxX-bounds.minX)/100,(bounds.maxZ-bounds.minZ)/100);controls.target.set(midx,.95,midz);const aspect=Math.max(.38,host.clientWidth/Math.max(1,host.clientHeight));const portraitScale=aspect<.85?.85/aspect:1;camera.position.set(midx+reach*1.5*portraitScale,Math.max(3,reach*1.15)*portraitScale,midz+reach*1.6*portraitScale);controls.update();first=false;}
 }
 function object(item,selected){const g=new THREE.Group();g.userData.itemId=item.id;g.position.set(item.xCm/100,0,item.zCm/100);g.rotation.y=-item.rotationDeg*Math.PI/180;
  const w=item.widthCm/100,d=item.depthCm/100,h=item.heightCm/100;
  const material=newMaterial({color:item.color,roughness:.7,metalness:.06});const dark=newMaterial({color:item.color,roughness:.89,metalness:0});
  function box(x,y,z,ww,hh,dd,mat=material){const m=new THREE.Mesh(new THREE.BoxGeometry(ww,hh,dd),mat);m.position.set(x,y,z);g.add(m);selectable.push(m);}
  if(item.kind==='sofa'){
   box(0,.24,0,w,.42,d*.77);box(0,h*.67,-d*.42,w,h*.66,d*.18,dark);
   for(const side of [-1,1])box(side*(w/2-.085),h*.43,0,.17,h*.7,d);
  } else {
   box(0,h-.045,0,w,.09,d);
   for(const sx of [-1,1])for(const sz of [-1,1])box(sx*(w/2-.095),h*.45,sz*(d/2-.095),.055,h*.9,.055,dark);
   if(item.kind==='desk')box(0,h*.75,-d*.45,w*.8,h*.25,.03,dark);
  }
  if(selected){const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w,h,d)),new THREE.LineBasicMaterial({color:0xf0ca78}));outline.position.y=h/2;g.add(outline);}
  return g;
 }
 function updateFurniture(items,selectedId){clean(furniture);furniture=new THREE.Group();selectable.length=0;world.add(furniture);for(const item of items)furniture.add(object(item,item.id===selectedId));}
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
 const intersection=new THREE.Vector3();let drag=null;
 function fromPointer(e){const rect=renderer.domElement.getBoundingClientRect();pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);ray.setFromCamera(pointer,camera);return ray;}
 const onDown=(e)=>{if(e.button!==0)return;fromPointer(e);const hits=ray.intersectObjects(selectable,false);if(!hits.length)return;let g=hits[0].object;while(g&&!g.userData.itemId)g=g.parent;if(!g)return;
  const id=g.userData.itemId;onPick(id);ray.ray.intersectPlane(floorPlane,intersection);drag={id,pointerId:e.pointerId,offsetX:g.position.x-intersection.x,offsetZ:g.position.z-intersection.z};controls.enabled=false;renderer.domElement.setPointerCapture(e.pointerId);e.preventDefault();};
 const onDrag=(e)=>{if(!drag||e.pointerId!==drag.pointerId)return;fromPointer(e);if(!ray.ray.intersectPlane(floorPlane,intersection))return;onMove(drag.id,Math.round((intersection.x+drag.offsetX)*100),Math.round((intersection.z+drag.offsetZ)*100),false);};
 const onUp=(e)=>{if(!drag||drag.pointerId!==e.pointerId)return;onMove(drag.id,null,null,true);drag=null;controls.enabled=true;try{renderer.domElement.releasePointerCapture(e.pointerId);}catch{}};
 renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointermove',onDrag);renderer.domElement.addEventListener('pointerup',onUp);renderer.domElement.addEventListener('pointercancel',onUp);
 const resize=()=>{if(destroyed)return;const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);};
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function tick(){if(destroyed)return;controls.update();if(!document.hidden)renderer.render(world,camera);frame=requestAnimationFrame(tick);}tick();
 return {update(room,items,selectedId){if(destroyed)return;updateRoom(room);updateFurniture(items,selectedId);},dispose(){if(destroyed)return;destroyed=true;cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointermove',onDrag);renderer.domElement.removeEventListener('pointerup',onUp);renderer.domElement.removeEventListener('pointercancel',onUp);controls.dispose();clean(furniture);clean(geometry);for(const m of mats)m.dispose();renderer.dispose();renderer.forceContextLoss();host.replaceChildren();}};
}