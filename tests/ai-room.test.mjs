import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/ai-room.mjs';
async function invoke(method, body, headers={host:'localhost:4173'}){
 let status=200,result,receivedHeaders={};
 const res={setHeader(k,v){receivedHeaders[k]=v;},status(s){status=s;return this;},json(data){result=data;return this;}};
 await handler({method,body,headers},res);return {status,result,headers:receivedHeaders};
}
test('GET reports whether AI key is configured without revealing credentials',async()=>{const old=process.env.OPENAI_API_KEY;delete process.env.OPENAI_API_KEY;const x=await invoke('GET');assert.equal(x.status,200);assert.equal(x.result.configured,false);assert.equal(x.result.provider,'OpenAI API');assert.equal(x.headers['Cache-Control'],'no-store');if(old)process.env.OPENAI_API_KEY=old;});
test('no API secret: rejects image editing with explicit 503 and no fake output',async()=>{const old=process.env.OPENAI_API_KEY;delete process.env.OPENAI_API_KEY;const x=await invoke('POST',{action:'clear',image:'fake'});assert.equal(x.status,503);assert.match(x.result.error,/OPENAI_API_KEY/);assert.ok(!x.result.edited);if(old)process.env.OPENAI_API_KEY=old;});
test('disallow cross-origin actions',async()=>{const x=await invoke('POST',{action:'clear'}, {host:'fitspace.example',origin:'https://evil.example'});assert.equal(x.status,403);});
test('allows no HTTP methods other than GET/POST',async()=>{const x=await invoke('PUT');assert.equal(x.status,405);});
test('validates malformed uploaded images before provider call',async()=>{const prior=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test-key';const x=await invoke('POST',{action:'clear',image:'data:text/plain;base64,AAAB'});assert.equal(x.status,400);assert.match(x.result.error,/JPEG|PNG|WEBP/);if(prior)process.env.OPENAI_API_KEY=prior;else delete process.env.OPENAI_API_KEY;});
test('successful edit uses official image edit endpoint and returns JPEG (mocked)',async()=>{const oldKey=process.env.OPENAI_API_KEY,oldFetch=globalThis.fetch;process.env.OPENAI_API_KEY='fake-secret';let request;
 globalThis.fetch=async(url,init)=>{request={url,init};return {ok:true,json:async()=>({data:[{b64_json:'QUJDREVG'}]})};};
 try{const image='data:image/jpeg;base64,'+Buffer.alloc(350,123).toString('base64');const x=await invoke('POST',{action:'clear',image});assert.equal(x.status,200);assert.equal(x.result.edited,'data:image/jpeg;base64,QUJDREVG');assert.equal(request.url,'https://api.openai.com/v1/images/edits');assert.equal(request.init.body.get('output_format'),'jpeg');assert.equal(request.init.body.get('model'),'gpt-image-2');}finally{globalThis.fetch=oldFetch;if(oldKey)process.env.OPENAI_API_KEY=oldKey;else delete process.env.OPENAI_API_KEY;}
});
test('vision never returns numeric dimensions even if model suggests them (mocked)',async()=>{const oldKey=process.env.OPENAI_API_KEY,oldFetch=globalThis.fetch;process.env.OPENAI_API_KEY='fake-secret';globalThis.fetch=async()=>({ok:true,json:async()=>({output:[{content:[{text:JSON.stringify({alcove:true,beam:true,radiator:true,visibleDoor:true,visibleFloor:true,matchedViews:true,alcoveWidthCm:300,summary:'Εσοχή με δοκάρι.',uncertainties:['Η βάση κρύβεται.']})}]}]})});
 try{const image='data:image/jpeg;base64,'+Buffer.alloc(350,123).toString('base64');const x=await invoke('POST',{action:'analyze',images:[image]});assert.equal(x.status,200);assert.equal(x.result.result.alcove,true);assert.equal(Object.hasOwn(x.result.result,'alcoveWidthCm'),false);assert.equal(x.result.metricVerified,false);}finally{globalThis.fetch=oldFetch;if(oldKey)process.env.OPENAI_API_KEY=oldKey;else delete process.env.OPENAI_API_KEY;}
});