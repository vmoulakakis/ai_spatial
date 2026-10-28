import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const origin='http://127.0.0.1:4173';
const server=spawn(process.execPath,['tools/serve.mjs'],{cwd:process.cwd(),stdio:'ignore'});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function ready(){for(let i=0;i<50;i++){try{const r=await fetch(origin+'/apps/web/measure.html');if(r.ok)return;}catch{}await delay(200);}throw Error('Manual precision server not ready');}
let browser;
try{
 await mkdir('test-results',{recursive:true});await ready();
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const [width,height] of [[320,720],[390,844],[768,1024],[1440,900]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+'/apps/web/measure.html',{waitUntil:'networkidle'});
  await page.locator('[data-testid="measured-geometry"]').waitFor();
  const scrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
  assert.ok(scrollWidth<=width+2,'horizontal overflow at '+width+': '+scrollWidth);
  if(width<=920)await page.locator('#editorTab').click();
  await page.locator('#example').click();
  assert.match(await page.locator('#stats').innerText(),/9,72/);
  await page.screenshot({path:`test-results/v4-measure-${width}-example.png`,fullPage:true});
  await page.locator('[data-wall="w1"]').click();
  await page.locator('#editLength').fill('320');
  await page.locator('#editForm button[type=submit]').click();
  assert.match(await page.locator('#stats').innerText(),/Conflict/);
  assert.match(await page.locator('#banner').innerText(),/δεν κλείνουν/);
  await page.locator('#undo').click();
  assert.match(await page.locator('#stats').innerText(),/9,72/);
  await page.locator('#redo').click();
  assert.match(await page.locator('#stats').innerText(),/Conflict/);
  if(width<=920)await page.locator('#canvasTab').click();
  await page.locator('#threeBtn').click();
  assert.match(await page.locator('svg').getAttribute('aria-label'),/Ισομετρική/);
  await page.screenshot({path:`test-results/v4-measure-${width}-3d.png`,fullPage:true});
  assert.equal(errors.length,0,errors.join('; '));
  await context.close();
  console.log('PASS V4 point-measurement Chromium',width,'x',height);
 }
}finally{if(browser)await browser.close();server.kill('SIGTERM');}