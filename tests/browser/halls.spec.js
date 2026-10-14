import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

test('event hall navigation, conference planning and inquiry storage work together',async({page,request})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.locator('.nav-halls summary').click();
  await expect(page.locator('.nav-banquet')).toBeVisible();await expect(page.locator('.nav-conference')).toBeVisible();
  await page.keyboard.press('Escape');await expect(page.locator('.nav-halls')).not.toHaveAttribute('open','');await expect(page.locator('.nav-halls summary')).toBeFocused();
  await page.locator('.nav-halls summary').click();await page.locator('.nav-conference').click();
  await expect(page).toHaveURL(/\/banquet#conference-hall$/);await expect(page.locator('#conference-title')).toContainText('Conference Hall');
  await expect(page.locator('.hall-options a')).toHaveCount(2);await expect(page.locator('.banquet-sheet')).toHaveCount(0);
  await expect(page.locator('.banquet-menu-card')).toHaveCount(2);
  await expect(page.locator('.banquet-menu-status')).toHaveText(['Explore the menu','Explore the menu']);
  await expect(page.locator('.banquet-menu-price')).toHaveText(['$35 per person + tax','$45 per person + tax']);
  await expect(page.locator('.banquet-menu-preview')).toHaveCount(2);
  for(const image of await page.locator('.banquet-menu-preview img').all()){
    await image.scrollIntoViewIfNeeded();await image.evaluate(img=>img.decode());
    expect(await image.evaluate(img=>img.naturalWidth>0&&img.naturalHeight>img.naturalWidth)).toBe(true);
  }
  for(const id of ['menu-one','menu-two']){
    const popupPromise=page.waitForEvent('popup');await page.locator(`#banquet-${id} .banquet-menu-preview`).click();
    const popup=await popupPromise;await popup.waitForLoadState();await expect(popup).toHaveURL(new RegExp(`/banquet/${id}\\.webp$`));await popup.close();
  }
  await expect(page).toHaveTitle(/Banquet & Conference Hall/);
  await expect(page.locator('.conference-media-card')).toHaveCount(1);
  await expect(page.locator('.conference-media img')).toHaveCount(0);
  await expect(page.locator('#banquet-menu-choices')).toHaveCount(0);
  for(const path of ['/conference/room.webp','/conference/gathering.webp','/banquet/banquet-menu-classic.webp','/banquet/banquet-menu-asian.webp','/banquet/menu-35-package.webp']){
    expect((await request.get(path)).status(),`Deleted media: ${path}`).toBe(404);
  }
  const conferenceVideo=page.locator('#conference-video');await expect(conferenceVideo).toHaveAttribute('preload','none');
  expect(await conferenceVideo.evaluate(video=>video.paused&&!video.autoplay&&video.muted&&video.defaultMuted)).toBe(true);
  await conferenceVideo.scrollIntoViewIfNeeded();await conferenceVideo.evaluate(video=>video.play());
  await expect.poll(()=>conferenceVideo.evaluate(video=>video.readyState)).toBeGreaterThanOrEqual(2);
  expect(await conferenceVideo.evaluate(video=>video.videoHeight>video.videoWidth)).toBe(true);await conferenceVideo.evaluate(video=>video.pause());
  for(const width of [375,390,768,901,1024,1150,1440]){
    await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`).toBe(true);
  }
  await page.setViewportSize({width:390,height:844});await page.locator('#request-conference').click();
  await expect(page.locator('#event-type')).toHaveValue('Conference / Meeting');
  await page.locator('#event-date').fill('2099-10-20');await page.locator('#guests').fill('40');await page.locator('#venue').fill('Conference room location to be confirmed');
  await page.locator('#next-step').click();await page.locator('#first-name').fill('Conference');await page.locator('#last-name').fill('QA');
  await page.locator('#email').fill(`conference-${Date.now()}@example.com`);await page.locator('#phone').fill('7325550123');await page.locator('#message').fill('Workshop with presentation needs to discuss.');
  await page.locator('[name="consent"]').check();await page.locator('#submit-inquiry').click();await expect(page.locator('#inquiry-success')).toBeVisible();
  const reference=await page.locator('#inquiry-reference').textContent();
  const password=readFileSync('.dev.vars','utf8').match(/^ADMIN_PASSWORD="([^"]+)"/m)?.[1];
  if(!password)throw new Error('Configure ADMIN_PASSWORD before running browser tests.');
  const response=await request.get('/api/admin/inquiries',{headers:{authorization:'Basic '+Buffer.from('admin:'+password).toString('base64')}});
  expect(response.ok()).toBe(true);const saved=(await response.json()).items.find(item=>item.reference===reference);
  expect(saved.occasion).toBe('Conference / Meeting');expect(saved.guests).toBe(40);expect(saved.message).toContain('presentation');
  for(const path of ['/','/menu','/packages','/banquet']){
    await page.goto(path);await page.locator('.hamburger').click();await page.locator('.nav-halls summary').click();await page.locator('.nav-conference').click();
    await expect(page).toHaveURL(/\/banquet#conference-hall$/);await expect(page.locator('.hamburger')).toHaveAttribute('aria-expanded','false');
  }
  await page.locator('#chat-launcher').click();await page.getByRole('button',{name:'Conference Hall',exact:true}).click();
  await expect(page.locator('.chat-message:not(.chat-message-user)').last()).toContainText('Conference / Meeting');
  const link=page.locator('.chat-links a[href="/banquet#conference-hall"]');await expect(link).toBeVisible();
  expect(errors).toEqual([]);
});

test('new banquet menus carry the chosen option into an inquiry without losing customer notes',async({page,request})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/banquet');
  await expect(page.locator('h1')).toHaveCount(1);
  await page.locator('.banquet-hero-photo img').evaluate(img=>img.decode());
  await page.screenshot({path:'/tmp/chaichenak-banquet-redesign-desktop.png'});
  await page.locator('#event-type').selectOption('Private Party / Gala');await page.locator('#event-date').fill('2099-10-20');
  await page.locator('#guests').fill('40');await page.locator('#venue').fill('Banquet Hall address to be confirmed');
  await page.locator('#next-step').click();
  await page.locator('#message').fill('Please discuss vegetarian choices.');
  await page.locator('[data-banquet-menu="Menu One"]').click();
  await expect(page.locator('#message')).toHaveValue(/Banquet menu preference: Menu One\./);
  await page.locator('[data-banquet-menu="Menu Two"]').click();
  await page.locator('[data-banquet-menu="Menu Two"]').click();
  const message=await page.locator('#message').inputValue();
  expect(message).toContain('Please discuss vegetarian choices.');expect(message).not.toContain('Menu One');
  expect(message.match(/Banquet menu preference: Menu Two\./g)).toHaveLength(1);
  const video=page.locator('#banquet-video');await video.scrollIntoViewIfNeeded();
  expect(await video.evaluate(v=>v.paused&&v.muted&&v.preload==='none')).toBe(true);
  await video.evaluate(v=>v.play());await expect.poll(()=>video.evaluate(v=>v.readyState)).toBeGreaterThanOrEqual(2);await video.evaluate(v=>v.pause());
  for(const width of [360,375,390,600,768,800,901,1024,1440]){
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`).toBe(true);
  }
  await page.setViewportSize({width:390,height:844});await page.locator('#banquet-menus').scrollIntoViewIfNeeded();
  await page.screenshot({path:'/tmp/chaichenak-banquet-redesign-menus-mobile.png'});
  await page.locator('[data-banquet-menu="Menu Two"]').click();
  await page.locator('#event-type').selectOption('Private Party / Gala');await page.locator('#event-date').fill('2099-10-20');
  await page.locator('#guests').fill('40');await page.locator('#venue').fill('Banquet Hall address to be confirmed');
  await page.locator('#next-step').click();await page.locator('#first-name').fill('Banquet');await page.locator('#last-name').fill('QA');
  await page.locator('#email').fill(`banquet-${Date.now()}@example.com`);await page.locator('#phone').fill('7325550123');
  await page.locator('[name="consent"]').check();await page.locator('#submit-inquiry').click();await expect(page.locator('#inquiry-success')).toBeVisible();
  const reference=await page.locator('#inquiry-reference').textContent();
  const password=readFileSync('.dev.vars','utf8').match(/^ADMIN_PASSWORD="([^"]+)"/m)?.[1];
  if(!password)throw new Error('Configure ADMIN_PASSWORD before running browser tests.');
  const response=await request.get('/api/admin/inquiries',{headers:{authorization:'Basic '+Buffer.from('admin:'+password).toString('base64')}});
  expect(response.ok()).toBe(true);const saved=(await response.json()).items.find(item=>item.reference===reference);
  expect(saved.message).toContain('Banquet menu preference: Menu Two.');expect(saved.message).toContain('vegetarian choices');
  await page.locator('[data-banquet-menu="Menu One"]').click();await expect(page.locator('#inquiry-form')).toBeVisible();
  await expect(page.locator('#message')).toHaveValue(/Banquet menu preference: Menu One\./);
  expect(errors).toEqual([]);
});
