const NAME="fitspace-p0-v1";
const ASSETS=["/","/index.html","/apps/web/main.js","/apps/web/styles.css","/apps/web/manifest.webmanifest","/apps/web/icon.svg","/packages/geometry-core/index.js","/packages/fit-rules/index.js"];
self.addEventListener("install",event=>event.waitUntil(caches.open(NAME).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n!==NAME).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{if(event.request.method!=="GET"||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));});
