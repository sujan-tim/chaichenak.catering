import { menu } from '../catalog.js';
import { chat } from './assistant.js';
const validMenu = new Set(menu.map(item => item.id));
const occasions = new Set(['Wedding','Corporate Event','Conference / Meeting','Private Party / Gala','Food Tasting','Other']);
const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json = (data, status=200, extra={}) => Response.json(data,{status,headers:{...headers,...extra}});
const trimmed = (value) => typeof value === 'string' ? value.trim() : '';
export function validateInquiry(raw, now = new Date()) {
  if(!raw || typeof raw!=='object' || Array.isArray(raw)) throw new Error('Please check your event details.');
  const d = {};
  for(const [key,max] of Object.entries({firstName:80,lastName:80,email:254,phone:30,venue:200,message:3000,date:10,time:5,occasion:40,requestId:36})) {
    d[key]=trimmed(raw[key]);
    if(d[key].length>max) throw new Error('One of your fields is too long. Please shorten it and try again.');
  }
  const isTasting=d.occasion==='Food Tasting';
  if(!d.firstName||!d.lastName||(!d.venue&&!isTasting)) throw new Error('Please include your name and event venue or city.');
  if(isTasting&&!d.time) throw new Error('Please choose a preferred tasting time.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) throw new Error('Please enter a valid email address.');
  if(!/^[+\d\s().-]+$/.test(d.phone)||d.phone.replace(/\D/g,'').length<7) throw new Error('Please enter a valid phone number.');
  const today=now.toLocaleDateString('en-CA',{timeZone:'America/New_York'});
  const eventDate=new Date(d.date+'T12:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||Number.isNaN(eventDate.valueOf())||eventDate.toISOString().slice(0,10)!==d.date||d.date<today) throw new Error('Please choose today or a future event date.');
  if(d.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.time)) throw new Error('Please enter a valid event time.');
  if(isTasting&&!d.venue)d.venue='Tasting location to be confirmed';
  d.guests=Number(raw.guests);d.budget=raw.budget===''||raw.budget==null?null:Number(raw.budget);
  if(!Number.isInteger(d.guests)||d.guests<1||d.guests>10000) throw new Error('Guest count must be a whole number between 1 and 10,000.');
  if(d.budget!==null&&(!Number.isInteger(d.budget)||d.budget<1||d.budget>10000000)) throw new Error('Please enter a valid total budget in whole dollars.');
  if(!occasions.has(d.occasion)) throw new Error('Please select an occasion.');
  if(!Array.isArray(raw.menu)||raw.menu.length>validMenu.size||raw.menu.some(id=>!validMenu.has(id))) throw new Error('Please check your menu selections.');
  d.menu=[...new Set(raw.menu)].sort();d.email=d.email.toLowerCase();
  if(raw.consent!==true) throw new Error('Please agree to be contacted about your event.');
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(d.requestId)) throw new Error('Please reload the page and try again.');
  return d;
}
const hash = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');
async function limitedJSON(request){
  if(Number(request.headers.get('content-length'))>16000) throw new Error('size');
  const reader=request.body?.getReader();if(!reader)throw new Error('json');
  let total=0;const chunks=[];
  while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>16000){await reader.cancel();throw new Error('size');}chunks.push(value);}
  const buffer=new Uint8Array(total);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length;}
  return JSON.parse(new TextDecoder().decode(buffer));
}
function inquiryEmail(data, reference) {
  const menuNames=data.menu.map(id=>menu.find(item=>item.id===id)?.selectionName||id);
  return [
    `New catering inquiry — ${reference}`,
    '',
    `Name: ${data.firstName} ${data.lastName}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    `Occasion: ${data.occasion}`,
    `Event date: ${data.date}${data.time?` at ${data.time}`:''}`,
    `Venue or city: ${data.venue}`,
    `Guests: ${data.guests}`,
    `Budget: ${data.budget===null?'Not provided':'$'+data.budget.toLocaleString('en-US')}`,
    `Menu shortlist: ${menuNames.length?menuNames.join(', '):'No selections yet'}`,
    '',
    'Additional details:',
    data.message||'None provided',
  ].join('\n');
}
async function submit(request, env, ctx) {
  if(request.method!=='POST')return json({error:'Method not allowed.'},405,{'Allow':'POST'});
  const url=new URL(request.url),origin=request.headers.get('origin');
  if((origin&&origin!==url.origin)||request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Please send your inquiry from this website.'},403);
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return json({error:'Expected JSON.'},415);
  let raw;try{raw=await limitedJSON(request);}catch(error){return json({error:error.message==='size'?'Your inquiry is too large. Please shorten your message.':'Please check your inquiry and try again.'},error.message==='size'?413:400);}
  if(trimmed(raw?.website))return json({error:'Unable to submit this inquiry. Please call our team.'},400);
  let data;try{data=validateInquiry(raw);}catch(error){return json({error:error.message},400);}
  if(!env.DB)return json({error:'Online inquiries are temporarily unavailable. Please text +1 (732) 881-8544 or text/call +1 (908) 549-6293.'},503);
  try {
    const payloadHash=await hash(JSON.stringify(data));
    const previous=await env.DB.prepare('SELECT reference, payload_hash FROM inquiries WHERE id = ?').bind(data.requestId).first();
    if(previous)return previous.payload_hash===payloadHash?json({reference:previous.reference}):json({error:'This request has changed. Please reload and try again.'},409);
    const now=Date.now(),window=Math.floor(now/3600000);
    const identities=[`email:${data.email}`,`ip:${request.headers.get('cf-connecting-ip')||'local'}`];
    for(const identity of identities){
      const key=await hash(`${window}:${identity}`);
      const limit=await env.DB.prepare('INSERT INTO rate_limits (key, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = count + 1 RETURNING count').bind(key,(window+1)*3600000).first();
      if(limit.count>5)return json({error:'Too many inquiries in a short time. Please try again later or text +1 (732) 881-8544 or text/call +1 (908) 549-6293.'},429,{'Retry-After':String(Math.ceil(((window+1)*3600000-now)/1000))});
    }
    const reference='CC-'+crypto.randomUUID().slice(0,8).toUpperCase(),createdAt=new Date().toISOString();
    await env.DB.prepare('INSERT INTO inquiries (id, payload_hash, reference, first_name, last_name, email, phone, occasion, event_date, event_time, venue, guests, budget, menu, message, consent_at, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING').bind(data.requestId,payloadHash,reference,data.firstName,data.lastName,data.email,data.phone,data.occasion,data.date,data.time||null,data.venue,data.guests,data.budget,JSON.stringify(data.menu),data.message,createdAt,'new',createdAt).run();
    const saved=await env.DB.prepare('SELECT reference, payload_hash FROM inquiries WHERE id = ?').bind(data.requestId).first();
    if(saved.payload_hash!==payloadHash)return json({error:'This request has changed. Please reload and try again.'},409);
    ctx.waitUntil(env.DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now).run().catch(()=>console.error('Rate limit cleanup failed')));
    if(env.INQUIRY_EMAIL)ctx.waitUntil(Promise.resolve().then(()=>env.INQUIRY_EMAIL.send({
      to:'chaichenakcatering@gmail.com',
      from:'inquiries@chaichenakcatering.com',
      replyTo:data.email,
      subject:`New catering inquiry — ${saved.reference}`,
      text:inquiryEmail(data,saved.reference),
    })).catch(()=>console.error('Inquiry email notification failed')));
    return json({reference:saved.reference},201);
  } catch { console.error('Inquiry storage unavailable');return json({error:'We couldn’t save your inquiry. Please try again or text +1 (732) 881-8544 or text/call +1 (908) 549-6293.'},503); }
}
const statuses = new Set(['new','contacted','quoted','booked','closed']);
async function isOwner(request, env) {
  if(typeof env.ADMIN_PASSWORD!=='string'||env.ADMIN_PASSWORD.length<32)return false;
  const url=new URL(request.url);
  if(url.protocol!=='https:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname))return false;
  const authorization=request.headers.get('authorization')||'';
  if(!authorization.startsWith('Basic ')||authorization.length>2048)return false;
  let credentials;try{credentials=atob(authorization.slice(6));}catch{return false;}
  // Compare fixed-length digests without an early exit on mismatched characters.
  const supplied=await hash(credentials),expected=await hash('admin:'+env.ADMIN_PASSWORD);
  let difference=0;for(let i=0;i<supplied.length;i++)difference|=supplied.charCodeAt(i)^expected.charCodeAt(i);
  return difference===0;
}
async function admin(request,env){
  if(!await isOwner(request,env))return json({error:'Owner sign-in is required.'},401);
  const url=new URL(request.url);
  try{
    if(request.method==='GET'&&url.pathname==='/api/admin/inquiries'){
      const status=url.searchParams.get('status')||'',offset=Number(url.searchParams.get('offset')||0);
      if((status&&!statuses.has(status))||!Number.isInteger(offset)||offset<0||offset>100000)return json({error:'Invalid filter.'},400);
      const fields='id, reference, first_name, last_name, email, phone, occasion, event_date, event_time, venue, guests, budget, menu, message, status, created_at';
      const result=status?await env.DB.prepare('SELECT '+fields+' FROM inquiries WHERE status = ? ORDER BY created_at DESC, id DESC LIMIT 26 OFFSET ?').bind(status,offset).all():await env.DB.prepare('SELECT '+fields+' FROM inquiries ORDER BY created_at DESC, id DESC LIMIT 26 OFFSET ?').bind(offset).all();
      return json({items:result.results.slice(0,25),hasMore:result.results.length>25});
    }
    if(request.method==='PATCH'&&url.pathname.startsWith('/api/admin/inquiries/')){
      if(request.headers.get('origin')!==url.origin)return json({error:'Invalid origin.'},403);
      if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'Expected JSON.'},415);
      let body;try{body=await limitedJSON(request);}catch{return json({error:'Invalid request.'},400);}
      if(!statuses.has(body?.status))return json({error:'Invalid status.'},400);
      const id=url.pathname.split('/').pop();
      const result=await env.DB.prepare('UPDATE inquiries SET status = ? WHERE id = ? RETURNING id').bind(body.status,id).first();
      return result?json({saved:true}):json({error:'Inquiry not found.'},404);
    }
    return json({error:'Method not allowed.'},405);
  }catch{console.error('Inquiry inbox storage unavailable');return json({error:'The inbox is temporarily unavailable. Please try again.'},503);}
}
export default {
  async fetch(request,env,ctx){
    const path=new URL(request.url).pathname;
    if(path==='/admin'||path==='/admin.html'){
      if(!env.ADMIN_PASSWORD||env.ADMIN_PASSWORD.length<32)return new Response('Owner access has not been configured.',{status:503,headers:{'Cache-Control':'no-store'}});
      if(!await isOwner(request,env))return new Response('Owner sign-in is required.',{status:401,headers:{'WWW-Authenticate':'Basic realm="Chai Chenak owner inbox", charset="UTF-8"','Cache-Control':'no-store'}});
      const response=await env.ASSETS.fetch(new Request(new URL('/admin',request.url),request));
      const protectedResponse=new Response(response.body,response);protectedResponse.headers.set('Cache-Control','private, no-store');protectedResponse.headers.set('X-Robots-Tag','noindex, nofollow');return protectedResponse;
    }
    if(path.startsWith('/api/admin/'))return admin(request,env);
    if(path==='/api/inquiries')return submit(request,env,ctx);
    if(path==='/api/chat')return chat(request,env,ctx,limitedJSON);
    if(path.startsWith('/api/'))return json({error:'Not found.'},404);
    if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
    const response=await env.ASSETS.fetch(request);
    const secured=new Response(response.body,response);
    secured.headers.set('X-Content-Type-Options','nosniff');
    secured.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
    secured.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    secured.headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' https://www.instagram.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://*.cdninstagram.com https://*.fbcdn.net; frame-src https://www.instagram.com; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'");
    return secured;
  }
};
