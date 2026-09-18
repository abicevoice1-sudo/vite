const {chromium} = require('playwright');

(async () => {
  const browser = await chromium.launch({args: ['--no-sandbox']});
  const page = await browser.newPage({
    viewport: {width: 390, height: 844},
    isMobile: true,
    hasTouch: true,
  });

  // Go to login page
  await page.goto('http://localhost:5173/auth/login', {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);

  // Fill login form
  await page.fill('input[type="email"]', 'ali.khan@gmail.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', {timeout: 10000}).catch(() => console.log('redirect failed'));
  await page.waitForTimeout(1000);

  // Check session after login
  const session = await page.evaluate(() => localStorage.getItem('sh_session'));
  console.log('session after login:', session ? JSON.parse(session) : 'NULL');
  console.log('url:', await page.url());

  // Go home
  await page.goto('http://localhost:5173/', {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);

  // Check what the drawer shows
  const hb = await page.locator('.landing-menu-btn');
  const hv = await hb.isVisible();
  console.log('hamburger visible:', hv);
  if (hv) {
    await hb.click();
    await page.waitForTimeout(500);
    const btns = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.mobile-nav-drawer .btn')).map(b => ({
        text: b.textContent.trim(),
        cls: b.className,
      }))
    );
    console.log('drawer buttons:', JSON.stringify(btns));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }

  // Check header
  const dashBtn = await page.locator('.landing-header-cta.btn-primary').count();
  console.log('dashboard CTA in header:', dashBtn);

  // Check user display in header
  const userDisplay = await page.evaluate(() => {
    const el = document.querySelector('.user-display, .user-name, [aria-label*="account"]');
    return el ? el.textContent.trim() : 'none';
  });
  console.log('user display:', userDisplay);

  await page.screenshot({path: 'qa-screenshots/home-logged-in.png'});
  console.log('screenshot saved');

  await browser.close();
})();
