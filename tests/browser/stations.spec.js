import {test,expect} from '@playwright/test';
import {menu} from '../../catalog.js';
test('deleted main-course films are unavailable while their menu choices remain selectable',async({page,request})=>{
 const removed=['bbq','biryani','qorma','naan','karahi','dal'];
 const requests=[];page.on('request',r=>requests.push(r.url()));
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');
 await expect(page.locator('[data-menu="buffet"]')).toHaveCount(0);
 await expect(page.locator('[data-watch="buffet"]')).toHaveCount(0);
 await expect(page.locator('img[src="/undefined"],video[data-src="/undefined"]')).toHaveCount(0);
 await page.goto('/menu');
 for(const id of removed){
  for(const extension of ['mp4','webp'])expect((await request.get(`/media/${id}.${extension}`)).status()).toBe(404);
  await expect(page.locator(`[data-watch="${id}"]`)).toHaveCount(0);
  const item=menu.find(item=>item.id===id);
  await page.locator(`[data-filter="${item.category}"]`).click();
  await page.locator(`[data-menu="${id}"]`).click();
  await expect(page.locator('#selected-menu')).toContainText(item.selectionName);
 }
 await page.reload();await expect(page.locator('#selected-menu li')).toHaveCount(6);
 await page.setViewportSize({width:390,height:844});await page.locator('[data-filter="buffet"]').click();
 await expect(page.locator('#menu-videos')).toHaveCount(0);
 await expect(page.locator('[data-menu="biryani"]')).toHaveAttribute('aria-pressed','true');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(requests.some(url=>removed.some(id=>url.endsWith(`/media/${id}.mp4`)||url.endsWith(`/media/${id}.webp`)))).toBe(false);
 expect((await request.get('/media/salad.mp4')).ok()).toBe(true);
});
test('station collection, category navigation, video playback and full menu submission',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/menu');
 await expect(page.locator('.menu-card')).toHaveCount(menu.length);
 await expect(page.locator('.menu-group')).toHaveCount(24);await expect(page.locator('.menu-group[open]')).toHaveCount(1);
 await page.locator('[data-watch="bun-kebab"]').click();await expect(page.locator('#station-dialog')).toBeVisible();await expect(page.locator('#station-dialog-title')).toHaveText('Bun Kebab (Chicken or Dal)');
 await expect.poll(()=>page.locator('#station-video').evaluate(video=>video.readyState)).toBeGreaterThanOrEqual(2);
 await page.locator('#station-dialog-add').click();await expect(page.locator('#selection-count')).toContainText('1 selection');await page.locator('#station-next').click();await expect(page.locator('#station-dialog-title')).toHaveText('Papri Chaat');
 await page.keyboard.press('Escape');await expect(page.locator('#station-dialog')).toBeHidden();await expect.poll(()=>page.locator('#station-video').evaluate(v=>v.paused)).toBe(true);
 await page.locator('.nav-disclosure').click();await page.locator('[data-category-link="brunch"]').click();await expect(page.locator('.menu-card')).toHaveCount(4);await expect(page.locator('#menu-grid')).toContainText('Omelette Station');
 await page.locator('[data-filter="drinks"]').click();await expect(page.locator('.menu-card')).toHaveCount(13);await expect(page.locator('#menu-grid')).toContainText('Pink Guava Mojito');
 for(const id of ['mocktails-pink-guava-mojito','mocktails-mango-lassi'])await page.locator(`[data-menu="${id}"]`).click();
 await page.locator('[data-filter="passed"]').click();await page.locator('[data-menu="butler-passed-lamb-chops"]').click();
 await page.locator('[data-filter="brunch"]').click();for(const button of await page.locator('[data-menu]').all())await button.click();await expect(page.locator('#selection-count')).toContainText('8 selections');
 await page.locator('#event-type').selectOption('Private Party / Gala');await page.locator('#event-date').fill('2099-10-20');await page.locator('#venue').fill('Media QA Venue');await page.locator('#next-step').click();await page.locator('#first-name').fill('Station');await page.locator('#last-name').fill('QA');await page.locator('#email').fill(`station-${Date.now()}@example.com`);await page.locator('#phone').fill('7325551234');await page.locator('[name="consent"]').check();await page.locator('#submit-inquiry').click();await expect(page.locator('#inquiry-success')).toBeVisible();expect(errors).toEqual([]);
});
test('reduced motion skips automatic video downloads and keeps content visible',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});const requests=[];page.on('request',r=>{if(r.url().endsWith('.mp4'))requests.push(r.url());});await page.goto('/');await page.locator('#menu').scrollIntoViewIfNeeded();await page.locator('[data-watch="pizza"]').hover();await expect(page.locator('#motion-toggle')).toHaveText('▷Reduced motion');expect(requests).toEqual([]);expect(await page.locator('#hero-film').evaluate(v=>v.paused)).toBe(true);
 await page.locator('[data-watch="pizza"]').click();await expect(page.locator('#station-dialog')).toBeVisible();await expect.poll(()=>requests.length).toBeGreaterThan(0);
});
test('refined desktop and mobile layouts render without overflow',async({page})=>{
 await page.goto('/');await page.locator('#motion-toggle').click();
 for(const width of [375,390,600,768,850,1024,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`).toBe(true);}
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'/tmp/chaichenak-review/new-hero.png'});
 await page.locator('#menu').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await expect.poll(()=>page.locator('.station-media img').evaluateAll(images=>images.filter(image=>{const r=image.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;}).every(image=>image.complete&&image.naturalWidth>0))).toBe(true);await page.screenshot({path:'/tmp/chaichenak-review/new-stations.png'});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'/tmp/chaichenak-review/new-mobile-hero.png'});
 await page.locator('#menu').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await expect.poll(()=>page.locator('.station-media img').evaluateAll(images=>images.filter(image=>{const r=image.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;}).every(image=>image.complete&&image.naturalWidth>0))).toBe(true);await page.screenshot({path:'/tmp/chaichenak-review/new-mobile-stations.png'});
});

test('five homepage stations lead to the full buffet and dessert menu with a shared plan',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await expect(page.locator('.menu-card')).toHaveCount(5);await expect(page.locator('.experience-film')).toHaveCount(0);
 await page.locator('[data-menu="pizza"]').click();await page.locator('#view-full-menu').click();await expect(page).toHaveURL(/\/menu$/);await expect(page.locator('h1')).toContainText('The menu.');await expect(page.locator('#selected-menu')).toContainText('Flatbread Pizza Live Station');
 await page.locator('[data-filter="savory"]').click();await expect(page.locator('[data-menu="pizza"]')).toHaveAttribute('aria-pressed','true');
 await page.locator('[data-filter="buffet"]').click();await expect(page.locator('.menu-card')).toHaveCount(78);
 await expect(page.locator('[data-watch="biryani"]')).toHaveCount(0);
 await page.locator('[data-menu="biryani"]').click();await page.locator('#plan-guests').fill('180');await page.locator('#plan-venue').fill('New Brunswick');
 await page.goto('/menu?category=sweet');await expect(page.locator('.menu-card')).toHaveCount(29);await page.locator('[data-watch="mango-shooters"]').click();await expect.poll(()=>page.locator('#station-video').evaluate(v=>v.readyState)).toBeGreaterThanOrEqual(2);await page.keyboard.press('Escape');
 const downloadPromise=page.waitForEvent('download');await page.locator('#download-plan').click();const download=await downloadPromise;const {readFile}=await import('node:fs/promises');expect(await readFile(await download.path(),'utf8')).toContain('chaichenakcatering@gmail.com');
 await page.goto('/');await expect(page.locator('#form-shortlist')).toContainText('Sindhi Biryani');await expect(page.locator('#guests')).toHaveValue('180');await expect(page.locator('#venue')).toHaveValue('New Brunswick');
 await expect(page.locator('a[href="mailto:chaichenakcatering@gmail.com"]')).toHaveCount(2);expect(errors).toEqual([]);
});
test('gallery filters and lightbox work, Instagram embeds load only near their section',async({page})=>{
 // Stub only the external frames: Instagram availability is outside the local app.
 const previews=[];await page.route('https://www.instagram.com/**',route=>{previews.push(route.request().url());return route.fulfill({contentType:'text/html',body:'<p>Instagram preview</p>'});});
 await page.goto('/');await expect(page.locator('[data-instagram-src]')).toHaveCount(3);expect(previews).toHaveLength(0);
 await expect(page.locator('.g-item:visible')).toHaveCount(8);await page.locator('[data-gallery-filter="desserts"]').click();await expect(page.locator('.g-item:visible')).toHaveCount(4);await expect(page.locator('#gallery-more')).toBeHidden();
 await page.locator('.g-item:visible').first().click();await expect(page.locator('#gallery-caption')).toContainText('1 / 4');await page.keyboard.press('ArrowRight');await expect(page.locator('#gallery-caption')).toContainText('2 / 4');await page.keyboard.press('Escape');
 await page.locator('[data-gallery-filter="all"]').click();await page.locator('#gallery-more').click();await expect(page.locator('.g-item:visible')).toHaveCount(16);await page.locator('#gallery-more').click();await expect(page.locator('.g-item:visible')).toHaveCount(17);
 await page.locator('#instagram').scrollIntoViewIfNeeded();await expect.poll(()=>previews.length).toBe(3);
 for(const code of ['Db501bIKFKF','Db6bOMFKn_M','DbV25BOKrE4']){await expect(page.locator(`.instagram-card a[href="https://www.instagram.com/p/${code}/"]`)).toBeVisible();expect(previews.some(url=>url.includes(code))).toBe(true);}
 for(const width of [375,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.screenshot({path:'/tmp/chaichenak-review/instagram.png'});
 await page.goto('/menu?category=buffet');for(const width of [375,768,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await expect(page.locator('.brand-intro')).toBeHidden();await page.screenshot({path:'/tmp/chaichenak-review/full-menu.png'});
});

test('supplied menu sections support search, service styles, surcharges and saved selections',async({page})=>{
 await page.goto('/menu');
 await page.locator('#menu-search').fill('papri');
 await expect(page.locator('.menu-card')).toHaveCount(2);
 await expect(page.locator('.menu-group[open]')).toHaveCount(1);
 await page.locator('[data-menu="chaat"]').click();
 await page.locator('[data-menu="vegetarian-appetizers-papri-chaat"]').click();
 await expect(page.locator('#selected-menu')).toContainText('Papri Chaat (Live stations)');
 await expect(page.locator('#selected-menu')).toContainText('Papri Chaat (Appetizers)');
 await page.reload();
 await expect(page.locator('#selection-count')).toContainText('2 selections');
 await page.locator('#menu-search').fill('crepe');
 await expect(page.locator('.menu-card')).toHaveCount(2);
 await page.locator('#menu-search').fill('');
 await page.locator('[data-filter="passed"]').click();
 await expect(page.locator('.menu-card')).toHaveCount(16);
 await expect(page.locator('.menu-card').filter({hasText:'Lamb Chops'})).toContainText('$5 per piece');
 await page.locator('[data-filter="savory"]').click();
 await page.locator('#menu-search').fill('premium');
 await expect(page.locator('.menu-card')).toHaveCount(9);
 await expect(page.locator('.menu-card').filter({hasText:'Balochi Mutton Sajji'})).toContainText('$500 per goat');
 await page.locator('#menu-search').fill('pizza');
 await expect(page.locator('#menu-grid')).toContainText('Outdoor facility only');
 await page.locator('#menu-search').fill('');
 for(const category of ['all','passed','drinks','brunch','buffet','sweet','appetizers','continental','kids']){
  await page.locator(`[data-filter="${category}"]`).click();
  for(const width of [375,768,1440]){
   await page.setViewportSize({width,height:900});
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${category} overflow at ${width}`).toBe(true);
  }
 }
 await page.locator('#clear-plan').click();
 await expect(page.locator('#selected-menu li')).toHaveCount(0);
 await page.reload();await expect(page.locator('#selected-menu li')).toHaveCount(0);
 await expect(page.locator('.brand-intro')).toBeHidden();await page.screenshot({path:'/tmp/chaichenak-review/menu-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.locator('[data-filter="drinks"]').click();await page.locator('#menu-results').scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/chaichenak-review/menu-mobile.png'});
});

test('menu leads with playing station videos and keeps unfilmed choices below',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/menu');
 await expect(page.locator('#menu-videos .menu-card')).toHaveCount(24);
 await expect(page.locator('#menu-more .menu-card')).toHaveCount(209);
 expect(await page.locator('[data-menu]').evaluateAll(buttons=>new Set(buttons.map(button=>button.dataset.menu)).size)).toBe(menu.length);
 expect(await page.evaluate(()=>Boolean(document.querySelector('#menu-videos').compareDocumentPosition(document.querySelector('#menu-more'))&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
 const first=page.locator('#menu-videos .station-preview').first();
 const last=page.locator('#menu-videos .station-preview').last();
 await expect(last).not.toHaveAttribute('src');
 await page.locator('#menu-videos .station-media').first().scrollIntoViewIfNeeded();
 await expect.poll(()=>first.evaluate(video=>!video.paused&&video.currentTime>0&&video.muted&&video.loop)).toBe(true);
 await expect(first).toHaveClass(/is-playing/);
 await page.locator('#motion-toggle').click();
 await expect(page.locator('#motion-toggle')).toHaveAttribute('aria-pressed','true');
 await expect.poll(()=>first.evaluate(video=>video.paused)).toBe(true);
 await page.locator('#motion-toggle').click();
 await page.locator('#menu-videos .station-media').first().scrollIntoViewIfNeeded();
 await expect.poll(()=>first.evaluate(video=>!video.paused)).toBe(true);
 await page.locator('[data-watch="bun-kebab"]').click();
 await expect(page.locator('#station-dialog')).toBeVisible();
 await expect.poll(()=>first.evaluate(video=>video.paused)).toBe(true);
 await page.keyboard.press('Escape');
 await expect.poll(()=>first.evaluate(video=>!video.paused)).toBe(true);
 await page.locator('#menu-more-link').click();
 await expect(page.locator('#menu-more-title')).toBeInViewport();
 await expect.poll(()=>first.evaluate(video=>video.paused)).toBe(true);
 await page.locator('[data-filter="passed"]').click();
 await expect(page.locator('#menu-videos')).toHaveCount(0);
 await expect(page.locator('#motion-toggle')).toBeHidden();
 await expect(page.locator('#menu-more .menu-card')).toHaveCount(16);
 await page.locator('[data-filter="displays"]').click();
 await expect(page.locator('#menu-videos .menu-card')).toHaveCount(7);
 await expect(page.locator('#menu-more .menu-card')).toHaveCount(1);
 await expect(page.locator('#menu-more-link')).toBeVisible();
 await page.locator('[data-filter="all"]').click();
 await page.setViewportSize({width:390,height:844});
 await page.locator('#menu-videos .station-media').first().scrollIntoViewIfNeeded();
 await expect.poll(()=>first.evaluate(video=>!video.paused&&video.playsInline)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'/tmp/chaichenak-review/menu-playing-mobile.png'});
 await page.setViewportSize({width:1440,height:1000});
 await page.locator('#menu-videos').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
 await expect(first).toHaveClass(/is-playing/);
 await page.screenshot({path:'/tmp/chaichenak-review/menu-playing-desktop.png'});
 expect(errors).toEqual([]);
});

test('reduced motion leaves menu video posters available for explicit playback',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 const requests=[];page.on('request',r=>{if(r.url().endsWith('.mp4'))requests.push(r.url());});
 await page.goto('/menu');
 await page.locator('#menu-videos .station-media').first().scrollIntoViewIfNeeded();
 await expect(page.locator('#motion-toggle')).toBeDisabled();
 await expect(page.locator('#motion-toggle')).toHaveText('▷Reduced motion');
 await expect(page.locator('#menu-videos .station-preview[src]')).toHaveCount(0);
 expect(requests).toEqual([]);
 await page.locator('[data-watch="bun-kebab"]').click();
 await expect(page.locator('#station-dialog')).toBeVisible();
 await expect.poll(()=>page.locator('#station-video').evaluate(video=>video.readyState)).toBeGreaterThanOrEqual(2);
});
