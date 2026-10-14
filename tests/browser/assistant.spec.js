import {test,expect} from '@playwright/test';

test('customer chat provides menu help on every public page and works on mobile',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(const path of ['/','/menu','/packages','/banquet']){
    await page.goto(path);await page.locator('#chat-launcher').click();await expect(page.locator('#customer-chat')).toBeVisible();
    await expect(page.locator('#chat-input')).toBeFocused();await page.keyboard.press('Escape');
    await expect(page.locator('#customer-chat')).not.toBeVisible();await expect(page.locator('#chat-launcher')).toBeFocused();
  }
  await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('#chat-launcher').click();
  await page.locator('[data-chat-question*="tray order"]').click();await expect(page.locator('.chat-message:not(.chat-message-user)').last()).toContainText('Tray order menu');
  await page.locator('[data-chat-question*="packages"]').click();await expect(page.locator('#chat-messages')).toContainText('The Gathering');
  await expect(page.locator('#chat-mode')).toHaveText('Menu & FAQ guide');
  await page.locator('#chat-input').fill('Do you offer Papri Chaat?');await page.locator('#chat-input').press('Enter');
  await expect(page.locator('.chat-message:not(.chat-message-user)').last()).toContainText('Papri Chaat');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const panel=await page.locator('#customer-chat').boundingBox();expect(panel.x).toBeGreaterThanOrEqual(0);expect(panel.y).toBeGreaterThanOrEqual(0);expect(panel.x+panel.width).toBeLessThanOrEqual(390);expect(panel.y+panel.height).toBeLessThanOrEqual(844);
  await page.screenshot({path:'/tmp/chaichenak-chat-mobile.png'});
  await page.locator('#chat-reset').click();await expect(page.locator('#chat-messages')).toBeEmpty();
  await page.locator('#chat-contact').click();await expect(page.locator('#customer-chat')).not.toBeVisible();await expect(page.locator('#event-type')).toBeFocused();
  expect(errors).toEqual([]);
});

test('chat keeps failed questions for retry and renders AI replies safely',async({page})=>{
  await page.route('**/api/chat',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({mode:'ai'})}));
  await page.goto('/');await page.locator('#chat-launcher').click();await expect(page.locator('#chat-mode')).toHaveText('AI catering assistant');
  await page.route('**/api/chat',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Please try again.'})}));
  await page.locator('#chat-input').fill('What about chaat?');await page.locator('#chat-send').click();await expect(page.locator('#chat-status')).toHaveText('Please try again.');
  await expect(page.locator('#chat-input')).toHaveValue('What about chaat?');await expect(page.locator('#chat-send')).toBeEnabled();await expect(page.locator('#chat-messages')).toBeEmpty();
  await page.route('**/api/chat',route=>{
    expect(route.request().postDataJSON().messages).toEqual([{role:'user',content:'What about chaat?'}]);
    return route.fulfill({contentType:'application/json',body:JSON.stringify({mode:'ai',answer:'<img src=x onerror=alert(1)> Papri Chaat is on our menu.',links:[{label:'Menu',href:'/menu'},{label:'Unsafe link',href:'javascript:alert(1)'}]})});
  });
  await page.locator('#chat-send').click();await expect(page.locator('#chat-messages')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('#chat-messages img')).toHaveCount(0);await expect(page.locator('.chat-links a')).toHaveCount(1);
  await expect(page.locator('#chat-privacy')).toContainText('OpenAI');await page.keyboard.press('Escape');await expect(page.locator('#chat-launcher')).toHaveAttribute('aria-expanded','false');
});
