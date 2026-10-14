import { cp, mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import sharp from 'sharp';
import {galleryPhotos} from '../gallery.js';
import {menuSheets} from '../menu-sheets.js';
import {packageSheets} from '../package-sheets.js';
import {banquetMenus} from '../banquet-menus.js';
import { prepareMedia } from './prepare-media.mjs';
import { stationMedia } from '../media-manifest.js';
const mediaCache=await prepareMedia();
// Generated output only; source assets and source history stay intact.
await rm('dist',{recursive:true,force:true});
await mkdir('dist/server',{recursive:true});await mkdir('dist/client/assets',{recursive:true});
await mkdir('dist/client/media',{recursive:true});
for(const file of [...stationMedia.flatMap(item=>[`${item.id}.mp4`,`${item.id}.webp`]),'dessert-photo.webp','hero.mp4','hero.webp'])await cp(mediaCache+'/'+file,'dist/client/media/'+file);
const imageMap=new Map();
for(const file of await readdir('assets')){
  const source='assets/'+file,name=file.replace(/\.[^.]+$/,'.webp');
  const input=sharp(source);const meta=await input.metadata();
  const width=Math.min(meta.width,file.endsWith(".png")?600:1400);
  await input.resize({width,withoutEnlargement:true}).webp({quality:76}).toFile('dist/client/assets/'+name);
  imageMap.set(source,{path:'assets/'+name,width,height:Math.round(meta.height*width/meta.width)});
}
for(const [source,name] of [
  ['Restaurant /chai chenak.jpg','restaurant-chai-chenak.webp'],
  ['Restaurant /jinsoy.jpg','restaurant-jinsoy.webp'],
  ['Restaurant /chaichenakcafe.jpg','restaurant-chai-chenak-cafe.webp'],
]){
  const input=sharp(source),meta=await input.metadata(),width=Math.min(meta.width,600);
  await input.resize({width,withoutEnlargement:true}).webp({quality:82}).toFile('dist/client/assets/'+name);
  imageMap.set(source,{path:'assets/'+name,width,height:Math.round(meta.height*width/meta.width)});
}
function replaceImages(text){for(const [source,image]of imageMap)text=text.replaceAll(source,image.path);return text;}
let html=await readFile('index.html','utf8');
const galleryFilters='<div class="gallery-filters filter-group" role="group" aria-label="Filter gallery">'+Object.entries({all:'All moments',events:'Celebrations',stations:'Stations',buffets:'Buffets & tables',desserts:'Desserts'}).map(([id,label])=>`<button type="button" class="filter ${id==='all'?'active':''}" data-gallery-filter="${id}" aria-pressed="${id==='all'}">${label}</button>`).join('')+'</div>';
const galleryItems=galleryPhotos.map((photo,i)=>`<button type="button" class="g-item ${i%7===0?'g-tall':i%7===3?'g-wide':''}" data-gallery-category="${photo.category}" aria-haspopup="dialog" ${i>=8?'hidden':''}><img src="${photo.image}" alt="${photo.alt}"></button>`).join('');
html=html.replace('<!-- GALLERY_ITEMS -->',galleryFilters+'<div class="gallery-grid">'+galleryItems+'</div><p id="gallery-count" role="status">8 of '+galleryPhotos.length+' photographs</p><button type="button" class="btn btn-outline" id="gallery-more">View more photographs ↓</button>');
html=html.replace(/<img\b[^>]*>/g,tag=>{const src=tag.match(/src="([^"]+)"/)?.[1],image=imageMap.get(src);if(!image)return tag;if(tag.includes('fetchpriority="high"'))return tag;return tag.replace(/>$/,` width="${image.width}" height="${image.height}" decoding="async" ${src==='assets/a865e7e09d22.jpg'?'fetchpriority="high"':'loading="lazy"'}>`);});
await writeFile('dist/client/index.html',replaceImages(html));
// Share the header, inquiry form, footer, and dialogs across the public pages.
// Copy only the original menu pages, never the package sheets in that folder.
await mkdir('dist/client/menu-sheets',{recursive:true});
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sheetCards=[];
for(const sheet of menuSheets){
 const source='Packages&menu/'+sheet.source,publicPath='/menu-sheets/'+sheet.id+'.jpg';
 const {width,height}=await sharp(source).metadata();
 await cp(source,'dist/client'+publicPath);
 sheetCards.push(`<figure class="menu-sheet" id="sheet-${sheet.id}"><a href="${publicPath}" target="_blank" rel="noopener" aria-label="Open ${escapeHTML(sheet.title)} at full size in a new tab"><img src="${publicPath}" alt="${escapeHTML(sheet.title)} — full menu page" width="${width}" height="${height}" loading="lazy" decoding="async"></a><figcaption><h3>${escapeHTML(sheet.title)}</h3><a href="${publicPath}" target="_blank" rel="noopener">View full size <span aria-hidden="true">↗</span><span class="sr-only">: ${escapeHTML(sheet.title)} (new tab)</span></a></figcaption></figure>`);
}
const menuSection=(await readFile('menu-section.html','utf8')).replace('<!-- MENU_SHEETS -->',sheetCards.join(''));
const contact=html.match(/<section class="contact"[\s\S]*?<\/section>/)[0];
const faq=html.match(/<section class="faq-section"[\s\S]*?<\/section>/)[0];
let menuPage=html.replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main">${menuSection}${contact}${faq}</main>`)
 .replace('<body id="top">','<body id="top" data-page="menu">')
 .replace(/<title>.*?<\/title>/,'<title>The Menu | Chai Chenak Catering and Events</title>')
 .replace('content="Pakistani catering for weddings, corporate events, and private celebrations across New York and New Jersey. Explore live stations and plan your event with Chai Chenak."','content="Explore live stations, Pakistani buffets, desserts, and drinks. Watch our event films and build your Chai Chenak catering menu."')
 .replace(/href="#(story|services|gallery)"/g,'href="/#$1"')
 .replace('href="/menu" class="nav-plan"','href="/menu" class="nav-plan" aria-current="page"');
await writeFile('dist/client/menu.html',replaceImages(menuPage));
await mkdir('dist/client/package-sheets',{recursive:true});
const packageCards={wedding:[],private:[]};
for(const sheet of packageSheets){
 const source='Packages&menu/'+sheet.source,publicPath='/package-sheets/'+sheet.id+'.jpg';
 const {width,height}=await sharp(source).metadata();
 await cp(source,'dist/client'+publicPath);
 packageCards[sheet.collection].push(`<figure class="menu-sheet package-sheet" id="package-${sheet.id}"><a href="${publicPath}" target="_blank" rel="noopener" aria-label="Open ${escapeHTML(sheet.title)} package at full size in a new tab"><img src="${publicPath}" alt="${escapeHTML(sheet.title)} — catering package, pricing and service details" width="${width}" height="${height}" loading="lazy" decoding="async"></a><figcaption><h3>${escapeHTML(sheet.title)}</h3><a href="${publicPath}" target="_blank" rel="noopener">View full size <span aria-hidden="true">↗</span><span class="sr-only">: ${escapeHTML(sheet.title)} (new tab)</span></a></figcaption></figure>`);
}
const packagesSection=(await readFile('packages-section.html','utf8'))
 .replace('<!-- WEDDING_PACKAGES -->',packageCards.wedding.join(''))
 .replace('<!-- PRIVATE_PACKAGES -->',packageCards.private.join(''));
const packagesPage=html.replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main">${packagesSection}${contact}${faq}</main>`)
 .replace('<body id="top">','<body id="top" data-page="packages">')
 .replace(/<title>.*?<\/title>/,'<title>Catering Packages | Chai Chenak Catering and Events</title>')
 .replace('content="Pakistani catering for weddings, corporate events, and private celebrations across New York and New Jersey. Explore live stations and plan your event with Chai Chenak."','content="Explore Chai Chenak wedding and private-event catering packages, with full package menus, pricing and service details."')
 .replace('content="Chai Chenak | Catering &amp; Events"','content="Catering Packages | Chai Chenak"')
 .replace(/href="#(story|services|gallery)"/g,'href="/#$1"')
 .replace('href="/packages" class="nav-packages"','href="/packages" class="nav-packages" aria-current="page"');
await writeFile('dist/client/packages.html',replaceImages(packagesPage));
await mkdir('dist/client/banquet',{recursive:true});
await sharp('Banquet/Main pic.JPG').rotate().resize({width:1400,withoutEnlargement:true}).webp({quality:80}).toFile('dist/client/banquet/main.webp');
const banquetMenuCards=[];
for(const [index,sheet] of banquetMenus.entries()){
 const number=String(index+1).padStart(2,'0');
 let preview=`<div class="banquet-menu-art" aria-hidden="true"><svg viewBox="0 0 160 160" fill="none"><circle cx="80" cy="80" r="69"/><circle cx="80" cy="80" r="61"/>${Array.from({length:8},(_,i)=>`<ellipse cx="80" cy="55" rx="11" ry="24" transform="rotate(${i*45} 80 80)"/>`).join('')}<circle cx="80" cy="80" r="12"/></svg><span>Chai Chenak</span></div>`;
 if(sheet.source){
  const publicPath=`/banquet/${sheet.id}.webp`;
  const {width,height}=await sharp(sheet.source).rotate().resize({width:1600,withoutEnlargement:true}).webp({quality:84}).toFile('dist/client'+publicPath);
  preview=`<a class="banquet-menu-preview" href="${publicPath}" target="_blank" rel="noopener" aria-label="Open ${escapeHTML(sheet.title)} at full size in a new tab"><img src="${publicPath}" alt="${escapeHTML(sheet.title)} — banquet menu" width="${width}" height="${height}" loading="lazy" decoding="async"><span>View full menu <span aria-hidden="true">↗</span></span></a>`;
 }
 banquetMenuCards.push(`<article class="banquet-menu-card" id="banquet-${sheet.id}" data-reveal><div class="banquet-menu-card-top"><span class="eyebrow">Banquet collection</span><span class="banquet-menu-status">${sheet.source?'Explore the menu':'Coming soon'}</span></div>${preview}<div class="banquet-menu-card-copy"><span class="banquet-menu-number" aria-hidden="true">${number}</span><h3>${escapeHTML(sheet.title)}.</h3>${sheet.source&&sheet.priceLabel?`<div class="banquet-menu-pricing"><p class="banquet-menu-price">${escapeHTML(sheet.priceLabel)}</p>${sheet.serviceNote?`<p class="banquet-menu-service">${escapeHTML(sheet.serviceNote)}</p>`:''}</div>`:''}<p>${sheet.source?escapeHTML(sheet.description||'Take a look at the full selections, then tell our team what you have in mind.'):'A new menu for the moments you share. Full selections and details will be revealed here soon.'}</p><a class="banquet-menu-inquiry" href="#contact" data-banquet-menu="${escapeHTML(sheet.title)}">Ask about ${escapeHTML(sheet.title)} <span aria-hidden="true">↗</span></a></div></article>`);
}
const publishedBanquetMenus=banquetMenus.filter(sheet=>sheet.source).length;
const banquetMenuIntro=publishedBanquetMenus===0?'Our new banquet menus are coming soon. Full selections and details will appear here. Until then, talk to our team about the food you’d love to share.':publishedBanquetMenus===banquetMenus.length?'Explore two menus for your celebration. Take a look at the selections and tell our team about the food you’d love to share.':'Our first new banquet menu is ready to explore, with another coming soon. Take a look and talk to our team about the food you’d love to share.';
const banquetSection=(await readFile('banquet-section.html','utf8'))
 .replace('<!-- BANQUET_MENUS -->',banquetMenuCards.join(''))
 .replace('<!-- BANQUET_MENU_INTRO -->',banquetMenuIntro);
const banquetPage=html.replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main">${banquetSection}${contact}${faq}</main>`)
 .replace('</head>','<link rel="stylesheet" href="/banquet.css"></head>')
 .replace('<body id="top">','<body id="top" data-page="banquet">')
 .replace(/<title>.*?<\/title>/,'<title>Banquet &amp; Conference Hall | Chai Chenak Catering and Events</title>')
 .replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="Discover the Chai Chenak Banquet Hall, take a video tour and explore our banquet menus, or plan a conference, meeting or team gathering. Ask our team about room setup, catering and availability.">')
 .replace('content="Chai Chenak | Catering &amp; Events"','content="Banquet &amp; Conference Hall | Chai Chenak"')
 .replace(/href="#(story|services|gallery)"/g,'href="/#$1"')
 .replace('href="/banquet" class="nav-banquet"','href="/banquet" class="nav-banquet" aria-current="page"')
 .replace('class="nav-halls"','class="nav-halls" data-current="true"');
await writeFile('dist/client/banquet.html',replaceImages(banquetPage));
for(const file of ['styles.css','enhancements.css','app.js','catalog.js','favicon.svg','robots.txt','admin.html','admin.css','admin.js','refinement.css','experience.js','intro.css','intro.js','assistant.css','assistant.js','banquet.css'])await writeFile('dist/client/'+file,replaceImages(await readFile(file,'utf8')));
await writeFile('dist/server/index.js',(await readFile('worker/index.js','utf8')).replace("'../catalog.js'","'./catalog.js'"));
await cp('catalog.js','dist/server/catalog.js');
await writeFile('dist/server/assistant.js',(await readFile('worker/assistant.js','utf8')).replace("'../catalog.js'","'./catalog.js'").replace("'../package-sheets.js'","'./package-sheets.js'").replace("'../banquet-menus.js'","'./banquet-menus.js'"));
await cp('package-sheets.js','dist/server/package-sheets.js');
await cp('banquet-menus.js','dist/server/banquet-menus.js');
await writeFile('dist/client/404.html','<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Page not found | Chai Chenak</title><body style="font-family:system-ui;padding:10%;background:#F7F2E6;color:#241B14"><h1>This page isn’t on the menu.</h1><p><a href="/">Return to Chai Chenak Catering &amp; Events</a></p></body></html>');
console.log(`Built catering site with ${imageMap.size} optimized images and inquiry API.`);
