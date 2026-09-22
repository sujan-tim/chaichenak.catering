import { cp, mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import sharp from 'sharp';
import {galleryPhotos} from '../gallery.js';
import { prepareMedia } from './prepare-media.mjs';
const mediaCache=await prepareMedia();
// Generated output only; source assets and source history stay intact.
await rm('dist',{recursive:true,force:true});
await mkdir('dist/server',{recursive:true});await mkdir('dist/client/assets',{recursive:true});
await mkdir('dist/client/media',{recursive:true});
for(const file of await readdir(mediaCache))if(/\.(mp4|webp)$/.test(file))await cp(mediaCache+'/'+file,'dist/client/media/'+file);
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
const galleryFilters='<div class="gallery-filters filter-group" role="group" aria-label="Filter gallery">'+Object.entries({all:'All moments',events:'Celebrations',stations:'Stations',buffets:'Buffets & tables',desserts:'Desserts'}).map(([id,label])=>`<button type="button" class="filter ${id==='all'?'active':''}" data-gallery-filter="${id}" aria-pressed="${id==='all'}">${label}</button>`).join('')+'</div>';
const galleryItems=galleryPhotos.map((photo,i)=>`<button type="button" class="g-item ${i%7===0?'g-tall':i%7===3?'g-wide':''}" data-gallery-category="${photo.category}" aria-haspopup="dialog" ${i>=8?'hidden':''}><img src="${photo.image}" alt="${photo.alt}"></button>`).join('');
html=html.replace('<!-- GALLERY_ITEMS -->',galleryFilters+'<div class="gallery-grid">'+galleryItems+'</div><p id="gallery-count" role="status">8 of '+galleryPhotos.length+' photographs</p><button type="button" class="btn btn-outline" id="gallery-more">View more photographs ↓</button>');
html=html.replace(/<img\b[^>]*>/g,tag=>{const src=tag.match(/src="([^"]+)"/)?.[1],image=imageMap.get(src);if(!image)return tag;return tag.replace(/>$/,` width="${image.width}" height="${image.height}" decoding="async" ${src==='assets/a865e7e09d22.jpg'?'fetchpriority="high"':'loading="lazy"'}>`);});
await writeFile('dist/client/index.html',replaceImages(html));
// Share the header, inquiry form, footer, and dialogs so both pages stay consistent.
const menuSection=await readFile('menu-section.html','utf8');
const contact=html.match(/<section class="contact"[\s\S]*?<\/section>/)[0];
const faq=html.match(/<section class="faq-section"[\s\S]*?<\/section>/)[0];
let menuPage=html.replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main">${menuSection}${contact}${faq}</main>`)
 .replace('<body id="top">','<body id="top" data-page="menu">')
 .replace(/<title>.*?<\/title>/,'<title>The Menu | Chai Chenak Catering and Events</title>')
 .replace('content="Pakistani catering for weddings, corporate events, and private celebrations across New York and New Jersey. Explore live stations and plan your event with Chai Chenak."','content="Explore live stations, Pakistani buffets, desserts, and drinks. Watch our event films and build your Chai Chenak catering menu."')
 .replace(/href="#(story|services|gallery)"/g,'href="/#$1"')
 .replace('href="/menu" class="nav-plan"','href="/menu" class="nav-plan" aria-current="page"');
await writeFile('dist/client/menu.html',replaceImages(menuPage));
for(const file of ['styles.css','enhancements.css','app.js','catalog.js','favicon.svg','robots.txt','admin.html','admin.css','admin.js','refinement.css','experience.js'])await writeFile('dist/client/'+file,replaceImages(await readFile(file,'utf8')));
await writeFile('dist/server/index.js',(await readFile('worker/index.js','utf8')).replace("'../catalog.js'","'./catalog.js'"));
await cp('catalog.js','dist/server/catalog.js');
await writeFile('dist/client/404.html','<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Page not found | Chai Chenak</title><body style="font-family:system-ui;padding:10%;background:#F7F2E6;color:#241B14"><h1>This page isn’t on the menu.</h1><p><a href="/">Return to Chai Chenak Catering &amp; Events</a></p></body></html>');
console.log(`Built catering site with ${imageMap.size} optimized images and inquiry API.`);
