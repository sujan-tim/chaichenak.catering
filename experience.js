const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=false;try{paused=localStorage.getItem('chai-chenak-motion')==='paused';}catch{}
export function motionAllowed(){return !paused&&!reduced.matches&&!navigator.connection?.saveData;}
export function initExperience(){
 const hero=document.querySelector('#hero-film'),toggle=document.querySelector('#motion-toggle');
 let heroVisible=true,frame=0;
 function updateHero(){
  if(!hero)return;
  if(motionAllowed()&&heroVisible&&!document.hidden&&!document.querySelector('dialog[open]')){
   if(!hero.src){hero.src=hero.dataset.src;hero.load();}
   hero.play().then(()=>hero.classList.add('is-playing')).catch(()=>hero.classList.remove('is-playing'));
  }else hero.pause();
 }
 function updateMotion(){
  const active=motionAllowed();document.documentElement.classList.toggle('motion-ready',active);document.documentElement.classList.toggle('motion-paused',!active);
  if(toggle){toggle.setAttribute('aria-pressed',String(!active));toggle.querySelector('.motion-label').textContent=active?'Pause motion':reduced.matches?'Reduced motion':'Enable motion';toggle.querySelector('.motion-icon').textContent=active?'Ⅱ':'▷';
  toggle.disabled=reduced.matches;toggle.title=reduced.matches?'Your device is set to reduced motion. Change that setting to enable automatic movement.':'';
  }updateHero();document.dispatchEvent(new Event('chai-motion-change'));
 }
 toggle?.addEventListener('click',()=>{paused=!paused;try{localStorage.setItem('chai-chenak-motion',paused?'paused':'enabled');}catch{}updateMotion();});reduced.addEventListener('change',updateMotion);navigator.connection?.addEventListener('change',updateMotion);
 if(hero)new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;updateHero();},{threshold:.05}).observe(document.querySelector('.hero'));
 document.addEventListener('visibilitychange',updateHero);document.addEventListener('chai-dialog-change',updateHero);
 // Content is visible without JavaScript and with motion disabled.
 document.querySelectorAll('.section-heading,.difference-head,.diff-card,.services-head,.service-card,.gallery-head,.contact-head,.faq-layout').forEach(element=>element.dataset.reveal='');
 const reveals=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-revealed');reveals.unobserve(entry.target);}},{threshold:.08,rootMargin:'0px 0px -25px 0px'});
 document.querySelectorAll('[data-reveal]').forEach((element,i)=>{element.style.setProperty('--reveal-delay',`${element.matches('.diff-card,.service-card,.experience-film')?(i%3)*80:0}ms`);reveals.observe(element);});
 const header=document.querySelector('.site-header');
 function scrollState(){frame=0;header.classList.toggle('is-scrolled',scrollY>24);}
 addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(scrollState);},{passive:true});scrollState();updateMotion();
 const disclosure=document.querySelector('.nav-disclosure'),panel=document.querySelector('#station-navigation');
 const close=()=>{panel.hidden=true;disclosure.setAttribute('aria-expanded','false');};
 disclosure.addEventListener('click',()=>{const open=panel.hidden;panel.hidden=!open;disclosure.setAttribute('aria-expanded',String(open));});
 panel.addEventListener('click',event=>{if(event.target.closest('a'))close();});
 document.addEventListener('click',event=>{if(!event.target.closest('.nav-stations'))close();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){close();disclosure.focus();}});
 document.querySelector('.nav-stations').addEventListener('focusout',event=>{if(!event.currentTarget.contains(event.relatedTarget))close();});
 const sections=[...document.querySelectorAll('section[id]')];
 const tracker=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){document.querySelectorAll('.nav-links>a').forEach(link=>{if(link.getAttribute('aria-current')==='page')return;if(link.hash==='#'+entry.target.id)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');});}},{rootMargin:'-20% 0px -55% 0px'});sections.forEach(section=>tracker.observe(section));
}
