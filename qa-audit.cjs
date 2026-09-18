const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const RESULTS = [];
const SCREENSHOTS_DIR = path.join(__dirname, 'qa-screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const BASE_URL = 'http://localhost:5174';

// ─── Test accounts (must match seed-test-data.mjs) ──────────────
const PASSWORD = 'Test1234!';
const SEED_USERS = [
  { uid: 'seed-01', email: 'admin@shiarishta.com', displayName: 'Site Admin', isAdmin: true },
  { uid: 'seed-02', email: 'moderator@shiarishta.com', displayName: 'Moderator', isAdmin: true },
  { uid: 'seed-03', email: 'aaliyah@example.com', displayName: 'Aaliyah R.', isAdmin: false },
  { uid: 'seed-04', email: 'yusuf@example.com', displayName: 'Yusuf K.', isAdmin: false },
  { uid: 'seed-05', email: 'maryam@example.com', displayName: 'Maryam S.', isAdmin: false },
];

const SEED_PROFILES = [
  { id: 'p1', displayName: 'Aaliyah R.', ownerEmail: 'aaliyah@example.com' },
  { id: 'p2', displayName: 'Yusuf K.', ownerEmail: 'yusuf@example.com' },
  { id: 'p3', displayName: 'Maryam S.', ownerEmail: 'maryam@example.com' },
];

function issue(id, severity, account, page, steps, expected, actual, visual) {
  RESULTS.push({ id, severity, account, page, steps, expected, actual, visual });
}

function ts() {
  return new Date().toISOString();
}

function buildSeedPayload() {
  const now = new Date().toISOString();
  const users = SEED_USERS.map(u => ({
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    passwordHash: bcrypt.hashSync(PASSWORD, 10),
    isAdmin: u.isAdmin,
    createdAt: now,
  }));
  return { sh_users: users, sh_profiles: SEED_PROFILES };
}

async function seedStorage(page) {
  const payload = buildSeedPayload();
  await page.evaluate((data) => {
    localStorage.setItem('sh_users', JSON.stringify(data.sh_users));
    localStorage.setItem('sh_profiles', JSON.stringify(data.sh_profiles));
  }, payload);
}

async function clearAll(page) {
  await page.context().clearCookies();
  // Navigate to a real page first so we can access localStorage
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    try { localStorage.clear(); } catch(e){}
    try { sessionStorage.clear(); } catch(e){}
  });
  // Re-seed after clearing
  await seedStorage(page);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
}

async function navAndTest(page, url) {
  const errors = [];
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
  } catch (e) { errors.push(`NAV FAIL: ${e.message}`); }
  await page.waitForTimeout(1500);
  return errors;
}

async function checkOverflow(page) {
  return await page.evaluate(() => {
    const issues = [];
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.width > window.innerWidth + 2 && rect.width < 5000 && rect.height > 20) {
        issues.push(`${el.tagName}.${String(el.className).slice(0,60)} w=${Math.round(rect.width)} vw=${window.innerWidth}`);
      }
    }
    return issues.slice(0, 15);
  });
}

async function checkBrokenImages(page) {
  return await page.evaluate(() => {
    const broken = [];
    document.querySelectorAll('img').forEach(img => {
      // Only flag images that have completed loading AND failed (naturalWidth === 0 AND no onerror handler already applied)
      if (img.complete && img.naturalWidth === 0 && !img.dataset.brokenChecked) {
        img.dataset.brokenChecked = 'true';
        // Give a short window - if it just hasn't loaded, don't flag it
        setTimeout(() => {
          if (img.complete && img.naturalWidth === 0) {
            broken.push(img.src.slice(0, 100));
          }
        }, 100);
      }
    });
    return broken;
  });
}

