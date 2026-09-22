import { cp, mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import sharp from 'sharp';
// Generated output only; source assets and source history stay intact.
await rm('dist',{recursive:true,force:true});
await mkdir('dist/server',{recursive:true});await mkdir('dist/client/assets',{recursive:true});await mkdir('dist/.openai',{recursive:true});
const hosting=JSON.parse(await readFile('.openai/hosting.json','utf8'));
await writeFile('dist/.openai/hosting.json',JSON.stringify(hosting,null,2));
await cp('drizzle','dist/.openai/drizzle',{recursive:true});
const imageMap=new Map();
for(const file of await readdir('assets')){
  const source='assets/'+file,name=file.replace(/\.[^.]+$/,'.webp');
  const input=sharp(source);const meta=await input.metadata();
  const width=Math.min(meta.width,file.endsWith(".png")?600:1400);
  await input.resize({width,withoutEnlargement:true}).webp({quality:76}).toFile('dist/client/assets/'+name);
  imageMap.set(source,{path:'assets/'+name,width,height:Math.round(meta.height*width/meta.width)});
}
function replaceImages(text){for(const [source,image]of imageMap)text=text.replaceAll(source,image.path);return text;}
let html=await readFile('index.html','utf8');
html=html.replace(/<img\b[^>]*>/g,tag=>{const src=tag.match(/src="([^"]+)"/)?.[1],image=imageMap.get(src);if(!image)return tag;return tag.replace(/>$/,` width="${image.width}" height="${image.height}" decoding="async" ${src==='assets/a865e7e09d22.jpg'?'fetchpriority="high"':'loading="lazy"'}>`);});
await writeFile('dist/client/index.html',replaceImages(html));
for(const file of ['styles.css','enhancements.css','app.js','catalog.js','favicon.svg','robots.txt','admin.html','admin.css','admin.js'])await writeFile('dist/client/'+file,replaceImages(await readFile(file,'utf8')));
await writeFile('dist/server/index.js',(await readFile('worker/index.js','utf8')).replace("'../catalog.js'","'./catalog.js'"));
await cp('catalog.js','dist/server/catalog.js');
await writeFile('dist/client/404.html','<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Page not found | Chai Chenak</title><body style="font-family:system-ui;padding:10%;background:#F7F2E6;color:#241B14"><h1>This page isn’t on the menu.</h1><p><a href="/">Return to Chai Chenak Catering &amp; Events</a></p></body></html>');
console.log(`Built catering site with ${imageMap.size} optimized images and inquiry API.`);
