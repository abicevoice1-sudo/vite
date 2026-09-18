const {chromium} = require('playwright');

(async () => {
  const browser = await chromium.launch({args: ['--no-sandbox']});
  const page = await browser.newPage({
    viewport: {width: 390, height: 844},
    isMobile: true,
    hasTouch: true,
  });

  // Simple seed
  await page.goto('http://localhost:5173/', {waitUntil: 'domcontentloaded'});
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    localStorage.setItem('sh_users', JSON.stringify([{
      uid: 's', email: 'a@b.com', displayName: 'AB',
      passwordHash: '$2b$10$WSwf7Trans', isAdmin: false
    }]));
    localStorage.setItem('sh_profiles', JSON.stringify([]));
  });

  // Login page
  await page.goto('http://localhost:5173/auth/login', {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);
  await page.fill('input[type="email"]', 'a@b.com');
  await page.fill('input[type="password"]', 'Test1234!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log('After login URL:', await page.url());

  // Body content
  const body = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
  console.log('Body HTML:', body.substring(0, 300));

  // Check for errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text().substring(0, 150));
  });

  await page.goto('http://localhost:5173/', {waitUntil: 'networkidle'});
  await page.waitForTimeout(1000);

  const header = await page.locator('.landing-header').count();
  console.log('header:', header);
  const avatar = await page.locator('.landing-avatar-btn').count();
  console.log('avatar:', avatar);

  if (errors.length > 0) {
    console.log('Console errors:', errors.length);
    errors.forEach(e => console.log(' -', e));
  }

  await page.screenshot({path: 'qa-screenshots/body-check.png'});
  await browser.close();
})();
