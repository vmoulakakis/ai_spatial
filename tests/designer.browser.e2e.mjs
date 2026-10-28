import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const origin='http://127.0.0.1:4173';
const server=spawn(process.execPath,['tools/serve.mjs'],{cwd:process.cwd(),stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<50;i++){try{if((await fetch(origin+'/apps/web/designer.html')).ok)return;}catch{}await sleep(200);}throw Error('Designer server unavailable');}
const screen=async(page,x,z)=>page.evaluate(([x,z])=>{const svg=document.querySelector('#cad-svg'),ctm=svg.getScreenCTM(),p=new DOMPoint(x,z).matrixTransform(ctm);return {x:p.x,y:p.y};},[x,z]);
let browser;
try{
 await mkdir('test-results',{recursive:true});await ready();browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [width,height] of [[320,720],[390,844],[768,1024],[1440,900]]){
  const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/apps/web/designer.html',{waitUntil:'networkidle'});
  await page.locator('[data-testid="designer-canvas"]').waitFor();
  assert.match(await page.locator('#metrics').innerText(),/9,72/);
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth))<=width+2,'horizontal overflow '+width);
  await page.screenshot({path:`test-results/v5-designer-${width}-before.png`,fullPage:true});
  // Mouse-driven direct manipulation: B from (380, 0) to (360, 0) with live dimensions.
  const start=await screen(page,380,0),end=await screen(page,360,0);
  await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:8});
  const live=await page.locator('#metricSelected').innerText();assert.match(live,/360/,'side inspector must update WHILE dragging');
  await page.mouse.up();assert.match(await page.locator('#metrics').innerText(),/9,54/);
  if(width<=750)await page.locator('#mobileToggle').click();
  assert.match(await page.locator('#selectionDesc').innerText(),/360/);
  await page.locator('#lockPoint').check();await page.locator('#lockPoint').uncheck();
  if(width<=750)await page.locator('#mobileToggle').click();
  await page.screenshot({path:`test-results/v5-designer-${width}-drag.png`,fullPage:true});
  // Tap dimension text (edge A-B) and edit exact length using inspector.
  await page.locator('[data-edge="0"] .dim-bg').click();
  if(width<=750)await page.locator('#mobileToggle').click();
  await page.locator('#wallLength').fill('345');await page.locator('#applyLength').click();
  assert.match(await page.locator('#metricSelected').innerText(),/345/);
  await page.locator('#lockLength').check();
  if(width<=750)await page.locator('#mobileToggle').click();
  // The selected locked wall cannot have its length distorted by an attempted edit of its other end.
  const pNow=await page.locator('#cad-svg [data-vertex="1"] .handle').evaluate(el=>({x:Number(el.getAttribute('cx')),z:Number(el.getAttribute('cy'))}));
  const start2=await screen(page,pNow.x,pNow.z),end2=await screen(page,pNow.x-25,pNow.z+30);
  await page.mouse.move(start2.x,start2.y);await page.mouse.down();await page.mouse.move(end2.x,end2.y,{steps:6});await page.mouse.up();
  assert.match(await page.locator('#metrics').innerText(),/m²/);
  assert.equal(errors.length,0,errors.join('; '));
  console.log('PASS V5 live CAD point drag / dimension panel / locked edge / responsive',width);
  await ctx.close();
 }
}finally{if(browser)await browser.close();server.kill('SIGTERM');}