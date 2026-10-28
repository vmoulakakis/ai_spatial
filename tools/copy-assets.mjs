import {cp,mkdir} from "node:fs/promises";
await mkdir("dist/apps/web",{recursive:true});
for(const file of ["index.html","polygon.html","styles.css","manifest.webmanifest","icon.svg"])await cp("apps/web/"+file,"dist/apps/web/"+file);
await cp("apps/web/index.html","dist/index.html");
await cp("apps/web/sw.js","dist/sw.js");
console.log("Built FitSpace static PWA in dist/");
