import {readFileSync} from 'node:fs';
import {test,expect} from '@playwright/test';
test('menu planning, mobile navigation, gallery and responsive layout',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await expect(page.locator('h1')).toHaveCount(1);
  await page.locator('[data-menu="chaat"]').click();await page.locator('#view-full-menu').click();await expect(page).toHaveURL(/\/menu$/);await expect(page.locator('#selection-count')).toContainText('1 selection');
  await page.locator('#plan-guests').fill('125');await page.locator('#plan-venue').fill('New Brunswick');
  await page.reload();await expect(page.locator('[data-menu="chaat"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#plan-guests')).toHaveValue('125');await expect(page.locator('#plan-venue')).toHaveValue('New Brunswick');
  await page.locator('[data-filter="sweet"]').click();await expect(page.locator('.menu-card')).toHaveCount(29);
  await page.locator('#menu-search').fill('unmatched');await expect(page.locator('#menu-empty')).toBeVisible();await page.locator('#menu-search').fill('');
  await page.goto('/#gallery');await page.locator('.g-item').first().click();await expect(page.locator('#gallery-dialog')).toBeVisible();await page.keyboard.press('ArrowRight');await expect(page.locator('#gallery-caption')).toContainText('2 /');await page.keyboard.press('Escape');await expect(page.locator('#gallery-dialog')).not.toBeVisible();
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'/tmp/chaichenak-hero.png'});
  for(const width of [375,390,768,850,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await page.setViewportSize({width:390,height:844});await page.locator('.hamburger').click();await expect(page.locator('.hamburger')).toHaveAttribute('aria-expanded','true');await page.locator('#navigation > a.nav-plan').click();await expect(page.locator('.hamburger')).toHaveAttribute('aria-expanded','false');
  await page.screenshot({path:'/tmp/chaichenak-mobile.png'});expect(errors).toEqual([]);
});
test('real inquiry submission, durable owner inbox, access controls and status update',async({page,request,browser})=>{
  await page.goto('/');await page.locator('[data-menu="pizza"]').click();await page.locator('#event-type').selectOption('Wedding');await page.locator('#event-date').fill('2099-10-15');await page.locator('#venue').fill('QA Venue, New Brunswick');await page.locator('#next-step').click();await page.locator('#first-name').fill('QA');await page.locator('#last-name').fill('Catering Test');await page.locator('#email').fill(`qa-${Date.now()}@example.com`);await page.locator('#phone').fill('732-555-0123');await page.locator('[name="consent"]').check();await page.locator('#submit-inquiry').click();await expect(page.locator('#inquiry-success')).toBeVisible();const reference=await page.locator('#inquiry-reference').textContent();expect(reference).toMatch(/^CC-/);
  expect((await request.get('/api/admin/inquiries')).status()).toBe(401);
  const password=readFileSync('.dev.vars','utf8').match(/^ADMIN_PASSWORD="([^"]+)"/m)?.[1];
  if(!password)throw new Error('Configure ADMIN_PASSWORD in .dev.vars before running browser tests.');
  const auth={authorization:'Basic '+Buffer.from('admin:'+password).toString('base64')};
  const list=await request.get('/api/admin/inquiries',{headers:auth});expect(list.ok()).toBe(true);const data=await list.json();const saved=data.items.find(i=>i.reference===reference);expect(saved.menu).toContain('pizza');expect(saved.venue).toBe('QA Venue, New Brunswick');
  const updated=await request.patch('/api/admin/inquiries/'+saved.id,{headers:{...auth,origin:'http://127.0.0.1:8788'},data:{status:'contacted'}});expect(updated.ok()).toBe(true);
  const ownerContext=await browser.newContext({baseURL:'http://127.0.0.1:8788',httpCredentials:{username:'admin',password,origin:'http://127.0.0.1:8788'}});const ownerPage=await ownerContext.newPage();await ownerPage.goto('/admin');await expect(ownerPage.locator('h1')).toContainText('Every gathering');await expect(ownerPage.locator('#inquiries')).toContainText(reference);await ownerContext.close();
});
test('failed submission preserves input and supports retry',async({page})=>{
  await page.goto('/');await page.locator('#event-type').selectOption('Corporate Event');await page.locator('#event-date').fill('2099-12-20');await page.locator('#venue').fill('Office');await page.locator('#next-step').click();await page.locator('#first-name').fill('Retained');await page.locator('#last-name').fill('Input');await page.locator('#email').fill('retry@example.com');await page.locator('#phone').fill('7325550101');await page.locator('[name="consent"]').check();await page.route('**/api/inquiries',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Please try again.'})}));await page.locator('#submit-inquiry').click();await expect(page.locator('#form-status')).toHaveText('Please try again.');await expect(page.locator('#first-name')).toHaveValue('Retained');await expect(page.locator('#submit-inquiry')).toBeEnabled();await expect(page.locator('#inquiry-success')).toBeHidden();
});