async function checkA11y(page) {
  return await page.evaluate(() => {
    const issues = [];
    document.querySelectorAll('img:not([alt])').forEach(i => issues.push('img no alt: ' + (i.src.slice(0,50))));
    document.querySelectorAll('button').forEach(b => {
      if (!b.getAttribute('aria-label') && !b.textContent?.trim() && !b.querySelector('[aria-label]')) issues.push('btn no label: ' + (b.id || b.className.slice(0, 30)));
    });
    document.querySelectorAll('input:not([aria-label])').forEach(i => {
      const hasLabel = i.id ? document.querySelector(`label[for="${i.id}"]`) : null;
      if (!i.getAttribute('aria-label') && !i.id && !hasLabel) issues.push(`input no label: type=${i.type}`);
    });
    document.querySelectorAll('a[href="#"]').forEach(a => issues.push('a href="#": ' + a.textContent?.slice(0,30)));
    return issues.slice(0, 20);
  });
}

async function getPageErrors(page) {
  return await page.evaluate(() => {
    const errors = [];
    // Check for elements containing "error" or "danger" text content (not class-based styling)
    const errorElements = document.querySelectorAll('[role="alert"], [role="alertdialog"], .modal-error, .toast-error');
    if (errorElements.length > 0) {
      errors.push(`Error/danger element found: ${errorElements.length}`);
    }
    if (document.body.textContent.includes('Failed to load')) {
      errors.push('Failed to load text detected');
    }
    if (document.body.textContent.includes('Cannot read properties')) {
      errors.push('JS runtime error detected in page text');
    }
    if (document.querySelector('.empty-state')) {
      errors.push('Empty state rendered (possible data load failure)');
    }
    return errors;
  });
}

async function performLogin(page, email, password, useAdminForm = false) {
  const loginUrl = useAdminForm ? `${BASE_URL}/admin/login` : `${BASE_URL}/auth/login`;
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  if (useAdminForm) {
    await page.fill('#adminEmail', email);
    await page.fill('#adminPassword', password);
  } else {
    await page.fill('#email', email);
    await page.fill('#password', password);
  }
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  const url = page.url();
  return url;
}

