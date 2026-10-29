import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const origin='http://127.0.0.1:4173';const server=spawn(process.execPath,['tools/serve.mjs'],{cwd:process.cwd(),stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<50;i++){try{if((await fetch(origin+'/apps/web/reconstruct.html')).ok)return;}catch{}await sleep(200);}throw Error('V8 app did not start');}
let browser;
try{await mkdir('test-results',{recursive:true});await ready();browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
for(const [width,height] of [[320,720],[390,844],[768,1024],[1440,900]]){
 const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/apps/web/reconstruct.html',{waitUntil:'networkidle'});await page.locator('#modelCanvas svg').waitFor();
 assert.match(await page.locator('#originTag').innerText(),/ΕΝΔΕΙΚΤΙΚΟ/);
 assert.match(await page.locator('#metricSummary').innerText(),/320 cm/);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth)<=width+3,'Overflow in '+width);
 await page.screenshot({path:`test-results/v8-reconstruction-${width}-2d.png`,fullPage:true});
 if(width<=720)await page.locator('[data-mobile-pane="dimensions"]').click();
 await page.locator('[data-dim="alcoveWidthCm"]').fill('355');await page.locator('[data-dim="alcoveWidthCm"]').press('Tab');
 if(width<=720)await page.locator('[data-mobile-pane="model"]').click();
 assert.match(await page.locator('#metricSummary').innerText(),/355 cm/);
 await page.locator('[data-view="front"]').click();assert.match(await page.locator('#modelCanvas svg').getAttribute('aria-label'),/Αρχιτεκτονική/);
 await page.locator('[data-view="side"]').click();assert.ok(await page.locator('#modelCanvas svg').count());
 await page.locator('[data-view="3d"]').click();await page.locator('[data-testid="architecture-webgl"]').waitFor({timeout:30000});
 await page.screenshot({path:`test-results/v8-reconstruction-${width}-3d.png`,fullPage:true});
 await page.locator('[data-view="plan"]').click();assert.ok(await page.locator('#modelCanvas svg').count());
 if(width<=720)await page.locator('[data-mobile-pane="photos"]').click();
 await page.locator('#clean').click();
 const onePixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAY0lEQVR4nO3PQQ3AIADAQEAmStCEyongcVnSU9DOe/b4s6UDXjWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgfeF1AfyyszZJAAAAAElFTkSuQmCC','base64');
 await page.locator('#photos').setInputFiles([{name:'front.png',mimeType:'image/png',buffer:onePixel}]);
 await page.waitForFunction(()=>document.querySelector('#photoCount')?.textContent?.includes('1 φωτογραφία'),null,{timeout:15000});
 assert.match(await page.locator('#photoCount').innerText(),/1 φωτογραφία/);
 await page.locator('#clean').click();assert.match(await page.locator('#notice').innerText(),/συγκατάθεση/);
 await page.locator('#consent').check();await page.locator('#clean').click();assert.match(await page.locator('#notice').innerText(),/AI|υπηρεσία/i);
 page.on('dialog',dialog=>dialog.accept());if(width<=720)await page.locator('[data-mobile-pane="model"]').click();await page.locator('#toCad').click();await page.waitForURL('**/apps/web/designer.html');assert.match(await page.locator('#metrics').innerText(),/m²/);assert.ok((await page.locator('#cad-svg [data-vertex]').count())>=8);
 assert.equal(errors.length,0,'Browser errors '+width+': '+errors.join(';'));
 console.log('PASS V8 architecture 2D/front/section/3D + edit/photo/consent',width);
 await ctx.close();
}
}finally{await browser?.close();server.kill('SIGTERM');}