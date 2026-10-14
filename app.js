import { menu, menuGroups, categories, featuredStationIds } from './catalog.js';
import { motionAllowed, initExperience } from './experience.js';
const $ = (s) => document.querySelector(s);
const storageKey = 'chai-chenak-plan-v1';
const isMenuPage=document.body.dataset.page==='menu';
let selected = new Set(), filter = 'all', requestId=crypto.randomUUID(), planValues={guests:100,venue:''};
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const searchText=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const filmedMenu=menu.filter(item=>item.video);
let previewObserver;
const visiblePreviews=new Set();
try { const draft = JSON.parse(localStorage.getItem(storageKey)); if (Array.isArray(draft?.selected)) selected = new Set(draft.selected.filter(id=>menu.some(item=>item.id===id))); const guests=Number(draft?.guests);if(Number.isInteger(guests)&&guests>0&&guests<=10000){planValues.guests=guests;if($('#plan-guests'))$('#plan-guests').value=guests;}if(typeof draft?.venue==='string'){planValues.venue=draft.venue;if($('#plan-venue'))$('#plan-venue').value=draft.venue;} } catch {}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
function savePlan(){const guests=$('#plan-guests');if(guests)planValues.guests=guests.value;const venue=$('#plan-venue');if(venue)planValues.venue=venue.value;try{localStorage.setItem(storageKey,JSON.stringify({selected:[...selected],...planValues}));}catch{}}
function syncSelection(){
 document.querySelectorAll('[data-menu]').forEach(button=>{const added=selected.has(button.dataset.menu);const item=menu.find(entry=>entry.id===button.dataset.menu);button.setAttribute('aria-pressed',String(added));button.setAttribute('aria-label',`${added?'Remove':'Add'} ${item.selectionName} ${added?'from':'to'} your event`);button.innerHTML=`<span>${added?'Added to your event':'Add to your event'}</span><span aria-hidden="true">${added?'✓':'+'}</span>`;});
 const count=$('#nav-plan-count');count.hidden=selected.size===0;count.textContent=selected.size;
 if(typeof activeStation!=='undefined'&&activeStation){const added=selected.has(activeStation.id);$('#station-dialog-add').textContent=added?'✓ Added — remove from event':'+ Add to your event';$('#station-dialog-add').setAttribute('aria-pressed',String(added));}
}
function pausePreviews(){document.querySelectorAll('.station-preview').forEach(video=>{video.pause();video.classList.remove('is-playing');});}
function canPlayPreview(video){return video.isConnected&&visiblePreviews.has(video)&&motionAllowed()&&!document.hidden&&!document.querySelector('dialog[open]');}
function updatePreviews(){
 if(!isMenuPage){if(!motionAllowed()||document.hidden)pausePreviews();return;}
 document.querySelectorAll('.station-preview').forEach(video=>{
  if(!canPlayPreview(video)){video.pause();video.classList.remove('is-playing');return;}
  if(!video.getAttribute('src')){video.src=video.dataset.src;video.muted=true;video.load();}
  video.play().then(()=>{if(canPlayPreview(video))video.classList.add('is-playing');else{video.pause();video.classList.remove('is-playing');}}).catch(()=>video.classList.remove('is-playing'));
 });
}
function bindPreviews(){
 if(isMenuPage){
  previewObserver=new IntersectionObserver(entries=>{
   for(const entry of entries){if(entry.isIntersecting&&entry.intersectionRatio>=.15)visiblePreviews.add(entry.target);else visiblePreviews.delete(entry.target);}
   updatePreviews();
  },{threshold:[0,.15]});
  document.querySelectorAll('.station-preview').forEach(video=>previewObserver.observe(video));
  return;
 }
 document.querySelectorAll('.station-media').forEach(media=>{
  const video=media.querySelector('video');if(!video)return;
  const play=()=>{if(!motionAllowed()||!matchMedia('(hover: hover) and (pointer: fine)').matches||document.hidden)return;pausePreviews();if(!video.src){video.src=video.dataset.src;video.load();}video.play().then(()=>{if(media.matches(':hover')||media.contains(document.activeElement))video.classList.add('is-playing');else video.pause();}).catch(()=>{});};
  const stop=()=>{video.pause();video.classList.remove('is-playing');};media.addEventListener('mouseenter',play);media.addEventListener('mouseleave',stop);media.addEventListener('focusin',play);media.addEventListener('focusout',event=>{if(!media.contains(event.relatedTarget))stop();});
 });
}
function filmCard(item){
 if(!item.video)return `<article class="menu-card station-card-new station-card-text"><div class="menu-card-content"><span class="menu-category">${escapeHTML(categories[item.category])}</span><h3>${escapeHTML(item.name)}</h3><p>${escapeHTML(item.description)}</p><button type="button" data-menu="${item.id}" aria-pressed="${selected.has(item.id)}"></button></div></article>`;
 return `<article class="menu-card station-card-new"><div class="station-media"><img src="/${item.image}" alt="${escapeHTML(item.name)} at a Chai Chenak event" width="540" height="720" loading="lazy" decoding="async"><video class="station-preview" data-src="/${item.video}" muted playsinline loop preload="none" aria-hidden="true" tabindex="-1"></video><button class="station-watch" type="button" data-watch="${item.id}" aria-label="Watch ${escapeHTML(item.name)}"><span aria-hidden="true">▶</span><strong>Watch the station</strong><span aria-hidden="true">↗</span></button></div><div class="menu-card-content"><span class="menu-category">${escapeHTML(categories[item.category])}</span><h3>${escapeHTML(item.name)}</h3>${item.description?`<p>${escapeHTML(item.description)}</p>`:''}${item.surcharge?`<p class="menu-surcharge">${escapeHTML(item.surcharge)}</p>`:''}<button type="button" data-menu="${item.id}" aria-pressed="${selected.has(item.id)}"></button></div></article>`;
}
function renderMenu(){
 if(!$('#menu-grid'))return;
 previewObserver?.disconnect();visiblePreviews.clear();pausePreviews();
 if(isMenuPage){
  if(filter==='tray-order'){
   $('#menu-grid').innerHTML='<div class="tray-order-only"><img src="/menu-sheets/tray-order.jpg" alt="Tray order menu"></div>';
   $('#menu-empty').hidden=true;
   $('#menu-results').textContent='Tray order menu';
   $('#menu-more-link').hidden=true;
   $('#motion-toggle').hidden=true;
   bindPreviews();syncSelection();return;
  }
  const query=searchText(($('#menu-search').value||'').trim());
  const matchingGroups=menuGroups.filter(group=>filter==='all'||group.category===filter).map(group=>({
   ...group,items:menu.filter(item=>item.group===group.id&&searchText(`${item.name} ${item.description} ${group.title} ${categories[item.category]}`).includes(query))
  })).filter(group=>group.items.length);
  const films=matchingGroups.flatMap(group=>group.items).filter(item=>item.video);
  const groups=matchingGroups.map(group=>({...group,items:group.items.filter(item=>!item.video)})).filter(group=>group.items.length);
  const textSections=groups.map((group,index)=>`<details class="menu-group" data-group="${group.id}" ${query||filter!=='all'||index===0?'open':''}>
   <summary><span><span class="menu-category">${escapeHTML(categories[group.category])}</span><span class="menu-group-title">${escapeHTML(group.title)}</span></span><span class="menu-group-count">${group.items.length} choices</span><span class="menu-group-toggle" aria-hidden="true">+</span></summary>
   ${group.note?`<p class="menu-group-note">${escapeHTML(group.note)}</p>`:''}
   <div class="menu-item-grid">${group.items.map(item=>`<article class="menu-card menu-item"><div class="menu-card-content"><h3>${escapeHTML(item.name)}</h3>${item.description?`<p>${escapeHTML(item.description)}</p>`:''}${item.surcharge?`<p class="menu-surcharge">${escapeHTML(item.surcharge)}</p>`:''}<div class="menu-item-actions"><button type="button" data-menu="${item.id}" aria-pressed="${selected.has(item.id)}"></button></div></div></article>`).join('')}</div>
  </details>`).join('');
  $('#menu-grid').innerHTML=`${films.length?`<section class="menu-films" id="menu-videos" aria-labelledby="menu-films-title"><div class="menu-collection-heading"><span class="eyebrow">A taste of the celebration</span><h2 id="menu-films-title">Our stations in action.</h2><p>Watch a moment from our events and add your favorites.</p></div><div class="menu-grid menu-video-grid">${films.map(filmCard).join('')}</div></section>`:''}${groups.length?`<section class="menu-text-section" id="menu-more" aria-labelledby="menu-more-title"><div class="menu-collection-heading"><span class="eyebrow">More for your occasion</span><h2 id="menu-more-title">Explore the rest of the menu.</h2><p>Open a section to discover more dishes, drinks and live stations.</p></div><div class="menu-text-groups">${textSections}</div></section>`:''}`;
  const count=matchingGroups.reduce((sum,group)=>sum+group.items.length,0);
  $('#menu-empty').hidden=count>0;
  $('#menu-results').textContent=`${count} menu choices${films.length?` · ${films.length} station film${films.length===1?'':'s'}`:''}`;
  $('#menu-more-link').hidden=!films.length||!groups.length;
  $('#motion-toggle').hidden=!films.length;
 }else{
  $('#menu-grid').innerHTML=featuredStationIds.map(id=>menu.find(item=>item.id===id)).map(filmCard).join('');
 }
 bindPreviews();
 syncSelection();
}
function updatePlan(){
 requestId=crypto.randomUUID();syncSelection();const items=menu.filter(item=>selected.has(item.id));
 $('#form-shortlist').textContent=items.length?items.map(item=>item.selectionName).join(' · '):'No selections yet — we can help you choose.';
 if(isMenuPage){
  $('#selected-menu').innerHTML=items.map(item=>`<li>${escapeHTML(item.selectionName)}<button type="button" data-remove="${item.id}" aria-label="Remove ${escapeHTML(item.selectionName)}">×</button></li>`).join('');
  $('#selection-count').textContent=items.length?`${items.length} selection${items.length===1?'':'s'} on your shortlist`:'Choose a few favorites to get started.';
 }
 savePlan();
}
$('#menu-grid')?.addEventListener('click',event=>{const button=event.target.closest('[data-menu]');if(!button)return;const id=button.dataset.menu;selected.has(id)?selected.delete(id):selected.add(id);updatePlan();$(`[data-menu="${id}"]`)?.focus({preventScroll:true});});
$('#selected-menu')?.addEventListener('click',event=>{const button=event.target.closest('[data-remove]');if(!button)return;selected.delete(button.dataset.remove);updatePlan();$('#selection-count').tabIndex=-1;$('#selection-count').focus({preventScroll:true});});
function chooseFilter(value){filter=value;document.querySelectorAll('[data-filter]').forEach(button=>{const active=button.dataset.filter===value;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});renderMenu();}
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>chooseFilter(button.dataset.filter)));
document.querySelectorAll('[data-category-link]').forEach(link=>link.addEventListener('click',event=>{if(!isMenuPage)return;event.preventDefault();$('#menu-search').value='';chooseFilter(link.dataset.categoryLink);history.replaceState(null,'',link.href);$('#menu').scrollIntoView({behavior:motionAllowed()?'smooth':'instant'});}));
$('#menu-search')?.addEventListener('input',renderMenu);
function $$(selector){return [...document.querySelectorAll(selector)];}
document.addEventListener('chai-motion-change',updatePreviews);document.addEventListener('visibilitychange',updatePreviews);document.addEventListener('chai-dialog-change',updatePreviews);
for(const key of ['guests','venue']) $('#plan-'+key)?.addEventListener('input',updatePlan);
$('#clear-plan')?.addEventListener('click',()=>{selected.clear();$('#plan-guests').value=100;$('#plan-venue').value='';renderMenu();updatePlan();try{localStorage.removeItem(storageKey);}catch{}toast('Your saved shortlist has been cleared.');});
$('#use-plan')?.addEventListener('click',()=>{if($('#plan-guests').validity.valid)$('#guests').value=$('#plan-guests').value;const venue=$('#plan-venue')?.value.trim();if(venue&&$('#venue'))$('#venue').value=venue;});
$('#download-plan')?.addEventListener('click',()=>{const names=menu.filter(item=>selected.has(item.id)).map(item=>'- '+item.selectionName);const text=['CHAI CHENAK — YOUR EVENT PLAN','',`Guests: ${$('#plan-guests').value||'To be confirmed'}`,`Venue or city: ${$('#plan-venue').value.trim()||'To be confirmed'}`,'','Menu shortlist:',...names,'','This is a planning shortlist, not a quote or confirmed booking.','Contact: chaichenakcatering@gmail.com | +1 (732) 881-8544 (text only) | +1 (908) 549-6293 (text or call)'].join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='chai-chenak-event-plan.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Your event plan has been downloaded.');});
let activeStation=null;
const stationDialog=$('#station-dialog'),stationVideo=$('#station-video');
function modalState(){document.body.classList.toggle('dialog-open',Boolean(document.querySelector('dialog[open]')));document.dispatchEvent(new Event('chai-dialog-change'));}
function showStation(id){
 const item=menu.find(entry=>entry.id===id);if(!item)return;activeStation=item;pausePreviews();stationVideo.pause();stationVideo.removeAttribute('src');stationVideo.load();
 $('#station-dialog-title').textContent=item.name;$('#station-dialog-category').textContent=categories[item.category];$('#station-dialog-description').textContent=[item.description,item.surcharge].filter(Boolean).join(' ');$('#station-position').textContent=`${String(filmedMenu.indexOf(item)+1).padStart(2,'0')} / ${filmedMenu.length}`;
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
function adjacentStation(delta){showStation(filmedMenu[(filmedMenu.indexOf(activeStation)+delta+filmedMenu.length)%filmedMenu.length].id);}
stationVideo.addEventListener('error',()=>{if(stationDialog.open&&stationVideo.getAttribute('src'))$('.station-film-note').textContent='Film unavailable. You can still add this station to your event.';});
$('#station-prev').addEventListener('click',()=>adjacentStation(-1));$('#station-next').addEventListener('click',()=>adjacentStation(1));
if(isMenuPage){const requested=new URLSearchParams(location.search).get('category');if(requested==='all'||categories[requested])filter=requested;chooseFilter(filter);}else renderMenu();updatePlan();
for(const key of ['guests','venue']){const field=$('#'+key);if(planValues[key]&&field)field.value=planValues[key];}
// Mobile navigation remains usable after resizing and supports keyboard dismissal.
const hamburger=$('.hamburger'),navigation=$('#navigation');function closeMenu(){navigation.classList.remove('open');hamburger.setAttribute('aria-expanded','false');hamburger.setAttribute('aria-label','Open menu');}
hamburger.addEventListener('click',()=>{const open=navigation.classList.toggle('open');hamburger.setAttribute('aria-expanded',String(open));hamburger.setAttribute('aria-label',open?'Close menu':'Open menu');});navigation.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});document.addEventListener('keydown',event=>{if(event.key==='Escape'&&navigation.classList.contains('open')){closeMenu();hamburger.focus();}});matchMedia('(min-width: 901px)').addEventListener('change',closeMenu);
const hallNavigation=$('.nav-halls');
hallNavigation.addEventListener('click',event=>{if(event.target.closest('a'))hallNavigation.open=false;});
document.addEventListener('click',event=>{if(!hallNavigation.contains(event.target))hallNavigation.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&hallNavigation.open){hallNavigation.open=false;if(!navigation.classList.contains('open'))hallNavigation.querySelector('summary').focus();}});
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
function syncTastingFields(){const tasting=$('#event-type').value==='Food Tasting';$('#event-step legend').textContent=tasting?'Request a food tasting':'Let’s start with your event';$('#guests-label').textContent=tasting?'People attending the tasting':'Guest count';$('#date-label').textContent=tasting?'Preferred tasting date':'Event date';$('#time-label').textContent=tasting?'Preferred tasting time':'Event time';$('#time-required').hidden=!tasting;$('#event-time').required=tasting;$('#venue-label').textContent=tasting?'Tasting location or city':'Venue or city';$('#venue-required').hidden=tasting;$('#venue').required=!tasting;$('#venue').placeholder=tasting?'Optional — we can confirm the tasting location':'Venue name or city and state';if(tasting&&$('#guests').value==='100')$('#guests').value='';if(!tasting&&!$('#guests').value)$('#guests').value='100';$('#submit-inquiry').innerHTML=tasting?'Request tasting time <span aria-hidden="true">↗</span>':'Send inquiry <span aria-hidden="true">↗</span>';}
$('#event-type').addEventListener('change',syncTastingFields);$('#request-food-tasting')?.addEventListener('click',()=>{$('#event-type').value='Food Tasting';syncTastingFields();});syncTastingFields();
let banquetMenuRequest='';
document.querySelectorAll('[data-event-occasion],[data-banquet-menu]').forEach(link=>link.addEventListener('click',()=>{
 if(form.hidden)$('#new-inquiry').click();
 if(!$('#details-step').hidden)step(1);
 if(link.dataset.eventOccasion){
  $('#event-type').value=link.dataset.eventOccasion;
  $('#event-type').dispatchEvent(new Event('change',{bubbles:true}));
 }
 if(link.dataset.banquetMenu){
  const message=$('#message');
  const existing=banquetMenuRequest?message.value.replace(banquetMenuRequest,'').trim():message.value.trim();
  banquetMenuRequest=`Banquet menu preference: ${link.dataset.banquetMenu}. Please share the menu and details.`;
  message.value=existing.includes(banquetMenuRequest)?existing:[existing,banquetMenuRequest].filter(Boolean).join('\n\n');
  toast(`${link.dataset.banquetMenu} noted for your inquiry.`);
 }
 requestId=crypto.randomUUID();
 $('#form-status').textContent='';
}));
function step(number){$('#event-step').hidden=number!==1;$('#details-step').hidden=number!==2;$('#details-step').disabled=number!==2;$('#step-label-1').classList.toggle('current',number===1);$('#step-label-2').classList.toggle('current',number===2);const legend=$(number===1?'#event-step legend':'#details-step legend');legend.tabIndex=-1;legend.focus({preventScroll:true});}
$('#next-step').addEventListener('click',()=>{const controls=[...$('#event-step').querySelectorAll('input,select')];const invalid=controls.find(control=>!control.reportValidity());if(!invalid)step(2);});$('#back-step').addEventListener('click',()=>step(1));form.addEventListener('input',()=>{requestId=crypto.randomUUID();$('#form-status').textContent='';});
form.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity())return;const button=$('#submit-inquiry'),tasting=$('#event-type').value==='Food Tasting';button.disabled=true;button.textContent=tasting?'Sending tasting request…':'Sending inquiry…';$('#form-status').textContent='';const payload={...Object.fromEntries(new FormData(form)),consent:form.elements.consent.checked,menu:[...selected],requestId};try{const response=await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});const result=await response.json();if(!response.ok)throw new Error(result.error||'We couldn’t save your inquiry. Please try again.');form.hidden=true;$('#inquiry-reference').textContent=result.reference;$('#inquiry-success-title').textContent=tasting?'Your tasting request is received.':'Your inquiry is received.';$('#inquiry-followup').textContent=tasting?'We’ll check availability and contact you to confirm your preferred tasting date and time. This request does not reserve an appointment.':'Your date and menu will be confirmed directly with our team.';$('#inquiry-success').hidden=false;$('#inquiry-success').focus();}catch(error){$('#form-status').textContent=error.name==='TimeoutError'?'The connection timed out. Your details are still here; please try again.':error.message==='Failed to fetch'?'We couldn’t connect. Please try again, or text +1 (732) 881-8544 or text/call +1 (908) 549-6293.':error.message;$('#form-status').focus();}finally{button.disabled=false;syncTastingFields();}});
$('#new-inquiry').addEventListener('click',()=>{form.reset();requestId=crypto.randomUUID();syncTastingFields();form.hidden=false;$('#inquiry-success').hidden=true;$('#form-status').textContent='';step(1);updatePlan();});
document.querySelectorAll('.service-card').forEach((card,i)=>{const a=document.createElement('a');a.href='#contact';a.className='service-link';a.textContent='Plan this event ↗';a.addEventListener('click',()=>{$('#event-type').value=['Wedding','Corporate Event','Private Party / Gala'][i];});card.append(a);});

$('#gallery-dialog').addEventListener('close',modalState);
// Load third-party previews only when the Instagram section approaches the viewport.
const instagramObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.src=entry.target.dataset.instagramSrc;instagramObserver.unobserve(entry.target);}},{rootMargin:'150px'});
document.querySelectorAll('[data-instagram-src]').forEach(frame=>instagramObserver.observe(frame));
initExperience();
