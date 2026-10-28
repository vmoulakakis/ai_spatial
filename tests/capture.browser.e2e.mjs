import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const origin='http://127.0.0.1:4173',server=spawn(process.execPath,['tools/serve.mjs'],{cwd:process.cwd(),stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<60;i++){try{const r=await fetch(origin+'/apps/web/designer.html');if(r.ok)return;}catch{}await delay(200);}throw Error('V7 server not ready');}
let browser;
try{
 await mkdir('test-results',{recursive:true});await ready();browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [width,height] of [[320,720],[390,844],[768,1024],[1440,900]]){
  const ctx=await browser.newContext({viewport:{width,height},acceptDownloads:true,reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/apps/web/designer.html',{waitUntil:'networkidle'});
  await page.locator('#captureOpen').click();await page.locator('#captureOverlay').waitFor({state:'visible'});
  assert.match(await page.locator('#captureQualityHeading').innerText(),/0 \/ 4/);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth);
  assert.ok(overflow<=width+3,`V7 horizontal overflow at ${width}: ${overflow}`);
  const jpeg=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1280;c.height=960;const x=c.getContext('2d');x.fillStyle='#bfceb9';x.fillRect(0,0,1280,960);for(let i=0;i<80;i++){x.strokeStyle=i%2?'#39776f':'#a5ad80';x.beginPath();x.moveTo(i*17,0);x.lineTo(i*23%1280,960);x.stroke();}return c.toDataURL('image/jpeg',.9).split(',')[1];});
  await page.locator('#captureFileInput').setInputFiles({name:'room.jpg',mimeType:'image/jpeg',buffer:Buffer.from(jpeg,'base64')});
  await page.locator('.capture-photo').first().waitFor();await page.locator('#capturePreviewImage').waitFor({state:'visible'});
  assert.match(await page.locator('#captureProgressText').innerText(),/1 \/ 6/);
  await page.locator('#capturePreviewImage').click({position:{x:160,y:120}});
  assert.match(await page.locator('.capture-photo button[data-show-shot]').innerText(),/1 σημεία/);
  await page.screenshot({path:`test-results/v7-capture-${width}.png`,fullPage:false});
  // Denied camera must not break file import or leak a stream.
  await page.evaluate(()=>{Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:()=>Promise.reject(new DOMException('Access denied','NotAllowedError'))}})});
  await page.locator('#captureStartCamera').click();assert.match(await page.locator('#captureStatus').innerText(),/Πρόσβαση κάμερας/);
  // Manual real-world dimension updates the *same* canonical CAD geometry.
  await page.locator('#captureAnchorWall').selectOption('0');await page.locator('#captureAnchorCm').fill('360');
  await page.locator('#captureApplyAnchor').click();assert.match(await page.locator('#captureAnchorStatus').innerText(),/360 cm/);
  const report=page.waitForEvent('download');await page.locator('#captureExport').click();const file=await report;assert.match(file.suggestedFilename(),/capture-report.json/);
  await page.locator('#captureClose').click();assert.equal(await page.locator('#metricFirst').innerText(),'360 cm');
  await page.locator('#captureOpen').click();await page.locator('#captureClear').click();assert.equal(await page.locator('.capture-photo').count(),0);
  await page.locator('#captureClose').click();assert.equal(errors.length,0,errors.join(';'));
  await ctx.close();console.log('PASS V7 guided capture/photo quality/manual CAD anchor/mobile',width);
 }
}finally{if(browser)await browser.close();server.kill('SIGTERM');}