const {chromium} = require('playwright');
const fs = require('fs');

(async () => {
  // Read seed data from the seed script output
  const seedData = {
    sh_users: [
      {uid:"seed-01",email:"admin@shiarishta.com",displayName:"Site Admin",passwordHash:"$2b$10$KRP1lOaT3ot1hgMwiLeATueQwTmK/GszZY9z0MZLMzNkK4zcyOMoi",isAdmin:true,createdAt:"2026-09-17T19:56:40.499Z"},
      {uid:"seed-02",email:"moderator@shiarishta.com",displayName:"Moderator",passwordHash:"$2b$10$h6mOxOdZm38EJ2xZsoMCKez4utxN8DJ9pjCcQU61S5ffo4UgHtfd6",isAdmin:true,createdAt:"2026-09-17T19:56:40.701Z"},
      {uid:"seed-03",email:"aaliyah@example.com",displayName:"Aaliyah R.",passwordHash:"$2b$10$WFck/nxLqP2hl76rVs6OpuE2qCJr2YdMueSrl1tsAbMaiXYoFSv.S",isAdmin:false,createdAt:"2026-09-17T19:56:40.891Z"},
      {uid:"seed-04",email:"yusuf@example.com",displayName:"Yusuf K.",passwordHash:"$2b$10$U10XhdhdrOb1rXt6dRGXCOdnUuw4BiaZ/4welFp801d7cc/3MQpnu",isAdmin:false,createdAt:"2026-09-17T19:56:41.077Z"},
      {uid:"seed-05",email:"maryam@example.com",displayName:"Maryam S.",passwordHash:"$2b$10$8f5YSgqquY0Vah6UG/J5veWfaKVf/eZOJLVMy7Ms74n8W7PEr2uX6",isAdmin:false,createdAt:"2026-09-17T19:56:41.224Z"}
    ],
    sh_profiles: [
      {id:"p1",displayName:"Aaliyah R.",ownerEmail:"aaliyah@example.com"},
      {id:"p2",displayName:"Yusuf K.",ownerEmail:"yusuf@example.com"},
      {id:"p3",displayName:"Maryam S.",ownerEmail:"maryam@example.com"}
    ]
  };

  const browser = await chromium.launch({args: ['--no-sandbox']});
  const page = await browser.newPage({
    viewport: {width: 390, height: 844},
    isMobile: true,
    hasTouch: true,
  });

  // Navigate to initialize localStorage
  await page.goto('http://localhost:5173/', {waitUntil: 'domcontentloaded'});
  await page.waitForTimeout(500);

  // Seed data into localStorage
  await page.evaluate((data) => {
    localStorage.setItem('sh_users', JSON.stringify(data.sh_users));
    localStorage.setItem('sh_profiles', JSON.stringify(data.sh_profiles));
    console.log('Seeded', data.sh_users.length, 'users and', data.sh_profiles.length, 'profiles');
  }, seedData);

  // Verify
  const userCount = await page.evaluate(() => JSON.parse(localStorage.getItem('sh_users') || '[]').length);
  console.log('Verified users in localStorage:', userCount);

  // Navigate to login
  await page.goto('http://localhost:5173/auth/login', {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);

  // Login as aaliyah
  await page.fill('input[type="email"]', 'aaliyah@example.com');
  await page.fill('input[type="password"]', 'Test1234!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  console.log('URL after login:', await page.url());
  const session = await page.evaluate(() => localStorage.getItem('sh_session'));
  console.log('Session email:', session ? JSON.parse(session).email : 'null');

  // Go to home
  await page.goto('http://localhost:5173/', {waitUntil: 'networkidle'});
  await page.waitForTimeout(500);

  // Check avatar
  const avatar = await page.locator('.landing-avatar-btn');
  const avatarCount = await avatar.count();
  console.log('Avatar count:', avatarCount);
  if (avatarCount > 0) {
    console.log('Avatar text:', await avatar.textContent());
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

    // Test sign out confirmation flow
    const signOutBtn = await page.locator('.account-menu button:has-text("Sign out")').isVisible();
    console.log('Sign out button visible:', signOutBtn);
    if (signOutBtn) {
      await page.locator('.account-menu button:has-text("Sign out")').click();
      await page.waitForTimeout(300);
      const confirmVisible = await page.locator('.account-menu button:has-text("Yes, sign out")').isVisible();
      console.log('Confirmation visible:', confirmVisible);
      await page.locator('.account-menu button:has-text("Cancel")').click();
      await page.waitForTimeout(200);
      const signOutAfterCancel = await page.locator('.account-menu button:has-text("Sign out")').isVisible();
      console.log('Sign out after cancel:', signOutAfterCancel);
    }

    // Check Settings link
    const settingsHref = await page.evaluate(() => {
      const menu = document.querySelector('.account-menu');
      const link = menu?.querySelector('a[href="/settings"]');
      return link ? link.getAttribute('href') : 'not found';
    });
    console.log('Settings link href:', settingsHref);

    // Check Profile link
    const profileHref = await page.evaluate(() => {
      const menu = document.querySelector('.account-menu');
      const link = menu?.querySelector('a[href="/profile"]');
      return link ? link.getAttribute('href') : 'not found';
    });
    console.log('Profile link href:', profileHref);
  }

  await page.screenshot({path: 'qa-screenshots/account-menu-complete.png'});
  console.log('Screenshot saved');

  await browser.close();
})();
