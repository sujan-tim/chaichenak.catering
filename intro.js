// The intro is decorative. Never delay input, page loading, or navigation.
const intro=document.querySelector('.brand-intro');
if(intro){
 const dismiss=()=>{intro.hidden=true;removeEventListener('pointerdown',dismiss);removeEventListener('keydown',dismiss);};
 let paused=false;try{paused=localStorage.getItem('chai-chenak-motion')==='paused';}catch{}
 if(paused||matchMedia('(prefers-reduced-motion: reduce)').matches)dismiss();
 else{
  addEventListener('pointerdown',dismiss,{once:true,passive:true});
  addEventListener('keydown',dismiss,{once:true});
  intro.addEventListener('animationend',event=>{if(event.target===intro)dismiss();});
  setTimeout(dismiss,2600);
 }
 addEventListener('pageshow',event=>{if(event.persisted)dismiss();});
}