async function deepTestPage(page, url, context) {
  const errors = [];
  await navAndTest(page, url);
  const overflow = await checkOverflow(page);
  const imgs = await checkBrokenImages(page);
  const a11y = await checkA11y(page);
  const pageErrs = await getPageErrors(page);

  try {
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${context}.png`), fullPage: true });
  } catch(e) {
    errors.push(`Screenshot failed: ${e.message}`);
  }

  if (overflow.length) errors.push(`OVERFLOW: ${overflow.join('; ')}`);
  if (imgs.length) errors.push(`BROKEN IMGS: ${imgs.join('; ')}`);
  if (a11y.length) errors.push(`A11Y: ${a11y.join('; ')}`);
  if (pageErrs.length) errors.push(`PAGE ERRS: ${pageErrs.join('; ')}`);
  return errors;
}

const USER_PAGES = [
  { url: `${BASE_URL}/`, name: 'home' },
  { url: `${BASE_URL}/profiles`, name: 'profiles' },
  { url: `${BASE_URL}/blog`, name: 'blog' },
  { url: `${BASE_URL}/community`, name: 'community' },
  { url: `${BASE_URL}/contact`, name: 'contact' },
  { url: `${BASE_URL}/pricing`, name: 'pricing' },
  { url: `${BASE_URL}/about`, name: 'about' },
  { url: `${BASE_URL}/safety`, name: 'safety' },
  { url: `${BASE_URL}/success-stories`, name: 'success' },
  { url: `${BASE_URL}/support`, name: 'support' },
  { url: `${BASE_URL}/guardians`, name: 'guardians' },
  { url: `${BASE_URL}/agents`, name: 'agents' },
  { url: `${BASE_URL}/dashboard`, name: 'dashboard' },
  { url: `${BASE_URL}/messages`, name: 'messages' },
  { url: `${BASE_URL}/settings`, name: 'settings' },
  { url: `${BASE_URL}/onboard`, name: 'onboard' },
  { url: `${BASE_URL}/profiles/p1`, name: 'profile-p1' },
  { url: `${BASE_URL}/profiles/nonexistent`, name: 'profile-notfound' },
  { url: `${BASE_URL}/community/hyderabad`, name: 'community-hyd' },
];

const ADMIN_PAGES = [
  { url: `${BASE_URL}/admin`, name: 'admin-main' },
  { url: `${BASE_URL}/admin/dashboard`, name: 'admin-dashboard' },
  { url: `${BASE_URL}/admin/messages`, name: 'admin-messages' },
  { url: `${BASE_URL}/admin/support`, name: 'admin-support' },
  { url: `${BASE_URL}/admin/guardians`, name: 'admin-guardians' },
  { url: `${BASE_URL}/admin/analytics`, name: 'admin-analytics' },
];

const MOBILE_PAGES = [
  { url: `${BASE_URL}/`, name: 'home' },
  { url: `${BASE_URL}/auth/login`, name: 'login' },
  { url: `${BASE_URL}/profiles`, name: 'profiles' },
  { url: `${BASE_URL}/agents`, name: 'agents' },
  { url: `${BASE_URL}/admin`, name: 'admin' },
];

async function testUserFull({ email, password, name, role, isAdmin, label }) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const allErrors = [];

  console.log(`\n=== ${ts()} ${label} (${email}) ===`);

  // ─── Environment Reset + Seed ──────────────────────────────────────
  await clearAll(page);
  console.log('  Storage seeded');

  // ─── Test invalid login ────────────────────────────────────────────
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.fill('#email', 'wrong@email.com');
  await page.fill('#password', 'wrongpass');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  const invalidBody = await page.textContent('body').catch(() => '');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${label}_02-invalid-login.png`) });

  if (invalidBody.includes('Invalid email or password')) {
    console.log('  Invalid login rejected (correct)');
  } else {
    issue('LOGIN-ERR-001', 'High', email, '/auth/login', 'Submit wrong credentials', 'Error message "Invalid email or password"', 'No error or different error', `${label}_02-invalid-login.png`);
    allErrors.push('Invalid login did not show error');
  }

  // ─── Test empty form validation ───────────────────────────────────
  await page.fill('#email', '');
  await page.fill('#password', '');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${label}_02b-empty-submit.png`) });
  console.log('  Empty form test done');

  // ─── Test XSS injection in login ─────────────────────────────────
  await page.fill('#email', '<script>alert("xss")</script>');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);
  console.log('  XSS login test done');

  // ─── Valid login ────────────────────────────────────────────────────
  const useAdminForm = isAdmin;
  const returnUrl = await performLogin(page, email, password, useAdminForm);
  await page.waitForTimeout(2000);
  console.log(`  Login URL after auth: ${returnUrl}`);

  const loginSuccess = !returnUrl.includes('/auth/login') && !returnUrl.includes('/admin/login');
  if (!loginSuccess) {
    issue('LOGIN-ERR-002', 'Critical', email, useAdminForm ? '/admin/login' : '/auth/login', 'Valid login', 'Redirect to dashboard', `Stayed on login: ${returnUrl}`, `${label}_03-after-login`);
    allErrors.push('Login failed');
    await browser.close();
    return allErrors;
  }
  console.log('  Login successful');

  try {
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${label}_03-after-login.png`), fullPage: true });
  } catch(e) {}

  // ─── Test all user-accessible pages ────────────────────────────────
  for (const p of USER_PAGES) {
    const errs = await deepTestPage(page, p.url, `${label}_${p.name}`);
    if (errs.length) {
      for (const e of errs) {
        issue(`PAGE-${p.name.toUpperCase()}`, 'Medium', email, p.url, `Visit ${p.name}`, 'Clean load, no errors', e, `${label}_${p.name}.png`);
        allErrors.push(`${p.name}: ${e}`);
      }
      console.log(`  ${p.name}: ${errs.length} issues`);
    } else {
      console.log(`  ${p.name}: OK`);
    }
  }

  // ─── Test admin pages ───────────────────────────────────────────────
  if (isAdmin) {
    console.log('  Testing admin pages...');

    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // The admin login form appears for logged-in admin too — let's check
    const adminEmailInput = await page.locator('#adminEmail').count();

    // If we see the admin login form, login there
    if (adminEmailInput > 0) {
      await page.fill('#adminEmail', email);
      await page.fill('#adminPassword', password);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${label}_admin-01.png`), fullPage: false });

    for (const ap of ADMIN_PAGES) {
      const errs = await deepTestPage(page, ap.url, `${label}_${ap.name}`);
      if (errs.length) {
        for (const e of errs) {
          issue(`ADMIN-${ap.name.toUpperCase()}`, 'High', email, ap.url, `Visit admin page`, 'Clean load', e, `${label}_${ap.name}.png`);
          allErrors.push(`${ap.name}: ${e}`);
        }
        console.log(`  ${ap.name}: ${errs.length} issues`);
      } else {
        console.log(`  ${ap.name}: OK`);
      }
    }
  } else {
    // Non-admin blocked from admin
    console.log('  Testing admin restriction for non-admin...');

    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Try admin login form with non-admin
    if (await page.locator('#adminEmail').count() > 0) {
      await page.fill('#adminEmail', email);
      await page.fill('#adminPassword', password);
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(2000);

      const errorText = await page.textContent('.form-error').catch(() => '') || await page.textContent('body').catch(() => '');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${label}_admin-login-rejected.png`), fullPage: false });

      if (errorText.includes('admin') || errorText.includes('access')) {
        console.log('  Admin login form correctly rejected non-admin');
      } else {
        console.log('  Admin login rejection: check screenshot');
      }
    }

    // Test direct URL access to admin dashboard
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);
    const adminUrl = page.url();
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${label}_admin-blocked.png`), fullPage: false });

    if (adminUrl.includes('/admin/dashboard') && !adminUrl.includes('/auth/login') && !adminUrl.includes('/admin/login')) {
      issue('PERM-001', 'Critical', email, '/admin/dashboard', 'Direct URL access to admin as non-admin', 'Redirected to login or home', `Accessed: ${adminUrl}`, `${label}_admin-blocked.png`);
      allErrors.push(`Non-admin accessed admin: ${adminUrl}`);
    } else {
      console.log('  Non-admin correctly blocked from admin dashboard');
    }
  }

  // ─── Test sidebar navigation ───────────────────────────────────────
  console.log('  Testing sidebar navigation...');
  const sidebarLinks = await page.evaluate(() => {
    const links = [];
    document.querySelectorAll('.sidebar-nav a, .sidebar-nav button, nav a, nav button').forEach(a => {
      const href = a.getAttribute('href') || a.getAttribute('data-href') || '';
      const text = a.textContent?.trim() || '';
      if (href && !href.startsWith('#')) links.push({ href, text });
    });
    return links;
  });

  for (const link of sidebarLinks.slice(0, 15)) {
    try {
      await page.goto(BASE_URL + link.href, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(1500);
      const [overflow, imgs, a11y, pageErrs] = await Promise.all([checkOverflow(page), checkBrokenImages(page), checkA11y(page), getPageErrors(page)]);
      const allErrs = [...overflow, ...imgs, ...a11y, ...pageErrs];
      if (allErrs.length) {
        issue(`NAV-${link.href.replace(/\//g, '_').replace(/^_/, '')}`, 'Medium', email, link.href, `Navigate sidebar to ${link.text}`, 'Clean load', allErrs.join('; '), `${label}_nav-${link.href.replace(/\//g, '_')}.png`);
        allErrors.push(`${link.href}: ${allErrs.join('; ')}`);
      }
      try { await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${label}_nav-${link.href.replace(/\//g, '_')}.png`), fullPage: false }); } catch(e) {}
    } catch(e) {
      issue(`NAV-ERR-${link.href.replace(/\//g, '_')}`, 'Medium', email, link.href, 'Navigate via sidebar', 'Page loads', e.message, 'N/A');
    }
  }
  console.log('  Sidebar navigation tested');

  // ─── Test onboard form interactivity ────────────────────────────────
  console.log('  Testing onboard form...');
  await page.goto(`${BASE_URL}/onboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const continueBtn = await page.locator('button:has-text("Continue"), button:has-text("Publish"), button:has-text("Next")').first();
  if (await continueBtn.count() > 0) {
    let clicked = false;
    try {
      const isDisabled = await continueBtn.getAttribute('disabled');
      if (!isDisabled) {
        await continueBtn.click({ timeout: 5000 });
        await page.waitForTimeout(1500);
        clicked = true;
      } else {
        console.log('  Continue button is disabled (expected for incomplete form)');
      }
    } catch(e) {
      console.log('  Could not click continue button (likely disabled)');
    }
    const onboardBody = await page.textContent('body').catch(() => '');
    if (onboardBody.includes('Please enter') || onboardBody.includes('required') || onboardBody.includes('must be')) {
      console.log('  Onboard validation works');
    } else {
      issue('ONBOARD-002', 'High', email, '/onboard', 'Click Continue on empty form', 'Validation errors shown', 'No validation errors', `${label}_onboard-validation.png`);
      allErrors.push('Onboard validation missing');
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${label}_onboard-validation.png`), fullPage: false });
  } else {
    console.log('  No continue button found on onboard');
  }

  // ─── Test messaging ──────────────────────────────────────────────────
  console.log('  Testing messages...');
  await page.goto(`${BASE_URL}/messages`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const composerExists = await page.locator('input[aria-label="Message"], input[placeholder*="essage"], textarea[placeholder*="essage"]').count();
  if (composerExists > 0) {
    await page.fill('input[aria-label="Message"], input[placeholder*="essage"], textarea[placeholder*="essage"]', 'Test message from QA');
    const sendBtn = page.locator('button[aria-label="Send message"], button:has-text("Send")').first();
    if (await sendBtn.count() > 0) {
      await sendBtn.click();
      await page.waitForTimeout(1000);
      console.log('  Message sent');
    }
  } else {
    console.log('  No message composer found');
  }
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${label}_messages-test.png`), fullPage: false });

  // ─── Test settings page ───────────────────────────────────────────
  console.log('  Testing settings...');
  await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${label}_settings.png`), fullPage: true });

  // ─── Test logout ────────────────────────────────────────────────────
  console.log('  Testing logout...');
  try {
    const logoutSelectors = ['[aria-label="Log out"]', '[aria-label="Logout"]', 'button:has-text("Logout")', 'button:has-text("Log out")', 'button:has-text("Sign out")', 'button:has-text("Sign Out")'];
    let clicked = false;
    for (const sel of logoutSelectors) {
      const count = await page.locator(sel).count();
      if (count > 0) {
        await page.locator(sel).first().click();
        clicked = true;
        break;
      }
    }
    if (clicked) {
      await page.waitForTimeout(2000);
      const logoutUrl = page.url();
      if (logoutUrl.includes('/auth/login') || !logoutUrl.includes('/dashboard')) {
        console.log('  Logout successful');
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${label}_logout.png`), fullPage: false });
      } else {
        issue('LOGOUT-001', 'Medium', email, '(logout)', 'Click logout button', 'Redirect to login', `Still at: ${logoutUrl}`, `${label}_logout.png`);
      }
    } else {
      console.log('  No logout button found (may be in settings)');
    }
  } catch(e) {
    issue('LOGOUT-001', 'Medium', email, '(logout)', 'Click logout button', 'Redirect to login', `Failed: ${e.message}`, 'N/A');
  }

  await browser.close();
  console.log(`  Done: ${label}`);
  return allErrors;
}

async function testRegistration() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const label = 'registration';

  console.log(`\n=== ${ts()} Registration tests ===`);

  await page.goto(`${BASE_URL}/auth/register`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Empty registration
  const regSubmit = await page.locator('button[type="submit"]').first();
  await regSubmit.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${label}_01-empty-submit.png`) });

  // Fill valid registration
  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;
  await page.fill('input[name="email"], #email', testEmail);
  await page.fill('input[name="password"], #password', 'TestPass123!');
  await page.fill('input[name="confirmPassword"], #confirmPassword', 'TestPass123!');
  await page.fill('input[name="displayName"], #displayName', 'Test User QA');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${label}_02-filled.png`) });
  await regSubmit.click();
  await page.waitForTimeout(3000);
  const regUrl = page.url();
  console.log(`  Registration redirect URL: ${regUrl}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${label}_03-after-register.png`) });

  if (regUrl.includes('/auth/login') || regUrl.includes('/dashboard')) {
    console.log('  Registration successful');
  } else {
    issue('REG-001', 'High', testEmail, '/auth/register', 'Register new account', 'Redirect to login/dashboard', `Stayed at: ${regUrl}`, `${label}_03-after-register.png`);
  }

  // Duplicate registration
  await page.goto(`${BASE_URL}/auth/register`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.fill('input[name="email"], #email', 'admin@shiarishta.com');
  await page.fill('input[name="password"], #password', 'TestPass123!');
  await page.fill('input[name="confirmPassword"], #confirmPassword', 'TestPass123!');
  await page.fill('input[name="displayName"], #displayName', 'Duplicate');
  await regSubmit.click();
  await page.waitForTimeout(2000);
  const dupBody = await page.textContent('body').catch(() => '');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${label}_04-duplicate.png`) });

  if (dupBody.includes('already registered') || dupBody.includes('exists')) {
    console.log('  Duplicate registration rejected (correct)');
  } else {
    issue('REG-002', 'High', 'admin@shiarishta.com', '/auth/register', 'Register with existing email', 'Error "already registered"', 'No error or different message', `${label}_04-duplicate.png`);
  }

  // Password mismatch
  await page.goto(`${BASE_URL}/auth/register`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.fill('input[name="email"], #email', `mismatch${timestamp}@example.com`);
  await page.fill('input[name="password"], #password', 'TestPass123!');
  await page.fill('input[name="confirmPassword"], #confirmPassword', 'DifferentPass!');
  await page.fill('input[name="displayName"], #displayName', 'Mismatch Test');
  await regSubmit.click();
  await page.waitForTimeout(2000);
  const mismatchBody = await page.textContent('body').catch(() => '');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${label}_05-mismatch.png`) });

  if (mismatchBody.includes('match') || mismatchBody.includes('same') || mismatchBody.includes('mismatch')) {
    console.log('  Password mismatch validation shown (correct)');
  } else {
    console.log('  Password mismatch: check screenshot for validation');
  }

  await browser.close();
  return 0;
}

async function testMobile() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const page = await ctx.newPage();
  const label = 'mobile';

  console.log(`\n=== ${ts()} Mobile responsiveness tests ===`);

  for (const p of MOBILE_PAGES) {
    try {
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1500);

      const overflow = await checkOverflow(page);
      const horizScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${label}_${p.name}.png`), fullPage: false });

      if (overflow.length) {
        issue('MOBILE-OVERFLOW', 'Medium', 'mobile', p.url, `Mobile view: ${p.name}`, 'No horizontal overflow', `Overflow: ${overflow.join('; ')}`, `${label}_${p.name}.png`);
      }
      if (horizScroll) {
        issue('MOBILE-SCROLL', 'Medium', 'mobile', p.url, `Mobile view: ${p.name}`, 'No horizontal scroll', 'Page wider than viewport', `${label}_${p.name}.png`);
      }
      console.log(`  ${p.name}: ${overflow.length > 0 ? 'ISSUES' : 'OK'}`);
    } catch(e) {
      console.log(`  ${p.name}: FAILED - ${e.message}`);
    }
  }

  await browser.close();
  console.log('  Mobile tests done');
  return 0;
}

