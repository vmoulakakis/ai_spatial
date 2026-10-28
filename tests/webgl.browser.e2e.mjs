import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';import {mkdir} from 'node:fs/promises';import {chromium} from 'playwright';
const origin='http://127.0.0.1:4173';
const server=spawn(process.execPath,['tools/serve.mjs'],{cwd:process.cwd(),stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<70;i++){try{if((await fetch(origin+'/apps/web/three-viewer.bundle.js')).ok)return;}catch{}await sleep(250);}throw Error('Three bundle unavailable');}
let browser;
try{await mkdir('test-results',{recursive:true});await ready();browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const [w,h] of [[390,844],[1440,900]]){
  const context=await browser.newContext({viewport:{width:w,height:h},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/apps/web/designer.html',{waitUntil:'networkidle'});
  if(w<=750)await page.locator('#mobileToggle').click();
  await page.locator('#view3D').click();
  const canvas=page.locator('canvas[data-testid="fitspace-webgl"]');
  try{await canvas.waitFor({timeout:20000});}catch{throw Error('WebGL mode failed to initialize: '+await page.locator('#stageStatus').innerText());}
  await page.locator('#addSofa').click();await page.locator('[data-furniture="item1"]').waitFor();
  assert.match(await page.locator('#furnitureTitle').innerText(),/Καναπές/);
  assert.equal(await page.locator('#objWidth').inputValue(),'160');
  await page.locator('#objWidth').fill('175');await page.locator('#updateFurniture').click();
  assert.equal(await page.locator('#objWidth').inputValue(),'175');
  await page.locator('#objX').fill('390');await page.locator('#updateFurniture').click();
  assert.match(await page.locator('#stageStatus').innerText(),/δεν χωρά/);
  await page.locator('#furnitureUndo').click();assert.equal(await page.locator('#furnitureList [data-furniture]').count(),1);
  await page.locator('#removeFurniture').click();assert.equal(await page.locator('#furnitureList [data-furniture]').count(),0);
  await page.locator('#view2D').click();await page.locator('[data-testid="designer-canvas"]').waitFor();
  await page.locator('#view3D').click();await canvas.waitFor({timeout:20000});
  if(w<=750)await page.locator('#mobileToggle').click();
  await page.screenshot({path:`test-results/v6-webgl-${w}.png`,fullPage:true});
  assert.equal(errors.length,0,errors.join('; '));await context.close();console.log(`PASS V6 WebGL orbit scene + furniture CRUD, ${w}x${h}`);
 }
}finally{if(browser)await browser.close();server.kill('SIGTERM');}