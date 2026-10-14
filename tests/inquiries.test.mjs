import test from 'node:test';
import assert from 'node:assert/strict';
import { menu } from '../catalog.js';
import worker, { validateInquiry } from '../worker/index.js';
const now = new Date('2026-09-22T16:00:00Z');
const sample = () => ({firstName:'Amina',lastName:'Khan',email:'amina@example.com',phone:'732-555-0123',venue:'New Brunswick, NJ',occasion:'Wedding',date:'2026-10-15',time:'17:00',guests:'100',budget:'5000',menu:['chaat','desserts'],message:'A family gathering',consent:true,requestId:crypto.randomUUID()});
test('normalizes and validates a complete inquiry',()=>{const result=validateInquiry({...sample(),firstName:' Amina ',email:'AMINA@example.com',menu:['chaat','chaat']},now);assert.equal(result.firstName,'Amina');assert.equal(result.email,'amina@example.com');assert.equal(result.guests,100);assert.deepEqual(result.menu,['chaat']);});
test('rejects invalid, impossible, and past event dates',()=>{for(const date of ['2026-02-30','2026-09-21','not-a-date','2026-13-01'])assert.throws(()=>validateInquiry({...sample(),date},now));});
test('rejects invalid contact, consent, budget, guests and menu',()=>{for(const change of [{email:'oops'},{phone:'abc1234567'},{consent:false},{guests:0},{guests:1.5},{guests:10001},{budget:-1},{budget:'NaN'},{budget:4.5},{menu:['fake']},{occasion:'made-up'},{requestId:'1'},{firstName:''},{message:'x'.repeat(3001)}])assert.throws(()=>validateInquiry({...sample(),...change},now));});
test('optional budget and time are accepted',()=>{assert.equal(validateInquiry({...sample(),budget:'',time:''},now).budget,null);});
test('conference inquiries retain their selected occasion',()=>{assert.equal(validateInquiry({...sample(),occasion:'Conference / Meeting'},now).occasion,'Conference / Meeting');});
const req = (body,options={}) => new Request('https://catering.example/api/inquiries',{method:'POST',headers:{'content-type':'application/json',...options.headers},body:JSON.stringify(body)});
test('blocks cross-origin requests before database access',async()=>{const result=await worker.fetch(req(sample(),{headers:{origin:'https://other.example'}}),{},{});assert.equal(result.status,403);});
test('rejects large payloads',async()=>{const result=await worker.fetch(req({...sample(),message:'x'.repeat(17000)}),{},{});assert.equal(result.status,413);});
test('fails honestly if storage is missing',async()=>{const result=await worker.fetch(req({...sample(),date:'2099-01-01'}),{},{});assert.equal(result.status,503);assert.ok((await result.json()).error);});
test('does not expose inquiry records through GET',async()=>{const result=await worker.fetch(new Request('https://catering.example/api/inquiries'),{},{});assert.equal(result.status,405);});
test('honeypot submissions are not saved',async()=>{assert.equal((await worker.fetch(req({...sample(),website:'spam.example'}),{},{})).status,400);});
const ownerPassword='test-only-owner-password-32-characters-minimum';
const ownerEnv={ADMIN_PASSWORD:ownerPassword};
const ownerAuth={authorization:'Basic '+btoa('admin:'+ownerPassword)};
test('owner API rejects anonymous, incorrect credentials and spoofed platform headers',async()=>{
  for(const headers of [{},{authorization:'Basic '+btoa('admin:wrong')},{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@example.com'}]){
    const response=await worker.fetch(new Request('https://catering.example/api/admin/inquiries',{headers}),ownerEnv,{});
    assert.equal(response.status,401);
  }
});
test('owner page prompts for its own password',async()=>{
  const response=await worker.fetch(new Request('https://catering.example/admin'),ownerEnv,{});
  assert.equal(response.status,401);assert.match(response.headers.get('www-authenticate'),/^Basic /);
});
test('owner access stays disabled with missing or weak configuration',async()=>{
  for(const env of [{},{ADMIN_PASSWORD:'short'}])assert.equal((await worker.fetch(new Request('https://catering.example/admin'),env,{})).status,503);
});
test('owner credentials are accepted on protected APIs',async()=>{
  const env={...ownerEnv,DB:{prepare:()=>({bind:()=>({all:async()=>({results:[]})})})}};
  const response=await worker.fetch(new Request('https://catering.example/api/admin/inquiries',{headers:ownerAuth}),env,{});
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{items:[],hasMore:false});
});
test('owner credentials are rejected over non-local plain HTTP',async()=>{
  const response=await worker.fetch(new Request('http://catering.example/api/admin/inquiries',{headers:ownerAuth}),ownerEnv,{});
  assert.equal(response.status,401);
});
test('owner status updates reject cross-origin writes',async()=>{
  const response=await worker.fetch(new Request('https://catering.example/api/admin/inquiries/id',{method:'PATCH',headers:{...ownerAuth,origin:'https://other.example'},body:'{}'}),ownerEnv,{});
  assert.equal(response.status,403);
});

test('accepts the expanded station collection without the former six-item limit',()=>{const selection=menu.map(item=>item.id);assert.deepEqual(validateInquiry({...sample(),menu:selection},now).menu,[...selection].sort());});
