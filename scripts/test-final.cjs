const {chromium} = require('playwright');

(async () => {
  const browser = await chromium.launch({args: ['--no-sandbox']});
  const page = await browser.newPage({
    viewport: {width: 390, height: 844},
    isMobile: true,
    hasTouch: true,
  });

  // Login first
  await page.goto('http://localhost:5173/auth/login', {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);
  await page.fill('input[type="email"]', 'ali.khan@gmail.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  console.log('URL after login:', await page.url());
  const session = await page.evaluate(() => localStorage.getItem('sh_session'));
  console.log('session email:', session ? JSON.parse(session).email : 'null');

  // Go to home
  await page.goto('http://localhost:5173/', {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);

  // Check avatar
  const avatar = await page.locator('.landing-avatar-btn');
  const avatarCount = await avatar.count();
  console.log('avatar count:', avatarCount);
  if (avatarCount > 0) {
    const avatarText = await avatar.textContent();
    console.log('avatar text:', avatarText);
  }

  // Open account menu
  await page.locator('.landing-avatar-btn').click();
  await page.waitForTimeout(400);

  const menuVisible = await page.locator('.account-menu').isVisible();
  console.log('account menu visible:', menuVisible);
  const menuCount = await page.locator('.account-menu').count();
  console.log('account menu count:', menuCount);

  if (menuCount > 0) {
    const items = await page.evaluate(() => {
      const menu = document.querySelector('.account-menu');
      return Array.from(menu.querySelectorAll('a, button')).map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim() || '',
        href: el.tagName === 'A' ? el.getAttribute('href') : null,
      }));
    });
    console.log('menu items:', JSON.stringify(items, null, 2));

    // Check sign out
    const signOut = await page.locator('.account-menu button:has-text("Sign out")').isVisible();
    console.log('sign out visible:', signOut);

    // Click sign out to test confirmation
    await page.locator('.account-menu button:has-text("Sign out")').click();
    await page.waitForTimeout(300);
    const confirmVisible = await page.locator('.account-menu button:has-text("Yes, sign out")').isVisible();
    console.log('confirmation visible after click:', confirmVisible);

    // Cancel
    await page.locator('.account-menu button:has-text("Cancel")').click();
    await page.waitForTimeout(200);
    const signOutAfterCancel = await page.locator('.account-menu button:has-text("Sign out")').isVisible();
    console.log('sign out after cancel:', signOutAfterCancel);
  }

  await page.screenshot({path: 'qa-screenshots/account-menu-final.png'});
  console.log('screenshot saved');

  await browser.close();
})();
