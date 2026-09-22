// Browser tests get a fresh local database, separate from the development inbox.
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const storage=await mkdtemp(join(tmpdir(),'chai-chenak-e2e-'));
const wrangler=resolve('node_modules/wrangler/bin/wrangler.js');
let child,stopping=false;
const run=args=>new Promise((done,fail)=>{
 child=spawn(process.execPath,[wrangler,...args],{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
 child.once('error',fail);child.once('exit',code=>code===0||stopping?done():fail(new Error(`Local test server exited with ${code}`)));
});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{stopping=true;child?.kill('SIGTERM');});
try{
 await run(['d1','migrations','apply','DB','--local','--persist-to',storage]);
 if(!stopping)await run(['dev','--ip','127.0.0.1','--port','8788','--persist-to',storage]);
}finally{await rm(storage,{recursive:true,force:true});}
