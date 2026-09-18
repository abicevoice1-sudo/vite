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

  // Check avatar button
  const avatarBtn = await page.locator('.landing-avatar-btn').isVisible();
  console.log('avatar button visible:', avatarBtn);
  const avatarCount = await page.locator('.landing-avatar-btn').count();
  console.log('avatar button count:', avatarCount);
  const avatarText = await page.locator('.landing-avatar-btn').textContent();
  console.log('avatar text:', avatarText);

  // Check icon group
  const iconGroup = await page.locator('.landing-header-icon-group').isVisible();
  console.log('icon group visible:', iconGroup);
  const iconGroupCount = await page.locator('.landing-header-icon-group').count();
  console.log('icon group count:', iconGroupCount);

  // Check all children of header
  const headerChildren = await page.evaluate(() => {
    const header = document.querySelector('.landing-header');
    if (!header) return 'no header element';
    return Array.from(header.children).map(el => ({
      tag: el.tagName,
      cls: el.className,
      text: el.textContent?.trim().substring(0, 50) || '',
      visible: el.offsetParent !== null,
    }));
  });
  console.log('header children:', JSON.stringify(headerChildren, null, 2));

  // Check what's inside icon group
  const iconGroupChildren = await page.evaluate(() => {
    const group = document.querySelector('.landing-header-icon-group');
    if (!group) return 'no icon group';
    return Array.from(group.children).map(el => ({
      tag: el.tagName,
      cls: el.className,
      text: el.textContent?.trim() || '',
      visible: el.offsetParent !== null,
    }));
  });
  console.log('icon group children:', JSON.stringify(iconGroupChildren, null, 2));

  await page.screenshot({path: 'qa-screenshots/home-header-logged-in.png'});
  console.log('screenshot saved');

  await browser.close();
})();
