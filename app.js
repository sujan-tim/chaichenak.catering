import { menu, categories, featuredStationIds } from './catalog.js';
import { motionAllowed, initExperience } from './experience.js';
const $ = (s) => document.querySelector(s);
const money = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2});
const storageKey = 'chai-chenak-plan-v1';
const isMenuPage=document.body.dataset.page==='menu';
let selected = new Set(), filter = 'all', visibleLimit=8, requestId=crypto.randomUUID(), planValues={guests:100,budget:''};
try { const draft = JSON.parse(localStorage.getItem(storageKey)); if (Array.isArray(draft?.selected)) selected = new Set(draft.selected.filter(id=>menu.some(item=>item.id===id))); for(const key of ['guests','budget']){ const value=Number(draft?.[key]); if(Number.isInteger(value)&&value>0&&value<=(key==='guests'?10000:10000000)) {planValues[key]=value;if($('#plan-'+key))$('#plan-'+key).value=value;} } } catch {}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
function savePlan(){for(const key of ['guests','budget'])if($('#plan-'+key))planValues[key]=$('#plan-'+key).value;try{localStorage.setItem(storageKey,JSON.stringify({selected:[...selected],...planValues}));}catch{}}
function syncSelection(){
 document.querySelectorAll('[data-menu]').forEach(button=>{const added=selected.has(button.dataset.menu);button.setAttribute('aria-pressed',String(added));button.innerHTML=`<span>${added?'Added to your event':'Add to your event'}</span><span aria-hidden="true">${added?'✓':'+'}</span>`;});
 const count=$('#nav-plan-count');count.hidden=selected.size===0;count.textContent=selected.size;
 if(typeof activeStation!=='undefined'&&activeStation){const added=selected.has(activeStation.id);$('#station-dialog-add').textContent=added?'✓ Added — remove from event':'+ Add to your event';$('#station-dialog-add').setAttribute('aria-pressed',String(added));}
}
function pausePreviews(){document.querySelectorAll('.station-preview').forEach(video=>{video.pause();video.classList.remove('is-playing');});}
function bindPreviews(){
 document.querySelectorAll('.station-media').forEach(media=>{
  const video=media.querySelector('video');if(!video)return;
  const play=()=>{if(!motionAllowed()||!matchMedia('(hover: hover) and (pointer: fine)').matches||document.hidden)return;pausePreviews();if(!video.src){video.src=video.dataset.src;video.load();}video.play().then(()=>{if(media.matches(':hover')||media.contains(document.activeElement))video.classList.add('is-playing');else video.pause();}).catch(()=>{});};
  const stop=()=>{video.pause();video.classList.remove('is-playing');};media.addEventListener('mouseenter',play);media.addEventListener('mouseleave',stop);media.addEventListener('focusin',play);media.addEventListener('focusout',event=>{if(!media.contains(event.relatedTarget))stop();});
 });
}
function renderMenu(){
 pausePreviews();const query=($('#menu-search')?.value||'').trim().toLowerCase();const matches=menu.filter(item=>(isMenuPage||featuredStationIds.includes(item.id))&&(filter==='all'||item.category===filter)&&(item.name+' '+item.description).toLowerCase().includes(query));
 $('#menu-grid').innerHTML=matches.slice(0,visibleLimit).map(item=>`<article class="menu-card station-card-new"><div class="station-media"><img src="/${item.image}" alt="${item.alt||item.name+' at a Chai Chenak event'}" width="540" height="720" loading="lazy" decoding="async">${item.video?`<video class="station-preview" data-src="/${item.video}" muted playsinline loop preload="none" aria-hidden="true" tabindex="-1"></video>`:''}<button class="station-watch" type="button" data-watch="${item.id}" aria-label="${item.video?'Watch':'Explore'} ${item.name}"><span aria-hidden="true">${item.video?'▶':'↗'}</span><strong>${item.video?'Watch the station':'Explore the station'}</strong><span aria-hidden="true">↗</span></button></div><div class="menu-card-content"><span class="menu-category">${categories[item.category]}</span><h3>${item.name}</h3><p>${item.description}</p><button type="button" data-menu="${item.id}" aria-pressed="${selected.has(item.id)}"></button></div></article>`).join('');
 if(isMenuPage){$('#menu-empty').hidden=matches.length>0;$('#menu-results').textContent=`${Math.min(visibleLimit,matches.length)} of ${matches.length} stations shown`;$('#load-stations').hidden=matches.length<=visibleLimit;$('#load-stations').innerHTML=`Explore ${Math.max(0,matches.length-visibleLimit)} more stations <span aria-hidden="true">↓</span>`;}bindPreviews();syncSelection();
}
function updatePlan(){
 requestId=crypto.randomUUID();syncSelection();const items=menu.filter(item=>selected.has(item.id));
 $('#form-shortlist').textContent=items.length?items.map(item=>item.name).join(' · '):'No selections yet — we can help you choose.';
 if(isMenuPage){
  $('#selected-menu').innerHTML=items.map(item=>`<li>${item.name}<button type="button" data-remove="${item.id}" aria-label="Remove ${item.name}">×</button></li>`).join('');
  $('#selection-count').textContent=items.length?`${items.length} experience${items.length===1?'':'s'} on your shortlist`:'Choose a few favorites to get started.';
  const guests=Number($('#plan-guests').value),budget=Number($('#plan-budget').value);$('#per-guest').textContent=guests>0&&budget>0&&$('#plan-guests').validity.valid&&$('#plan-budget').validity.valid?money.format(budget/guests):'—';
 }
 savePlan();
}
$('#menu-grid').addEventListener('click',event=>{const button=event.target.closest('[data-menu]');if(!button)return;const id=button.dataset.menu;selected.has(id)?selected.delete(id):selected.add(id);updatePlan();$(`[data-menu="${id}"]`)?.focus({preventScroll:true});});
$('#selected-menu')?.addEventListener('click',event=>{const button=event.target.closest('[data-remove]');if(!button)return;selected.delete(button.dataset.remove);updatePlan();$('#selection-count').tabIndex=-1;$('#selection-count').focus({preventScroll:true});});
function chooseFilter(value){filter=value;visibleLimit=8;document.querySelectorAll('[data-filter]').forEach(button=>{const active=button.dataset.filter===value;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});renderMenu();}
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>chooseFilter(button.dataset.filter)));
document.querySelectorAll('[data-category-link]').forEach(link=>link.addEventListener('click',event=>{if(!isMenuPage)return;event.preventDefault();$('#menu-search').value='';chooseFilter(link.dataset.categoryLink);history.replaceState(null,'',link.href);$('#menu').scrollIntoView({behavior:motionAllowed()?'smooth':'instant'});}));
$('#menu-search')?.addEventListener('input',()=>{visibleLimit=8;renderMenu();});
$('#load-stations')?.addEventListener('click',()=>{const previous=visibleLimit;visibleLimit+=8;renderMenu();const card=$$('#menu-grid .menu-card')[previous];card?.querySelector('button')?.focus({preventScroll:true});});
function $$(selector){return [...document.querySelectorAll(selector)];}
document.addEventListener('chai-motion-change',()=>{if(!motionAllowed())pausePreviews();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pausePreviews();});
for(const key of ['guests','budget']) $('#plan-'+key)?.addEventListener('input',updatePlan);
$('#clear-plan')?.addEventListener('click',()=>{selected.clear();$('#plan-guests').value=100;$('#plan-budget').value='';renderMenu();updatePlan();try{localStorage.removeItem(storageKey);}catch{}toast('Your saved shortlist has been cleared.');});
$('#use-plan')?.addEventListener('click',()=>{for(const key of ['guests','budget']) if($('#plan-'+key).validity.valid) $('#'+key).value=$('#plan-'+key).value;});
$('#download-plan')?.addEventListener('click',()=>{const names=menu.filter(item=>selected.has(item.id)).map(item=>'- '+item.name);const text=['CHAI CHENAK — YOUR EVENT PLAN','',`Guests: ${$('#plan-guests').value||'To be confirmed'}`,`Your total budget: ${$('#plan-budget').value?money.format(Number($('#plan-budget').value)):'To be discussed'}`,`Budget per guest: ${$('#per-guest').textContent}`,'','Menu shortlist:',...names,'','This is a planning shortlist, not a quote or confirmed booking.','Contact: chaichenakcatering@gmail.com | (732) 317-1175'].join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='chai-chenak-event-plan.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Your event plan has been downloaded.');});
let activeStation=null;
const stationDialog=$('#station-dialog'),stationVideo=$('#station-video');
function modalState(){document.body.classList.toggle('dialog-open',Boolean(document.querySelector('dialog[open]')));document.dispatchEvent(new Event('chai-dialog-change'));}
function showStation(id){
 const item=menu.find(entry=>entry.id===id);if(!item)return;activeStation=item;pausePreviews();stationVideo.pause();stationVideo.removeAttribute('src');stationVideo.load();
 $('#station-dialog-title').textContent=item.name;$('#station-dialog-category').textContent=categories[item.category];$('#station-dialog-description').textContent=item.description;$('#station-position').textContent=`${String(menu.indexOf(item)+1).padStart(2,'0')} / ${menu.length}`;
 $('.station-film-note').textContent='A moment from a Chai Chenak event · silent film';stationVideo.hidden=!item.video;$('#station-dialog-image').hidden=Boolean(item.video);$('.station-film-note').hidden=!item.video;
 if(item.video){stationVideo.poster='/'+item.image;stationVideo.src='/'+item.video;stationVideo.loop=motionAllowed();stationVideo.load();}else{$('#station-dialog-image').src='/'+item.image;$('#station-dialog-image').alt=item.alt||item.name;}
 syncSelection();if(!stationDialog.open)stationDialog.showModal();modalState();if(item.video)stationVideo.play().then(()=>{if(!stationDialog.open)stationVideo.pause();}).catch(()=>{});
}
document.addEventListener('click',event=>{const trigger=event.target.closest('[data-watch]');if(trigger)showStation(trigger.dataset.watch);});
function closeStation(){stationVideo.pause();stationDialog.close();}
$('#close-station').addEventListener('click',closeStation);stationDialog.addEventListener('cancel',event=>{event.preventDefault();closeStation();});stationDialog.addEventListener('close',()=>{stationVideo.pause();stationVideo.removeAttribute('src');stationVideo.load();modalState();});
stationDialog.addEventListener('click',event=>{if(event.target!==stationDialog)return;const r=stationDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeStation();});
$('#station-dialog-add').addEventListener('click',()=>{const id=activeStation.id;selected.has(id)?selected.delete(id):selected.add(id);updatePlan();});
$('#station-view-plan').addEventListener('click',event=>{closeStation();if(!isMenuPage)return;event.preventDefault();$('#selection-count').tabIndex=-1;setTimeout(()=>{$('.plan-card').scrollIntoView({behavior:motionAllowed()?'smooth':'instant',block:'center'});$('#selection-count').focus({preventScroll:true});},0);});
function adjacentStation(delta){showStation(menu[(menu.indexOf(activeStation)+delta+menu.length)%menu.length].id);}
stationVideo.addEventListener('error',()=>{if(stationDialog.open&&stationVideo.getAttribute('src'))$('.station-film-note').textContent='Film unavailable. You can still add this station to your event.';});
$('#station-prev').addEventListener('click',()=>adjacentStation(-1));$('#station-next').addEventListener('click',()=>adjacentStation(1));
if(isMenuPage){const requested=new URLSearchParams(location.search).get('category');if(requested==='all'||categories[requested])filter=requested;chooseFilter(filter);}else renderMenu();updatePlan();
for(const key of ['guests','budget'])if(planValues[key])$('#'+key).value=planValues[key];
// Mobile navigation remains usable after resizing and supports keyboard dismissal.
const hamburger=$('.hamburger'),navigation=$('#navigation');function closeMenu(){navigation.classList.remove('open');hamburger.setAttribute('aria-expanded','false');hamburger.setAttribute('aria-label','Open menu');}
hamburger.addEventListener('click',()=>{const open=navigation.classList.toggle('open');hamburger.setAttribute('aria-expanded',String(open));hamburger.setAttribute('aria-label',open?'Close menu':'Open menu');});navigation.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});document.addEventListener('keydown',event=>{if(event.key==='Escape'&&navigation.classList.contains('open')){closeMenu();hamburger.focus();}});matchMedia('(min-width: 901px)').addEventListener('change',closeMenu);
// Keep the original truck-art motif.
const ns='http://www.w3.org/2000/svg',colors=['#C1272D','#0E7C86','#D9A441','#146B3A','#D63384'];for(let i=0;i<30;i++){const g=document.createElementNS(ns,'g');g.setAttribute('transform',`translate(${18+i*1144/29} 30)`);for(let p=0;p<4;p++){const e=document.createElementNS(ns,'ellipse');Object.entries({rx:'6.5',ry:'3',transform:`rotate(${p*45})`,fill:colors[i%5]}).forEach(([k,v])=>e.setAttribute(k,v));g.append(e);}$('#flagset')?.append(g);}
// Gallery modal provides native focus trapping and Escape-to-close.
const allPhotos=[...document.querySelectorAll('.g-item img')];let gallery=[...allPhotos],photoIndex=0,galleryLimit=8;
function renderGallery(){const matching=new Set(gallery);allPhotos.forEach(img=>{img.parentElement.hidden=!matching.has(img)||gallery.indexOf(img)>=galleryLimit;});if($('#gallery-count'))$('#gallery-count').textContent=`${Math.min(galleryLimit,gallery.length)} of ${gallery.length} photographs`;if($('#gallery-more'))$('#gallery-more').hidden=galleryLimit>=gallery.length;}
document.querySelectorAll('[data-gallery-filter]').forEach(button=>button.addEventListener('click',()=>{gallery=allPhotos.filter(img=>button.dataset.galleryFilter==='all'||img.parentElement.dataset.galleryCategory===button.dataset.galleryFilter);galleryLimit=8;document.querySelectorAll('[data-gallery-filter]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});renderGallery();}));
$('#gallery-more')?.addEventListener('click',()=>{const firstNew=gallery[galleryLimit];galleryLimit+=8;renderGallery();firstNew?.parentElement.focus({preventScroll:true});});function showPhoto(index){photoIndex=(index+gallery.length)%gallery.length;$('#gallery-image').src=gallery[photoIndex].src;$('#gallery-image').alt=gallery[photoIndex].alt;$('#gallery-caption').textContent=`${photoIndex+1} / ${gallery.length} · ${gallery[photoIndex].alt}`;}
allPhotos.forEach(img=>img.parentElement.addEventListener('click',()=>{showPhoto(gallery.indexOf(img));$('#gallery-dialog').showModal();pausePreviews();modalState();}));$('#close-gallery').addEventListener('click',()=>$('#gallery-dialog').close());$('#gallery-prev').addEventListener('click',()=>showPhoto(photoIndex-1));$('#gallery-next').addEventListener('click',()=>showPhoto(photoIndex+1));$('#gallery-dialog').addEventListener('keydown',event=>{if(event.key==='ArrowRight')showPhoto(photoIndex+1);if(event.key==='ArrowLeft')showPhoto(photoIndex-1);});$('#gallery-dialog').addEventListener('click',event=>{if(event.target===$('#gallery-dialog')){const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();}});
// Catering inquiry: progressive validation, safe retries, and durable server confirmation.
const form=$('#inquiry-form');function today(){return new Date().toLocaleDateString('en-CA',{timeZone:'America/New_York'});}$('#event-date').min=today();
function step(number){$('#event-step').hidden=number!==1;$('#details-step').hidden=number!==2;$('#details-step').disabled=number!==2;$('#step-label-1').classList.toggle('current',number===1);$('#step-label-2').classList.toggle('current',number===2);const legend=$(number===1?'#event-step legend':'#details-step legend');legend.tabIndex=-1;legend.focus({preventScroll:true});}
$('#next-step').addEventListener('click',()=>{const controls=[...$('#event-step').querySelectorAll('input,select')];const invalid=controls.find(control=>!control.reportValidity());if(!invalid)step(2);});$('#back-step').addEventListener('click',()=>step(1));form.addEventListener('input',()=>{requestId=crypto.randomUUID();$('#form-status').textContent='';});
form.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity())return;const button=$('#submit-inquiry');button.disabled=true;button.textContent='Sending inquiry…';$('#form-status').textContent='';const payload={...Object.fromEntries(new FormData(form)),consent:form.elements.consent.checked,menu:[...selected],requestId};try{const response=await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});const result=await response.json();if(!response.ok)throw new Error(result.error||'We couldn’t save your inquiry. Please try again.');form.hidden=true;$('#inquiry-reference').textContent=result.reference;$('#inquiry-success').hidden=false;$('#inquiry-success').focus();}catch(error){$('#form-status').textContent=error.name==='TimeoutError'?'The connection timed out. Your details are still here; please try again.':error.message==='Failed to fetch'?'We couldn’t connect. Please try again, or call (732) 317-1175.':error.message;$('#form-status').focus();}finally{button.disabled=false;button.textContent='Send inquiry ↗';}});
$('#new-inquiry').addEventListener('click',()=>{form.reset();requestId=crypto.randomUUID();form.hidden=false;$('#inquiry-success').hidden=true;$('#form-status').textContent='';step(1);updatePlan();});
document.querySelectorAll('.service-card').forEach((card,i)=>{const a=document.createElement('a');a.href='#contact';a.className='service-link';a.textContent='Plan this event ↗';a.addEventListener('click',()=>{$('#event-type').value=['Wedding','Corporate Event','Private Party / Gala'][i];});card.append(a);});

$('#gallery-dialog').addEventListener('close',modalState);
// Load third-party previews only when the Instagram section approaches the viewport.
const instagramObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.src=entry.target.dataset.instagramSrc;instagramObserver.unobserve(entry.target);}},{rootMargin:'150px'});
document.querySelectorAll('[data-instagram-src]').forEach(frame=>instagramObserver.observe(frame));
initExperience();
