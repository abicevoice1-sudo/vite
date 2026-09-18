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

  // Collect all console messages
  const messages = [];
  page.on('console', msg => {
    messages.push({type: msg.type(), text: msg.text().substring(0, 200)});
  });

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

  await page.goto('http://localhost:5173/', {waitUntil: 'networkidle'});
  await page.waitForTimeout(2000);

  console.log('URL:', await page.url());
  console.log('Title:', await page.title());

  const body = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
  console.log('Body (first 500):', body);

  const rootInner = await page.evaluate(() => document.getElementById('root')?.innerHTML.substring(0, 500) || 'no root');
  console.log('Root inner:', rootInner);

  const header = await page.locator('.landing-header').count();
  console.log('header:', header);

  // Check all classes on body
  const bodyClasses = await page.evaluate(() => document.body.className);
  console.log('body classes:', bodyClasses);

  // Check root children
  const rootChildren = await page.evaluate(() => {
    const root = document.getElementById('root');
    if (!root) return 'no root';
    return Array.from(root.children).map(el => ({
      tag: el.tagName,
      className: el.className.substring(0, 100),
    }));
  });
  console.log('root children:', JSON.stringify(rootChildren, null, 2));

  console.log('\nConsole messages:');
  messages.forEach(m => console.log(' [' + m.type + ']', m.text));

  await page.screenshot({path: 'qa-screenshots/debug-root.png'});
  console.log('Screenshot saved');

  await browser.close();
})();
