import {test,expect} from '@playwright/test';
import {packageSheets} from '../../package-sheets.js';
import {menuSheets} from '../../menu-sheets.js';

test('package navigation, original sheets, mobile layout and inquiry work together',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/menu');
 await page.locator('[data-menu="chaat"]').click();
 await page.locator('.nav-packages').click();
 await expect(page).toHaveURL(/\/packages$/);
 await expect(page.locator('h1')).toContainText('The packages.');
 await expect(page.locator('.nav-packages')).toHaveAttribute('aria-current','page');
 await expect(page.locator('#form-shortlist')).toContainText('Papri Chaat');
 await expect(page.locator('#wedding-packages .package-sheet')).toHaveCount(packageSheets.filter(sheet=>sheet.collection==='wedding').length);
 await expect(page.locator('#private-packages .package-sheet')).toHaveCount(packageSheets.filter(sheet=>sheet.collection==='private').length);
 await expect(page.locator('img[src^="/menu-sheets/"]')).toHaveCount(0);
 for(const image of await page.locator('.package-sheet img').all()){
  await image.scrollIntoViewIfNeeded();
  await image.evaluate(img=>img.decode());
  expect(await image.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 }
 const popupPromise=page.waitForEvent('popup');
 await page.locator('#package-the-gathering>a').click();
 const popup=await popupPromise;await popup.waitForLoadState();
 await expect(popup).toHaveURL(/\/package-sheets\/the-gathering\.jpg$/);
 await popup.close();
 for(const width of [375,390,768,900,901,920,1024,1150,1440]){
  await page.setViewportSize({width,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`).toBe(true);
 }
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:'/tmp/chaichenak-review/packages-desktop.png'});
 await page.setViewportSize({width:390,height:844});
 await page.locator('.hamburger').click();
 await expect(page.locator('.nav-packages')).toBeVisible();
 await page.locator('.nav-packages').click();
 await expect(page.locator('.hamburger')).toHaveAttribute('aria-expanded','false');
 await page.locator('.package-jump-links a[href="#private-packages"]').click();
 await expect(page.locator('#private-packages-title')).toBeInViewport();
 await page.locator('#private-packages img').first().evaluate(img=>img.decode());
 await page.screenshot({path:'/tmp/chaichenak-review/packages-mobile.png'});
 await page.locator('.package-inquiry a').click();
 await page.locator('#event-type').selectOption('Wedding');
 await page.locator('#event-date').fill('2099-10-20');
 await page.locator('#venue').fill('Package QA Venue');
 await page.locator('#next-step').click();
 await page.locator('#first-name').fill('Package');
 await page.locator('#last-name').fill('QA');
 await page.locator('#email').fill(`package-${Date.now()}@example.com`);
 await page.locator('#phone').fill('7325551234');
 await page.locator('[name="consent"]').check();
 await page.locator('#submit-inquiry').click();
 await expect(page.locator('#inquiry-success')).toBeVisible();
 await page.goto('/');
 await page.setViewportSize({width:1440,height:1000});
 await expect(page.locator('.nav-packages')).toBeVisible();
 await expect(page.locator('.package-sheet')).toHaveCount(0);
 await page.goto('/menu');
 await expect(page.locator('.nav-packages')).toBeVisible();
 await expect(page.locator('.package-sheet')).toHaveCount(0);
 await expect(page.locator('.menu-sheet')).toHaveCount(menuSheets.length);
 expect(errors).toEqual([]);
});
