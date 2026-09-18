const {chromium} = require('playwright');

(async () => {
  const browser = await chromium.launch({args: ['--no-sandbox']});
  const page = await browser.newPage({
    viewport: {width: 390, height: 844},
    isMobile: true,
    hasTouch: true,
  });

  // Log in first
  await page.goto('http://localhost:5173/auth/login', {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);
  await page.fill('input[type="email"]', 'ali.khan@gmail.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', {timeout: 10000});
  await page.waitForTimeout(1000);

  // Go to home
  await page.goto('http://localhost:5173/', {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);

  // Click avatar to open account menu
  const avatar = page.locator('.landing-avatar-btn');
  await avatar.click();
  await page.waitForTimeout(400);

  // Check dropdown is visible
  const accountMenu = await page.locator('.account-menu').isVisible();
  console.log('account menu visible after click:', accountMenu);
  const menuCount = await page.locator('.account-menu').count();
  console.log('account menu count:', menuCount);

  // Check menu items
  const menuItems = await page.evaluate(() => {
    const menu = document.querySelector('.account-menu');
    if (!menu) return 'no menu';
    return Array.from(menu.querySelectorAll('a, button')).map(el => ({
      tag: el.tagName,
      text: el.textContent?.trim() || '',
      isButton: el.tagName === 'BUTTON',
    }));
  });
  console.log('menu items:', JSON.stringify(menuItems, null, 2));

  // Check Settings link href
  const settingsHref = await page.evaluate(() => {
    const menu = document.querySelector('.account-menu');
    const link = menu?.querySelector('a[href="/settings"]');
    return link ? link.getAttribute('href') : 'not found';
  });
  console.log('settings link href:', settingsHref);

  // Check Profile link href
  const profileHref = await page.evaluate(() => {
    const menu = document.querySelector('.account-menu');
    const link = menu?.querySelector('a[href="/profile"]');
    return link ? link.getAttribute('href') : 'not found';
  });
  console.log('profile link href:', profileHref);

  // Check Sign out button exists
  const signOutBtn = await page.locator('.account-menu button:has-text("Sign out")').isVisible();
  console.log('sign out button visible:', signOutBtn);

  // Check cancel button
  const cancelBtn = await page.locator('.account-menu button:has-text("Cancel")').isVisible();
  console.log('cancel button visible:', cancelBtn);

  // Take screenshot
  await page.screenshot({path: 'qa-screenshots/account-menu-open.png'});
  console.log('screenshot saved');

  // Click Cancel to close confirmation
  if (await page.locator('.account-menu button:has-text("Cancel")').isVisible()) {
    await page.locator('.account-menu button:has-text("Cancel")').click();
    await page.waitForTimeout(200);
    const signOutAfterCancel = await page.locator('.account-menu button:has-text("Sign out")').isVisible();
    console.log('sign out visible after cancel:', signOutAfterCancel);
  }

  // Close menu
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const menuAfterEsc = await page.locator('.account-menu').count();
  console.log('menu count after Escape:', menuAfterEsc);

  await browser.close();
})();