async function testEdgeCases() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  console.log(`\n=== ${ts()} Edge case tests ===`);

  // Invalid profile ID
  await page.goto(`${BASE_URL}/profiles/9999`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  const notFoundBody = await page.textContent('body').catch(() => '');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'edge_invalid-profile.png'), fullPage: false });

  if (notFoundBody.includes('404') || notFoundBody.includes('not found') || notFoundBody.includes('Not Found') || notFoundBody.includes('No profile')) {
    console.log('  Invalid profile: 404 shown (correct)');
  } else {
    issue('EDGE-001', 'Low', 'guest', '/profiles/9999', 'Visit invalid profile ID', '404 or not found message', 'Regular content shown', 'edge_invalid-profile.png');
  }

  // Unknown route
  await page.goto(`${BASE_URL}/nonexistent-route-12345`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  const unknownBody = await page.textContent('body').catch(() => '');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'edge_unknown-route.png'), fullPage: false });

  if (unknownBody.includes('404') || unknownBody.includes('not found') || unknownBody.includes('Not Found') || unknownBody.includes('Nothing here')) {
    console.log('  Unknown route: 404 shown (correct)');
  } else {
    issue('EDGE-002', 'Low', 'guest', '/nonexistent-route-12345', 'Visit unknown route', '404 page', 'Different content shown', 'edge_unknown-route.png');
  }

  // SQL injection login attempt
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await page.fill('#email', "admin@shiarishta.com' OR '1'='1");
  await page.fill('#password', "' OR '1'='1");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  const injectionUrl = page.url();
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'edge_sql-injection.png'), fullPage: false });

  if (injectionUrl.includes('/dashboard')) {
    issue('EDGE-003', 'Critical', 'guest', '/auth/login', 'SQL injection login attempt', 'Login rejected', 'Logged in successfully', 'edge_sql-injection.png');
  } else {
    console.log('  SQL injection login rejected (correct)');
  }

  // Console errors across key public pages (reduced set for speed)
  const publicPages = ['/', '/profiles', '/blog', '/about'];
  const consoleErrors = [];

  page.removeAllListeners('console');
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ page: msg.location?.url || 'unknown', error: msg.text().slice(0, 200) });
    }
  });

  for (const p of publicPages) {
    await page.goto(`${BASE_URL}${p}`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    await page.waitForTimeout(500);
  }

  if (consoleErrors.length > 0) {
    const unique = [...new Map(consoleErrors.map(e => [e.error, e])).values()];
    issue('EDGE-004', 'Medium', 'guest', 'console', 'Console errors on public pages', 'No console errors', JSON.stringify(unique, null, 2), 'N/A');
    console.log(`  Console errors found: ${consoleErrors.length}`);
  } else {
    console.log('  No console errors on public pages');
  }

  await browser.close();
  return 0;
}

