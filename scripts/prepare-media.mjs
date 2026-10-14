import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir,stat,readFile,writeFile,access,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {stationMedia} from '../media-manifest.js';
const exec=promisify(execFile),cache='.media-cache';
const exists=async path=>{try{await access(path);return true;}catch{return false;}};
async function fingerprint(path){const s=await stat(path);return `${s.size}-${s.mtimeMs}`;}
async function ffmpeg(args){try{await exec('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{maxBuffer:1024*1024});}catch(error){throw new Error(`Media preparation failed: ${error.code==='ENOENT'?'Install FFmpeg, then run npm run build.':error.stderr||error.message}`);}}
export async function prepareMedia(){
 await mkdir(cache,{recursive:true});let saved={};try{saved=JSON.parse(await readFile(cache+'/manifest.json','utf8'));}catch{}
 const next={};
 // Convert two independent clips at a time; never change the supplied originals.
 const queue=[...stationMedia];
 async function convert(){while(queue.length){const item=queue.shift(),source='medias/'+item.file;
 let sourceFingerprint;
 try{sourceFingerprint=await fingerprint(source);}catch(error){
  // Keep already prepared, explicitly listed films when their originals were moved.
  // Removing an entry from the manifest still removes it from the published assets.
  if(error.code!=='ENOENT'||!saved[item.id]?.startsWith('v3-')||!await exists(`${cache}/${item.id}.mp4`)||!await exists(`${cache}/${item.id}.webp`))throw error;
  next[item.id]=saved[item.id];console.log(`Reusing prepared film without its source: ${item.id}`);continue;
 }
 const key='v3-'+sourceFingerprint+(item.audio?'-audio-v1':'');next[item.id]=key;
 if(saved[item.id]===key&&await exists(`${cache}/${item.id}.mp4`)&&await exists(`${cache}/${item.id}.webp`))continue;
 const {stdout}=await exec('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=color_transfer','-of','json',source]);
 const hdr=['arib-std-b67','smpte2084'].includes(JSON.parse(stdout).streams[0]?.color_transfer);
 const color=hdr?'zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,':'';
 const filters=color+'scale=540:-2:flags=lanczos,setsar=1,fps=24,format=yuv420p';
 await ffmpeg(['-i',source,'-map','0:v:0',...(item.audio?['-map','0:a:0?','-c:a','aac','-b:a','96k']:['-an']),'-sn','-dn','-t',String(item.duration||15),'-vf',filters,'-c:v','libx264','-preset','fast','-crf','26','-movflags','+faststart','-map_metadata','-1','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709',`${cache}/${item.id}.tmp.mp4`]);
 await rename(`${cache}/${item.id}.tmp.mp4`,`${cache}/${item.id}.mp4`);
 await ffmpeg(['-ss','0.1','-i',`${cache}/${item.id}.mp4`,'-frames:v','1','-vf','format=rgb24','-update','1',`${cache}/${item.id}.png`]);
 await sharp(`${cache}/${item.id}.png`).webp({quality:83}).toFile(`${cache}/${item.id}.webp`);
 console.log(`Prepared station film: ${item.id}`);
 }}
 await Promise.all([convert(),convert()]);
 const dessertKey=await fingerprint('medias/Desert .PNG');next.dessertPhoto=dessertKey;
 if(saved.dessertPhoto!==dessertKey||!await exists(cache+'/dessert-photo.webp'))await sharp('medias/Desert .PNG').rotate().resize({width:900,withoutEnlargement:true}).webp({quality:82}).toFile(cache+'/dessert-photo.webp');
 const heroKey=createHash('sha256').update(['grazing','crepe','bakery'].map(id=>next[id]).join('|')+'hero-v2').digest('hex');next.hero=heroKey;
 if(saved.hero!==heroKey||!await exists(cache+'/hero.mp4')){
  await ffmpeg(['-stream_loop','-1','-i',cache+'/grazing.mp4','-stream_loop','-1','-i',cache+'/crepe.mp4','-stream_loop','-1','-i',cache+'/bakery.mp4','-filter_complex','[0:v]scale=512:-2,crop=512:864,setsar=1[a];[1:v]scale=512:-2,crop=512:864,setsar=1[b];[2:v]scale=512:-2,crop=512:864,setsar=1[c];[a][b][c]hstack=inputs=3,format=yuv420p[v]','-map','[v]','-an','-t','10','-r','24','-c:v','libx264','-crf','28','-preset','fast','-movflags','+faststart',cache+'/hero.mp4']);
  await ffmpeg(['-ss','0.1','-i',cache+'/hero.mp4','-frames:v','1','-vf','format=rgb24','-update','1',cache+'/hero.png']);
  await sharp(cache+'/hero.png').webp({quality:83}).toFile(cache+'/hero.webp');
 }
 await writeFile(cache+'/manifest.json',JSON.stringify(next,null,2));
 return cache;
}
if(process.argv[1]?.endsWith('/prepare-media.mjs'))await prepareMedia();
