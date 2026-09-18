const {chromium} = require('playwright');

(async () => {
  const browser = await chromium.launch({args: ['--no-sandbox']});
  const page = await browser.newPage({
    viewport: {width: 390, height: 844},
    isMobile: true,
    hasTouch: true,
  });

  // Seed a simple user
  await page.goto('http://localhost:5173/', {waitUntil: 'domcontentloaded'});
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    localStorage.setItem('sh_users', JSON.stringify([{
      uid: 'test',
      email: 'test@test.com',
      displayName: 'Test User',
      passwordHash: '$2b$10$WSwf7 Transformations',
      isAdmin: false,
    }]));
    localStorage.setItem('sh_profiles', JSON.stringify([]));
  });

  // Login
  await page.goto('http://localhost:5173/auth/login', {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);
  await page.fill('input[type="email"]', 'test@test.com');
  await page.fill('input[type="password"]', 'Test1234!');
  await page.click('button[type="submit"]');
  try {
    await page.waitForURL('**/dashboard', {timeout: 10000});
    console.log('Redirected to dashboard');
  } catch (e) {
    console.log('Dashboard redirect failed, current URL:', await page.url());
  }
  await page.waitForTimeout(1000);

  // Go to home
  await page.goto('http://localhost:5173/', {waitUntil: 'networkidle'});
  await page.waitForTimeout(1000);

  // Check what renders
  const header = await page.locator('.landing-header').count();
  console.log('header count:', header);
  const iconGroup = await page.locator('.landing-header-icon-group').count();
  console.log('icon-group count:', iconGroup);
  const avatar = await page.locator('.landing-avatar-btn').count();
  console.log('avatar count:', avatar);

  if (avatar === 0) {
    // Get header HTML for debugging
    const headerHtml = await page.evaluate(() => {
      const h = document.querySelector('.landing-header');
      return h ? h.innerHTML.substring(0, 600) : 'no header element';
    });
    console.log('header HTML:', headerHtml);
  }

  await page.screenshot({path: 'qa-screenshots/header-debug.png'});
  console.log('screenshot saved');

  await browser.close();
})();