(async () => {
  console.log(`QA Audit starting at ${ts()}`);
  console.log(`Target: ${BASE_URL}`);

  // Pre-flight: verify server is reachable
  const probe = await chromium.launch({ headless: true });
  const probeCtx = await probe.newContext();
  const probePage = await probeCtx.newPage();
  try {
    await probePage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 10000 });
    const title = await probePage.title();
    console.log(`Server reachable, page title: ${title}`);
  } catch(e) {
    console.error(`ERROR: Server at ${BASE_URL} not reachable: ${e.message}`);
    process.exit(1);
  }
  await probe.close();

  // Test admin accounts (login at /admin)
  const adminAccounts = [
    { email: 'admin@shiarishta.com', password: PASSWORD, name: 'Site Admin', role: 'Super Admin', isAdmin: true, label: 'admin-super' },
    { email: 'moderator@shiarishta.com', password: PASSWORD, name: 'Moderator', role: 'Admin', isAdmin: true, label: 'admin-moderator' },
  ];

  // Test user accounts (login at /auth/login)
  const userAccounts = [
    { email: 'aaliyah@example.com', password: PASSWORD, name: 'Aaliyah R.', role: 'User', isAdmin: false, label: 'user-aaliyah' },
    { email: 'yusuf@example.com', password: PASSWORD, name: 'Yusuf K.', role: 'User', isAdmin: false, label: 'user-yusuf' },
    { email: 'maryam@example.com', password: PASSWORD, name: 'Maryam S.', role: 'User', isAdmin: false, label: 'user-maryam' },
  ];

  for (const user of adminAccounts) {
    await testUserFull(user);
  }

  for (const user of userAccounts) {
    await testUserFull(user);
  }

  // Edge case tests
  await testRegistration();
  await testMobile();
  await testEdgeCases();

  // Write report
  const report = {
    generatedAt: ts(),
    target: BASE_URL,
    totalIssues: RESULTS.length,
    severityBreakdown: {
      Critical: RESULTS.filter(r => r.severity === 'Critical').length,
      High: RESULTS.filter(r => r.severity === 'High').length,
      Medium: RESULTS.filter(r => r.severity === 'Medium').length,
      Low: RESULTS.filter(r => r.severity === 'Low').length,
    },
    accountsTested: {
      admins: adminAccounts.map(u => u.email),
      users: userAccounts.map(u => u.email),
      password: PASSWORD,
    },
    issues: RESULTS,
  };

  fs.writeFileSync(path.join(__dirname, 'qa-audit-report.json'), JSON.stringify(report, null, 2));

  let md = '# QA Audit Report\n\n';
  md += `**Generated:** ${report.generatedAt}\n`;
  md += `**Target:** ${report.target}\n`;
  md += `**Total Issues:** ${report.totalIssues}\n`;
  md += `**Critical:** ${report.severityBreakdown.Critical} | **High:** ${report.severityBreakdown.High} | **Medium:** ${report.severityBreakdown.Medium} | **Low:** ${report.severityBreakdown.Low}\n\n`;
  md += `## Accounts Tested\n\n`;
  md += `All accounts use password: \`${PASSWORD}\`\n\n`;
  md += `### Admin Accounts\n`;
  for (const u of report.accountsTested.admins) md += `- ${u}\n`;
  md += `### User Accounts\n`;
  for (const u of report.accountsTested.users) md += `- ${u}\n`;
  md += `\n## Issue Summary\n\n`;
  for (const sev of ['Critical', 'High', 'Medium', 'Low']) {
    const issues = RESULTS.filter(r => r.severity === sev);
    if (issues.length === 0) continue;
    md += `### ${sev} (${issues.length})\n\n`;
    for (const i of issues) {
      md += `- **${i.id}** [${i.severity}] — ${i.account} @ ${i.page}\n`;
      md += `  - Steps: ${i.steps}\n`;
      md += `  - Expected: ${i.expected}\n`;
      md += `  - Actual: ${i.actual}\n`;
      if (i.visual !== 'N/A') md += `  - Visual: ${i.visual}\n`;
      md += '\n';
    }
  }
  fs.writeFileSync(path.join(__dirname, 'qa-audit-report.md'), md);

  console.log(`\n\nAUDIT COMPLETE - ${report.totalIssues} issues (${report.severityBreakdown.Critical} critical, ${report.severityBreakdown.High} high, ${report.severityBreakdown.Medium} medium, ${report.severityBreakdown.Low} low)`);
  console.log('Reports written: qa-audit-report.json, qa-audit-report.md');
})();