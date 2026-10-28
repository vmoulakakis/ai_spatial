import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const origin='http://127.0.0.1:4174';
const server=spawn(process.execPath,['tools/serve.mjs'],{cwd:process.cwd(),env:{...process.env,PORT:'4174'},stdio:'ignore'});
let browser;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<50;i++){try{if((await fetch(origin)).ok)return;}catch{}await wait(250);}throw Error('Local FitSpace server did not start');}
try{
 await mkdir('test-results',{recursive:true});await ready();browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [320,390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/apps/web/polygon.html',{waitUntil:'networkidle'});
  await page.locator('[data-testid="polygon-plan"]').waitFor();
  assert.equal(errors.length,0,errors.join('; '));
  assert.ok((await page.evaluate(()=>document.documentElement.scrollWidth))<=width+2,'horizontal overflow '+width);
  assert.match(await page.locator('#area').innerText(),/9,72/);
  if(width===390){
   await page.locator('#xCm').fill('360');await page.locator('#apply').click();
   assert.match(await page.locator('#area').innerText(),/9,54/);
   await page.locator('#threeBtn').click();await page.locator('[data-testid="polygon-3d"]').waitFor();
   assert.match(await page.locator('#area').innerText(),/9,54/);
   await page.screenshot({path:'test-results/polygon-390-3d.png',fullPage:true});
   await page.locator('#undo').click();assert.match(await page.locator('#area').innerText(),/9,72/);
   await page.locator('#redo').click();assert.match(await page.locator('#area').innerText(),/9,54/);
   await page.locator('#planBtn').click();
   await page.locator('#xCm').fill('0');await page.locator('#apply').click();
   assert.match(await page.locator('#notice').innerText(),/απορρίφθηκε/);
  }
  await page.screenshot({path:`test-results/polygon-${width}.png`,fullPage:true});await context.close();console.log('PASS polygon browser',width);
 }
}finally{if(browser)await browser.close();server.kill('SIGTERM');}
