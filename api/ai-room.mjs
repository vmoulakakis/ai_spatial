/** Privacy-minimizing no-storage proxy for OpenAI image editing and qualitative scene interpretation.
 * No key is exposed in the browser. This endpoint is intended for access-controlled preview deployments.
 */
const MAX_BYTES=7_000_000;
function respond(res,status,data){res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');return res.status(status).json(data);}
function sourceData(value){if(typeof value!=='string'||value.length>MAX_BYTES)throw new Error('Μη αποδεκτό μέγεθος εικόνας.');const match=value.match(/^data:(image\/jpeg|image\/png|image\/webp);base64,([a-zA-Z0-9+/=]+)$/);if(!match)throw new Error('Επιτρέπονται μόνο JPEG, PNG ή WEBP.');const buffer=Buffer.from(match[2],'base64');if(buffer.length<300||buffer.length>4_000_000)throw new Error('Η φωτογραφία πρέπει να είναι μικρότερη από 4 MB.');return {mime:match[1],buffer,url:value};}
export default async function handler(req,res){
 if(req.method==='GET')return respond(res,200,{configured:!!process.env.OPENAI_API_KEY,provider:'OpenAI API',photoRetention:'no application storage',metric:true===false});
 if(req.method!=='POST')return respond(res,405,{error:'Method not allowed'});
 const origin=req.headers.origin;const host=req.headers.host;if(origin&&host){try{if(new URL(origin).host!==host)return respond(res,403,{error:'Cross-origin requests are not accepted.'});}catch{return respond(res,403,{error:'Invalid origin.'});}}
 if(!process.env.OPENAI_API_KEY)return respond(res,503,{error:'Η υπηρεσία AI δεν έχει συνδεθεί ακόμη: απαιτείται OPENAI_API_KEY στο Vercel Preview.'});
 const payload=req.body;
 if(!payload||typeof payload!=='object')return respond(res,400,{error:'Missing request body.'});
 const key=process.env.OPENAI_API_KEY;
 try{
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),55_000);
  try{
   if(payload.action==='clear'){
    const img=sourceData(payload.image);const form=new FormData();
    form.append('model',process.env.FITSPACE_IMAGE_MODEL||'gpt-image-2');
    form.append('image',new Blob([img.buffer],{type:img.mime}),'room.'+img.mime.split('/')[1]);
    form.append('prompt','Architectural image edit, strictly preserve the visible room shell, perspective and all permanent architectural elements: walls, floor tiles, ceiling, beams, columns, door openings, baseboards, windows and radiators. Remove only freestanding furniture, chairs, wardrobes, desks, monitors, belongings, clutter and loose objects. Replace occluded areas conservatively by continuing visible wall/floor materials. No added furnishings, windows, walls or design styling. The completed image is an illustrative inpainting, NOT surveyed ground truth.');
    form.append('size','auto');form.append('output_format','jpeg');form.append('quality','medium');
    const upstream=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:'Bearer '+key},body:form,signal:controller.signal});
    const out=await upstream.json().catch(()=>({}));
    if(!upstream.ok)return respond(res,502,{error:'Η υπηρεσία επεξεργασίας εικόνας επέστρεψε σφάλμα ('+upstream.status+').',type:out.error?.type||'provider_error'});
    const b64=out.data?.[0]?.b64_json;
    if(!b64)return respond(res,502,{error:'Η AI υπηρεσία δεν επέστρεψε επεξεργασμένη εικόνα.'});
    return respond(res,200,{edited:'data:image/jpeg;base64,'+b64,provenance:'AI inpainting; hidden surfaces are not physically verified'});
   }
   if(payload.action==='analyze'){
    if(!Array.isArray(payload.images)||payload.images.length<1||payload.images.length>6)throw new Error('Επίλεξε έως έξι φωτογραφίες για κοινή ανάλυση.');
    const images=payload.images.map(sourceData);
    const content=[{type:'input_text',text:'Analyze these views of the SAME room, including furniture occlusions. Return ONLY strict JSON object with booleans alcove,beam,radiator,visibleDoor,visibleFloor,matchedViews and string summary (max 350 characters), uncertainties array of up to 5 short strings. No exact lengths, scale, coordinates or certainty percentages. If images disagree say so. The geometry will only become an ILLUSTRATIVE editable CAD example, not measured reconstruction.'},...images.map(x=>({type:'input_image',image_url:x.url,detail:'high'}))];
    const upstream=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.FITSPACE_VISION_MODEL||'gpt-4.1-mini',input:[{role:'user',content}],max_output_tokens:450}),signal:controller.signal});
    const out=await upstream.json().catch(()=>({}));if(!upstream.ok)return respond(res,502,{error:'Η AI ανάλυση επέστρεψε σφάλμα ('+upstream.status+').'});
    const txt=out.output_text||out.output?.flatMap(x=>x.content||[]).map(x=>x.text||'').join('')||'';
    const json=JSON.parse(txt.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));
    const result={};for(const name of ['alcove','beam','radiator','visibleDoor','visibleFloor','matchedViews'])result[name]=json[name]===true;
    result.summary=String(json.summary||'').slice(0,400);result.uncertainties=Array.isArray(json.uncertainties)?json.uncertainties.slice(0,5).map(x=>String(x).slice(0,140)):[];
    return respond(res,200,{result,metricVerified:false,source:'visual-semantic-assessment'});
   }
   return respond(res,400,{error:'Unsupported action.'});
  }finally{clearTimeout(timeout);}
 }catch(err){return respond(res,err?.name==='AbortError'?504:400,{error:err instanceof Error?err.message:'Αδυναμία επεξεργασίας.'});}
}