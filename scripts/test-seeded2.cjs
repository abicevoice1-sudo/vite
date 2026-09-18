const {chromium} = require('playwright');
const fs = require('fs');

(async () => {
  // Read seed data from the seed script output
  const buf = fs.readFileSync('C:\\Users\\Mitchell\\AppData\\Local\\Temp\\seed.json');
  let text = buf.toString('utf16le');
  text = text.replace(/^\uFEFF/, '');
  const seedData = JSON.parse(text);

  const browser = await chromium.launch({args: ['--no-sandbox']});
  const page = await browser.newPage({
    viewport: {width: 390, height: 844},
    isMobile: true,
    hasTouch: true,
  });

  // Seed data into localStorage
  await page.goto('http://localhost:5173/', {waitUntil: 'domcontentloaded'});
  await page.waitForTimeout(500);
  await page.evaluate((data) => {
    localStorage.setItem('sh_users', JSON.stringify(data.sh_users));
    localStorage.setItem('sh_profiles', JSON.stringify(data.sh_profiles));
    console.log('Seeded', data.sh_users.length, 'users');
  }, seedData);

  // Login as aaliyah
  await page.goto('http://localhost:5173/auth/login', {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);
  await page.fill('input[type="email"]', 'aaliyah@example.com');
  await page.fill('input[type="password"]', 'Test1234!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', {timeout: 10000});
  await page.waitForTimeout(1000);
  console.log('Logged in as:', await page.evaluate(() => localStorage.getItem('sh_session')));

  // Go to home page
  await page.goto('http://localhost:5173/', {waitUntil: 'networkidle'});
  await page.waitForTimeout(1000);

  // Check header elements
  const header = await page.locator('.landing-header').count();
  console.log('header count:', header);
  const iconGroup = await page.locator('.landing-header-icon-group').count();
  console.log('icon-group count:', iconGroup);
  const avatar = await page.locator('.landing-avatar-btn').count();
  console.log('avatar count:', avatar);

  if (avatar > 0) {
    console.log('Avatar text:', await page.locator('.landing-avatar-btn').textContent());
  }

  // Open account menu
  await page.locator('.landing-avatar-btn').click();
  await page.waitForTimeout(400);

  const menuVisible = await page.locator('.account-menu').isVisible();
  console.log('Account menu visible:', menuVisible);
  const menuCount = await page.locator('.account-menu').count();
  console.log('Account menu count:', menuCount);

  if (menuCount > 0) {
    const items = await page.evaluate(() => {
      const menu = document.querySelector('.account-menu');
      return Array.from(menu.querySelectorAll('a, button')).map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim() || '',
        href: el.tagName === 'A' ? el.getAttribute('href') : null,
      }));
    });
    console.log('Menu items:', JSON.stringify(items, null, 2));

    // Test sign out flow
    const signOutVisible = await page.locator('.account-menu button:has-text("Sign out")').isVisible();
    console.log('Sign out button visible:', signOutVisible);
    if (signOutVisible) {
      await page.locator('.account-menu button:has-text("Sign out")').click();
      await page.waitForTimeout(300);
      const confirmVisible = await page.locator('.account-menu button:has-text("Yes, sign out")').isVisible();
      console.log('Confirmation visible:', confirmVisible);
      await page.locator('.account-menu button:has-text("Cancel")').click();
      await page.waitForTimeout(200);
      const signOutAfterCancel = await page.locator('.account-menu button:has-text("Sign out")').isVisible();
      console.log('Sign out after cancel:', signOutAfterCancel);
    }

    // Verify Settings and Profile links
    const settingsHref = await page.evaluate(() => {
      const menu = document.querySelector('.account-menu');
      return menu?.querySelector('a[href="/settings"]')?.getAttribute('href');
    });
    console.log('Settings href:', settingsHref);
    const profileHref = await page.evaluate(() => {
      const menu = document.querySelector('.account-menu');
      return menu?.querySelector('a[href="/profile"]')?.getAttribute('href');
    });
    console.log('Profile href:', profileHref);
  }

  await page.screenshot({path: 'qa-screenshots/account-menu-final.png'});
  console.log('Screenshot saved');

  await browser.close();
})();
