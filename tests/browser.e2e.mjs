import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdir} from "node:fs/promises";
import {chromium} from "playwright";
const root=process.cwd(),origin="http://127.0.0.1:4173";
const server=spawn(process.execPath,["tools/serve.mjs"],{cwd:root,stdio:"ignore"});
let browser;
const delay=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
async function ready(){for(let n=0;n<60;n++){try{const r=await fetch(origin);if(r.ok)return;}catch{}await delay(250);}throw Error("FitSpace local test server failed to start");}
async function run(){
 await mkdir("test-results",{recursive:true});await ready();
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 for(const [width,height,label] of [[390,844,"mobile"],[1440,900,"desktop"],[320,720,"small-mobile"],[768,1024,"tablet"]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:"reduce"});
  const page=await context.newPage(),errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto(origin,{waitUntil:"networkidle"});
  await page.locator('[data-testid="floorplan"]').waitFor();
  assert.equal(errors.length,0,"page errors at "+width+": "+errors.join(";"));
  const scrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
  assert.ok(scrollWidth<=width+2,"horizontal overflow at "+width+": "+scrollWidth);
  await page.screenshot({path:"test-results/"+label+"-plan.png",fullPage:true});
  if(label==="mobile"){
   assert.match(await page.locator("#stats").innerText(),/260/);
   await page.locator('[data-panel="editor"]').click();
   await page.locator("#wallCm").fill("240");
   await page.locator("[data-apply]").click();
   assert.match(await page.locator("#stats").innerText(),/240/);
   assert.match(await page.locator("#stats").innerText(),/4,8/);
   await page.locator('[data-panel="canvas"]').click();
   await page.locator('.mobile [data-view="space"]').click();
   await page.locator('[data-testid="room3d"]').waitFor();
   assert.match(await page.locator("#stats").innerText(),/240/);
   await page.screenshot({path:"test-results/mobile-3d.png",fullPage:true});
   await page.locator('.mobile [data-view="fit"]').click();
   assert.match(await page.locator("#inspector").innerText(),/NEEDS_CONFIRMATION/);
   await page.locator('.mobile [data-view="plan"]').click();
   await page.locator('[data-panel="editor"]').click();
   await page.locator('[data-select="south"]').click();
   await page.locator("#wallCm").fill("260");
   await page.locator("[data-apply]").click();
   assert.ok(await page.locator(".conflict").count()>0,"confirmed anchor conflict visible");
   await page.screenshot({path:"test-results/mobile-conflict.png",fullPage:true});
   await page.locator('[data-resolve="width:north"]').click();
   assert.equal(await page.locator(".conflict").count(),0);
   await page.locator("#undo").click();
   assert.ok(await page.locator(".conflict").count()>0,"undo restores conflicted state");
   await page.locator("#redo").click();
   assert.equal(await page.locator(".conflict").count(),0);
  }
  await context.close();
  console.log("PASS browser viewport",label,width+"x"+height);
 }
}
try{await run();}finally{if(browser)await browser.close();server.kill("SIGTERM");}
