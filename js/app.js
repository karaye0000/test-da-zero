// Runtime for exported museum guides. This file does not import generator code.
document.addEventListener('DOMContentLoaded', async () => {
  if (typeof MUSEUM_PREVIEW_READY !== 'undefined') await MUSEUM_PREVIEW_READY;
  let rooms = typeof MUSEUM_PREVIEW !== 'undefined' ? MUSEUM_PREVIEW.rooms : [];
  const preview = typeof MUSEUM_PREVIEW !== 'undefined';
  try {
    if (!preview) {
      const response = await fetch('./data/rooms.json');
      rooms = await response.json();
    }
  } catch (error) {
    console.error('Failed to load rooms.json:', error);
  }

  document.addEventListener('play',event=>{if(!event.target.matches('audio,video'))return;document.querySelectorAll('audio,video').forEach(player=>{if(player!==event.target)player.pause();});},true);
  const get = id => document.getElementById(id);
  function fitFooterLogos(){document.querySelectorAll('.footer-logo-row').forEach(row=>{const images=[...row.querySelectorAll('img')],gap=Math.min(parseFloat(getComputedStyle(row).getPropertyValue('--footer-block-gap'))||0,Math.max(0,row.clientWidth-images.length)/Math.max(1,images.length-1));row.style.gap=gap+'px';const desired=images.map(image=>({image,height:Number(image.dataset.logoHeight)||32,ratio:image.naturalWidth/Math.max(1,image.naturalHeight)}));if(desired.some(item=>!item.image.complete||!item.ratio))return;const width=desired.reduce((sum,item)=>sum+item.ratio*item.height,0),scale=Math.min(1,Math.max(1,row.clientWidth-gap*(images.length-1))/Math.max(1,width));desired.forEach(({image,height,ratio})=>{image.style.height=height*scale+'px';image.style.width=height*ratio*scale+'px';});});}
  document.querySelectorAll('.footer-logo-row img').forEach(image=>image.addEventListener('load',fitFooterLogos));window.addEventListener('resize',fitFooterLogos);if(typeof ResizeObserver!=='undefined')document.querySelectorAll('.footer-logo-row').forEach(row=>new ResizeObserver(fitFooterLogos).observe(row));fitFooterLogos();
  const updateHeaderHeight = () => document.documentElement.style.setProperty('--header-height', get('top').offsetHeight + 'px');
  updateHeaderHeight();
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(updateHeaderHeight).observe(get('top'));
  else window.addEventListener('resize', updateHeaderHeight);
  const params = new URLSearchParams(window.location.search);
  const roomId = (preview ? MUSEUM_PREVIEW.roomId : document.body.dataset.room || params.get('room')) || (rooms.length ? rooms[0].id : null);
  function renderRoom(id) {
    const room = rooms.find(room => room.id === id);
    if (!room) return;
    document.querySelectorAll('audio,video').forEach(player=>player.pause());
    get('roomTitle').innerHTML = room.title;
    get('roomTexts').replaceChildren();
    get('roomAudio').replaceChildren();
    const mainElements = room.mainElements || Object.entries(room.translations || {}).flatMap(([language, content]) => (content.texts || []).map(text => ({...text, type:'text', language})));
    for (const text of mainElements) {
      if (text.type === 'image') {
        const image = document.createElement('img'); image.className = 'room-image'; image.src = text.src; image.alt = text.alt || ''; image.loading = 'lazy'; get('roomTexts').append(image); continue;
      }
      const language = text.language;
        const block = document.createElement('div');
        block.className = 'expandable';
        block.lang = language;
        const labels = { it: ['Leggi di più', 'Leggi di meno'], en: ['Read More', 'Read Less'], fr: ['Lire la suite', 'Réduire'], de: ['Mehr lesen', 'Weniger lesen'], es: ['Leer más', 'Leer menos'] };
        const [more, less] = labels[language.split('-')[0]] || labels.en;
        block.innerHTML = '<div class="expandable-preview"><p class="expandable-teaser"></p></div><div class="expandable-full"></div><button class="expandable-toggle"></button>';
        block.querySelector('.expandable-teaser').textContent = text.preview;
        block.querySelector('.expandable-full').innerHTML = text.full;
        const toggle = block.querySelector('button');
        toggle.textContent = toggle.dataset.more = more;
        toggle.dataset.less = less;
        toggle.addEventListener('click', () => {
          toggle.textContent = block.classList.toggle('open') ? toggle.dataset.less : toggle.dataset.more;
        });
        get('roomTexts').append(block);
    }
    const counts = {};
    const audioElements = room.audioElements || Object.entries(room.translations || {}).flatMap(([language, content]) => (content.audios || []).map(src => ({language,src})));
    for (const {language, src:source} of audioElements) {
      const index = counts[language] || 0; counts[language] = index + 1;
        const block = document.createElement('div');
        block.className = 'audio-block';
        const label = document.createElement('h3');
        label.className = 'audio-lang';
        try { const name = new Intl.DisplayNames([language], { type: 'language' }).of(language); label.textContent = name.charAt(0).toUpperCase() + name.slice(1); }
        catch { label.textContent = language; }
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.preload = 'metadata';
        audio.className = 'audio-player';
        audio.id = language === 'it' ? 'audioIt' : language === 'en' ? 'audioEn' : 'audio-' + language;
        if (index) audio.id += '-' + (index + 1);
        audio.src = source;
        if (!index) block.append(label);
        block.append(audio);
        get('roomAudio').append(block);
    }
    const usableURL = value => {
      if (!value) return '';
      if (value.startsWith('./audio/') || preview && value.startsWith('blob:')) return value;
      try { const url = new URL(value); return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
    };
    const buttons = get('roomButtons'); buttons.replaceChildren();
    function button(label, href, section = false, id = '') {
      const link = document.createElement('a'); link.className = 'btn btn-guide'; link.textContent = label; link.href = section && !preview ? window.location.pathname+href : href;
      if (id) link.id = id;
      if (section) link.addEventListener('click', event => {
        event.preventDefault();
        const target = get(href.slice(1));
        const top = target.getBoundingClientRect().top + window.scrollY - get('top').offsetHeight - 8;
        window.scrollTo({ top, behavior: 'smooth' });
      });
      else { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      buttons.append(link);
    }
    const hasAudio = get('roomAudio').childElementCount > 0;
    get('audio-support').hidden = !hasAudio;
    if (hasAudio) button('Audio Support', '#audio-support', true);
    get('roomVideo').replaceChildren();
    for (const source of room.videos || []) {
      const url = usableURL(source); if (!url || /^(mailto|tel):/.test(url)) continue;
      const player = document.createElement('video'); player.controls = true; player.preload = 'metadata'; player.playsInline=true; player.addEventListener('loadedmetadata',()=>{if(player.videoWidth&&player.videoHeight)player.style.aspectRatio=player.videoWidth+'/'+player.videoHeight;}); player.className = 'video-player'; player.src = url;
      get('roomVideo').append(player);
    }
    get('video').hidden = !get('roomVideo').childElementCount;
    if (!get('video').hidden) button('Video', '#video', true);
    get('roomPDF').replaceChildren();
    for (const [index, source] of (room.pdfs || []).entries()) {
      const url = usableURL(source); if (!url || /^(mailto|tel):/.test(url)) continue;
      const link = document.createElement('a'); link.className = 'btn btn-guide'; link.href = url; link.textContent = 'Download PDF' + (room.pdfs.length > 1 ? ' ' + (index + 1) : '');
      link.target = '_blank'; link.rel = 'noopener noreferrer';
      if(preview)link.addEventListener('click', event => {
        event.preventDefault(); parent.postMessage({ type: 'PREVIEW_DOWNLOAD_PDF', token: MUSEUM_PREVIEW.token, roomId: id, index }, '*');
      });
      get('roomPDF').append(link);
    }
    get('approfondimenti').hidden = !get('roomPDF').childElementCount;
    if (!get('approfondimenti').hidden) button('Approfondimenti', '#approfondimenti', true);
    for (const link of room.links || [{ label: 'Smart Map', url: room.smart_map }]) {
      const url = usableURL(link.url); if (url) button(link.label, url, false, link.label === 'Smart Map' ? 'smartMapBtn' : '');
    }
    get('roomTitle').hidden = !room.title.trim();
    get('roomTexts').hidden = !get('roomTexts').childElementCount;
    buttons.hidden = !buttons.childElementCount;
    get('roomSection').hidden = get('roomTitle').hidden && get('roomTexts').hidden && buttons.hidden;
    let visible = 0;
    document.querySelectorAll('.main-content > section').forEach(section => {
      section.classList.toggle('has-divider', !section.hidden && visible > 0);
      if (!section.hidden) visible++;
    });
    animateElements();
    document.title = room.title.replace(/<br>/g, ' — ') + ' — Genius Loci';
    if (preview) parent.postMessage({ type: 'PREVIEW_ROOM', token: MUSEUM_PREVIEW.token, roomId: id }, '*');
    document.querySelectorAll('.menu-link').forEach(link => {
      link.style.color = link.dataset.room === id ? 'var(--color-primary)' : '';
    });
  }
  const observer=typeof IntersectionObserver==='undefined' ? null : new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{threshold:.08});
  function animateElements(){if(!observer || window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;document.querySelectorAll('.main-content h2,.main-content h3,.expandable,.room-image,.btn-guide,.audio-block,.video-player,.layout-footer-block').forEach(element=>{if(!element.classList.contains('scroll-reveal')){element.classList.add('scroll-reveal');observer.observe(element);}});}
  renderRoom(roomId);

  const menuList = get('menuList');
  function addRoom(room) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = preview ? '#'+encodeURIComponent(room.id) : new URL('./'+room.path,document.baseURI).href;
    link.className = 'menu-link';
    link.dataset.room = room.id;
    link.addEventListener('click', event => {
      if(!preview){event.preventDefault();setMenu(false);setTimeout(()=>window.location.assign(link.href),window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:300);return;}
      event.preventDefault(); setMenu(false); renderRoom(room.id); window.scrollTo(0, 0);
    });
    link.textContent = room.title.replace(/<br>/g, ' — ');
    if (room.id === roomId) link.style.color = 'var(--color-primary)';
    item.append(link);
    menuList.append(item);
  }
  function addDivider() {
    const item = document.createElement('li');
    item.className = 'menu-divider';
    menuList.append(item);
  }
  const menuConfig=get('burgerMenu').dataset;
  const filterEnabled=menuConfig.filterLocation === 'true';
  function renderMenu(location='') {
    menuList.replaceChildren();
    if (!filterEnabled) { rooms.forEach(addRoom); return; }
    const welcome=rooms.filter(room => room.menuPinned);
    welcome.forEach(addRoom); if(welcome.length)addDivider();
    const filterItem=document.createElement('li'), select=document.createElement('select');select.className='menu-location-filter';select.setAttribute('aria-label',menuConfig.filterPlaceholder || 'Scegli una posizione');
    const placeholder=new Option(menuConfig.filterPlaceholder || 'Scegli una posizione','');placeholder.disabled=true;placeholder.selected=!location;select.append(placeholder,new Option('Tutti','__all__'));
    const options=[...new Set(rooms.filter(room=>!welcome.includes(room)).map(room=>room.filterLocation).filter(Boolean))];
    options.forEach(value=>select.append(new Option(value,value)));if(location)select.value=location;
    select.addEventListener('change',()=>renderMenu(select.value));filterItem.append(select);menuList.append(filterItem);
    const candidates=rooms.filter(room=>!welcome.includes(room) && (!location || location==='__all__' || room.filterLocation===location));
    candidates.forEach(addRoom);
  }
  renderMenu();
  const colophon=get('menuColophon');
  if(preview && colophon) colophon.addEventListener('click',event=>{event.preventDefault();setMenu(false);parent.postMessage({type:'PREVIEW_OPEN_COLOPHON',token:MUSEUM_PREVIEW.token},'*');});

  function setMenu(open) {
    get('burgerMenu').classList.toggle('active', open);
    get('menuOverlay').classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  get('burgerBtn').addEventListener('click', () => setMenu(true));
  get('menuClose').addEventListener('click', () => setMenu(false));
  get('menuOverlay').addEventListener('click', () => setMenu(false));

  const backToTop = get('backToTop');
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
});

(function museumPWA(){
  const banner=document.getElementById('cacheBanner'),text=document.getElementById('cacheText'),retry=document.getElementById('cacheRetry');
  let worker,ready=false,timer;
  function show(message,complete=false){clearTimeout(timer);banner.classList.remove('hidden');banner.classList.toggle('ready',complete);text.textContent=message;text.title=message;retry.hidden=true;if(complete)timer=setTimeout(()=>banner.classList.add('hidden'),4000)}
  function request(){if(!navigator.onLine){show('Connessione assente: riconnettiti per completare il download');return}if(worker)worker.postMessage({type:'CACHE_RESOURCES'})}
  navigator.serviceWorker?.addEventListener('message',e=>{
    const d=e.data||{};
    if(d.type==='CACHE_PROGRESS')show('Download risorse: '+d.done+'/'+d.total);
    if(d.type==='CACHE_COMPLETE'){ready=true;show('Risorse disponibili offline ✓',true)}
    if(d.type==='CACHE_ERROR'){ready=false;show('Download incompleto: '+(d.failedFiles?.length?d.failedFiles.slice(0,3).map(file=>{let name=file.url.split('/').pop();try{name=decodeURIComponent(name);}catch{}return name+' ('+file.error+')';}).join(' · '):'riprova'));retry.hidden=false}
  });
  window.addEventListener('online',request);
  window.addEventListener('offline',()=>show(ready?'Modalità offline: risorse disponibili':'Offline: download incompleto'));
  retry.addEventListener('click',request);
  if(!('serviceWorker' in navigator)||!window.isSecureContext){show('Offline disponibile su HTTPS o localhost');return}
  navigator.serviceWorker.register(new URL('./sw.js',document.baseURI).href).then(()=>navigator.serviceWorker.ready).then(reg=>{worker=reg.active;request()}).catch(()=>{show('Impossibile attivare la modalità offline');retry.hidden=false});
})();