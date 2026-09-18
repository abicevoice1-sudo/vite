const {chromium} = require('playwright');
const fs = require('fs');

(async () => {
  const buf = fs.readFileSync('C:\\Users\\Mitchell\\AppData\\Local\\Temp\\seed.json');
  let text = buf.toString('utf16le');
  text = text.replace(/^\uFEFF/, '');
  const seedData = JSON.parse(text);

  const browser = await chromium.launch({args: ['--no-sandbox']});
  const context = await browser.newContext({
    viewport: {width: 390, height: 844},
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  // Collect console messages
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text().substring(0, 200));
    }
  });

  // Seed + login
  await page.goto('http://localhost:5173/', {waitUntil: 'domcontentloaded'});
  await page.waitForTimeout(300);
  await page.evaluate((data) => {
    localStorage.setItem('sh_users', JSON.stringify(data.sh_users));
    localStorage.setItem('sh_profiles', JSON.stringify(data.sh_profiles));
  }, seedData);

  await page.goto('http://localhost:5173/auth/login', {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);
  await page.fill('input[type="email"]', 'aaliyah@example.com');
  await page.fill('input[type="password"]', 'Test1234!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', {timeout: 10000});
  await page.waitForTimeout(1000);
  console.log('Logged in as aaliyah');

  // Go to home
  await page.goto('http://localhost:5173/', {waitUntil: 'networkidle'});
  await page.waitForTimeout(2000);
  console.log('Home URL:', await page.url());

  // Check what renders
  const body = await page.evaluate(() => document.body.innerHTML.substring(0, 400));
  console.log('Body (first 400):', body.substring(0, 200));

  const header = await page.locator('.landing-header').count();
  console.log('header count:', header);
  const avatar = await page.locator('.landing-avatar-btn').count();
  console.log('avatar count:', avatar);
  const iconGroup = await page.locator('.landing-header-icon-group').count();
  console.log('icon-group count:', iconGroup);

  if (avatar > 0) {
    console.log('Avatar text:', await page.locator('.landing-avatar-btn').textContent());
  }

  // Open account menu if avatar exists
  if (avatar > 0) {
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
    }
  }

  console.log('\nConsole errors:');
  errors.forEach(e => console.log(' -', e));

  await page.screenshot({path: 'qa-screenshots/test-result.png'});
  console.log('\nScreenshot saved');

  await browser.close();
})();
