(function museumWorker(){
  const CONFIG={"version":"mv6rgl9r","shell":["./data/rooms.json","./css/style.css","./js/app.js","./images/menu-colophon.pdf","./images/3ab4b9b3-a9c4-4017-8905-adec929c5855.png","./images/partner-1.png","./images/partner-2.png","./images/partner-3.png","./images/partner-4.png","./images/partner-5.png","./index.html","./wayfinding/pannello-01/index.html","./piano-0/pannello-02/index.html","./piano-1/pannello-03/index.html","./piano-1/pannello-04/index.html","./piano-0/pannello-05/index.html","./images/icon-192.png","./images/icon-512.png","./manifest.webmanifest","./colophon/index.html","./colophon/pages/page-1.png","./colophon/pages/page-2.png","./colophon/pages/page-3.png","./colophon/pages/page-4.png","./colophon/pages/page-5.png","./colophon/pages/page-6.png","./colophon/pages/page-7.png","./colophon/pages/page-8.png","./colophon/pages/page-9.png","./colophon/pages/page-10.png","./colophon/pages/page-11.png","./colophon/pages/page-12.png","./colophon/pages/page-13.png","./colophon/pages/page-14.png","./colophon/pages/page-15.png","./colophon/pages/page-16.png","./README.md","./QR-links.csv"],"urls":["./data/rooms.json","./css/style.css","./js/app.js","./images/menu-colophon.pdf","./images/3ab4b9b3-a9c4-4017-8905-adec929c5855.png","./images/partner-1.png","./images/partner-2.png","./images/partner-3.png","./images/partner-4.png","./images/partner-5.png","./index.html","./wayfinding/pannello-01/index.html","./piano-0/pannello-02/index.html","./piano-1/pannello-03/index.html","./piano-1/pannello-04/index.html","./piano-0/pannello-05/index.html","./images/icon-192.png","./images/icon-512.png","./manifest.webmanifest","./audio/1.mp3","./audio/11.mp3","./audio/ICECUBES - company profile 2026 ENG lowres.pdf","./audio/1300c_mse_sc_mma_liutong.jpg","./audio/1300c_mse_sc_mma_liutong-ritaglio.jpg","./audio/BELLEROFONTE, PEGASO E LA CHIMERA_ENG_1.mp4","./colophon/index.html","./colophon/pages/page-1.png","./colophon/pages/page-2.png","./colophon/pages/page-3.png","./colophon/pages/page-4.png","./colophon/pages/page-5.png","./colophon/pages/page-6.png","./colophon/pages/page-7.png","./colophon/pages/page-8.png","./colophon/pages/page-9.png","./colophon/pages/page-10.png","./colophon/pages/page-11.png","./colophon/pages/page-12.png","./colophon/pages/page-13.png","./colophon/pages/page-14.png","./colophon/pages/page-15.png","./colophon/pages/page-16.png","./README.md","./QR-links.csv"]};
  const PREFIX='museumguide_'+encodeURIComponent(self.registration.scope)+'_';
  const CACHE=PREFIX+CONFIG.version;
  const urls=CONFIG.urls.map(u=>new URL(u,self.registration.scope).href);
  let running;
  async function notify(data){const clients=await self.clients.matchAll({includeUncontrolled:true});clients.forEach(c=>c.postMessage(data))}
  async function download(){
    if(running)return running;
    running=(async()=>{
      const cache=await caches.open(CACHE);let done=0,failed=0;const failedFiles=[];
      for(const url of urls){
        try{if(!await cache.match(url)){const res=await fetch(url,{cache:'reload'});if(!res.ok||res.status===206)throw Error('HTTP '+res.status);await cache.put(url,res)}done++}catch(e){failed++;failedFiles.push({url,error:e.message || 'rete o spazio disponibile'});}
        await notify({type:'CACHE_PROGRESS',done,total:urls.length,failed});
      }
      await notify({type:failed?'CACHE_ERROR':'CACHE_COMPLETE',done,total:urls.length,failed,failedFiles});
    })().catch(()=>notify({type:'CACHE_ERROR'})).finally(()=>{running=null});
    return running;
  }
  self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(CACHE);await c.addAll(CONFIG.shell);await self.skipWaiting()})())});
  self.addEventListener('activate',e=>e.waitUntil((async()=>{await self.clients.claim();await download();const c=await caches.open(CACHE);if((await Promise.all(urls.map(u=>c.match(u)))).every(Boolean)){for(const k of await caches.keys())if(k.startsWith(PREFIX)&&k!==CACHE)await caches.delete(k)}})()));
  self.addEventListener('message',e=>{if(e.data?.type==='CACHE_RESOURCES')e.waitUntil(download())});
  self.addEventListener('fetch',e=>{
    const req=e.request,url=new URL(req.url);
    if(req.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
    e.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      const cached=await cache.match(req.url)||(req.mode==='navigate'?(await cache.match(new URL('index.html',req.url).href)||await cache.match(new URL('index.html',self.registration.scope).href)):null);
      if(!cached)return fetch(req);
      const range=req.headers.get('range');
      if(!range)return cached;
      const match=/^bytes=(\d*)-(\d*)$/.exec(range);
      if(!match||(!match[1]&&!match[2]))return fetch(req);
      const data=await cached.arrayBuffer(),size=data.byteLength;
      let start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
      let end=match[1]?(match[2]?Math.min(Number(match[2]),size-1):size-1):size-1;
      if(start>=size||start>end)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});
      const headers=new Headers(cached.headers);headers.set('Content-Range','bytes '+start+'-'+end+'/'+size);headers.set('Content-Length',end-start+1);headers.set('Accept-Ranges','bytes');
      return new Response(data.slice(start,end+1),{status:206,headers});
    })());
  });
})();