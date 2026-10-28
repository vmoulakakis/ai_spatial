import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
const root=resolve("dist"),port=Number(process.env.PORT||4173);
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".webmanifest":"application/manifest+json"};
createServer(async(req,res)=>{try{const name=new URL(req.url||"/","http://localhost:"+port).pathname;const file=resolve(root,"."+decodeURIComponent(name==="/"?"/index.html":name));if(!file.startsWith(root+sep))throw Error("Not found");if(!(await stat(file)).isFile())throw Error("Not found");res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});res.end(await readFile(file));}catch{res.writeHead(404);res.end("Not found");}}).listen(port,"0.0.0.0",()=>console.log("FitSpace http://localhost:"+port));
