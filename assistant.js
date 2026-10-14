const launcher=document.querySelector('#chat-launcher');
const panel=document.querySelector('#customer-chat');
const form=document.querySelector('#chat-form');
const input=document.querySelector('#chat-input');
const send=document.querySelector('#chat-send');
const reset=document.querySelector('#chat-reset');
const transcript=document.querySelector('#chat-messages');
const scrollArea=document.querySelector('#chat-body');
const status=document.querySelector('#chat-status');
const modeLabel=document.querySelector('#chat-mode');
const privacy=document.querySelector('#chat-privacy');
const suggestions=[...document.querySelectorAll('[data-chat-question]')];
let history=[],busy=false,mode='guide',configLoaded=false,contactFocus=false;
launcher.hidden=false;

function setMode(value){
  mode=value==='ai'?'ai':'guide';
  modeLabel.textContent=mode==='ai'?'AI catering assistant':'Menu & FAQ guide';
  privacy.textContent=mode==='ai'?'AI can make mistakes. Messages are sent to OpenAI to answer your question. Chat stays only in this tab. Share contact details through the inquiry form.':'Answers from our menu and FAQs. Chat stays only in this tab. Share contact details through the inquiry form.';
}
function setBusy(value){
  busy=value;send.disabled=value;reset.disabled=value;input.readOnly=value;
  suggestions.forEach(button=>button.disabled=value);
  form.setAttribute('aria-busy',String(value));
}
function message(role,content){
  const item=document.createElement('div');item.className='chat-message'+(role==='user'?' chat-message-user':'');
  const label=document.createElement('span');label.className='chat-message-label';label.textContent=role==='user'?'You':mode==='ai'?'Chai Chenak · AI':'Chai Chenak · Guide';
  const text=document.createElement('span');text.textContent=content;item.append(label,text);transcript.append(item);
  scrollArea.scrollTop=scrollArea.scrollHeight;return item;
}
function addLinks(links){
  if(!Array.isArray(links))return;
  const allowed=new Set(['/menu','/packages','/banquet','/banquet#conference-hall','#contact']);
  const group=document.createElement('div');group.className='chat-links';
  for(const link of links){
    if(!allowed.has(link.href)||typeof link.label!=='string')continue;
    const a=document.createElement('a');a.href=link.href;a.textContent=link.label;
    if(link.href==='#contact')a.addEventListener('click',()=>{contactFocus=true;panel.close();});
    group.append(a);
  }
  transcript.append(group);scrollArea.scrollTop=scrollArea.scrollHeight;
}
async function openChat(){
  panel.showModal();modalState();launcher.setAttribute('aria-expanded','true');input.focus();
  if(configLoaded)return;
  configLoaded=true;
  try{
    const response=await fetch('/api/chat',{signal:AbortSignal.timeout(5000)});
    if(response.ok)setMode((await response.json()).mode);
  }catch{configLoaded=false;}
}
launcher.addEventListener('click',openChat);
function modalState(){
  document.body.classList.toggle('dialog-open',Boolean(document.querySelector('dialog[open]')));
  document.dispatchEvent(new Event('chai-dialog-change'));
}
document.querySelector('#chat-close').addEventListener('click',()=>panel.close());
panel.addEventListener('close',()=>{
  modalState();
  launcher.setAttribute('aria-expanded','false');
  if(contactFocus){contactFocus=false;document.querySelector('#event-type')?.focus({preventScroll:true});}
  else launcher.focus({preventScroll:true});
});
document.querySelector('#chat-contact').addEventListener('click',()=>{contactFocus=true;panel.close();});
reset.addEventListener('click',()=>{history=[];transcript.replaceChildren();status.textContent='';input.value='';input.focus();});
async function ask(question){
  if(busy||!question.trim())return;
  const content=question.trim();
  if(content.length>1000){status.textContent='Please keep your question under 1,000 characters.';return;}
  const messages=[...history.slice(-4),{role:'user',content}];
  const pending=message('user',content);input.value='';setBusy(true);status.textContent='Finding an answer…';
  try{
    const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages}),signal:AbortSignal.timeout(25000)});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||'Chat is temporarily unavailable. Please try again or contact our team.');
    if(typeof data.answer!=='string'||!data.answer.trim())throw new Error('We couldn’t find an answer. Please try again or contact our team.');
    setMode(data.mode);message('assistant',data.answer);addLinks(data.links);
    history=[...messages,{role:'assistant',content:data.answer}];status.textContent=data.notice||'';
  }catch(error){
    pending.remove();input.value=content;
    status.textContent=error.name==='TimeoutError'||error.name==='AbortError'?'The answer took too long. Please try again or contact our team.':error instanceof TypeError?'Chat couldn’t connect. Please try again or contact our team.':error.message;
  }finally{setBusy(false);scrollArea.scrollTop=scrollArea.scrollHeight;if(panel.open)input.focus();}
}
form.addEventListener('submit',event=>{event.preventDefault();ask(input.value);});
input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();ask(input.value);}});
suggestions.forEach(button=>button.addEventListener('click',()=>ask(button.dataset.chatQuestion)));
