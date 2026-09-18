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

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text().substring(0, 200));
    }
  });

  // Seed
  await page.goto('http://localhost:5173/', {waitUntil: 'domcontentloaded'});
  await page.waitForTimeout(300);
  await page.evaluate((data) => {
    localStorage.setItem('sh_users', JSON.stringify(data.sh_users));
    localStorage.setItem('sh_profiles', JSON.stringify(data.sh_profiles));
  }, seedData);

  // Login
  await page.goto('http://localhost:5173/auth/login', {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);
  await page.fill('input[type="email"]', 'aaliyah@example.com');
  await page.fill('input[type="password"]', 'Test1234!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', {timeout: 10000});
  await page.waitForTimeout(1000);
  console.log('Logged in');

  // Go home
  await page.goto('http://localhost:5173/', {waitUntil: 'networkidle'});
  await page.waitForTimeout(2000);
  console.log('Home URL:', await page.url());

  // Check body
  const body = await page.evaluate(() => document.body.innerHTML.substring(0, 300));
  console.log('Body:', body.substring(0, 200));

  const header = await page.locator('.landing-header').count();
  console.log('header:', header);
  const avatar = await page.locator('.landing-avatar-btn').count();
  console.log('avatar:', avatar);

  // Check for @fs/ errors
  const fsErrors = errors.filter(e => e.includes('@fs/') || e.includes('500'));
  console.log('@fs/ errors:', fsErrors.length);
  fsErrors.slice(0, 3).forEach(e => console.log(' -', e));

  await page.screenshot({path: 'qa-screenshots/final-body.png'});
  console.log('Screenshot saved');

  await browser.close();
})();
