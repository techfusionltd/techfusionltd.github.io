/**
 * Self-check for the home page (index.html).
 *
 * Verifies the three things the redesign promises:
 *   1. Company name and business registration number are visible on the page.
 *   2. The UI copy is Vietnamese.
 *   3. The project filter and the copy-to-clipboard button still work.
 *
 * Run: node tests/homepage-check.js
 * Needs a local Chrome/Chromium binary; skips (exit 0) when none is found.
 */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
];

const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const PRIVACY_PAGE = 'file://' + path.resolve(__dirname, '..', 'privacy', 'index.html');
const PORT = 9333 + (process.pid % 500);
const PROFILE = path.join(require('node:os').tmpdir(), 'tf-homepage-check-' + process.pid);

const sleep = ms => new Promise(r => setTimeout(r, ms));

function findChrome() {
  return CHROME_CANDIDATES.find(p => fs.existsSync(p)) || null;
}

async function waitForTarget() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await res.json();
      const page = list.find(t => t.type === 'page' && t.url.startsWith('file://'));
      if (page) return page;
    } catch {
      // Chrome not up yet
    }
    await sleep(250);
  }
  throw new Error('Chrome page target never became available');
}

const failures = [];

function check(name, condition, detail) {
  if (condition) {
    console.log(`  ok  ${name}`);
  } else {
    failures.push(name);
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

(async () => {
  const chromePath = findChrome();
  if (!chromePath) {
    console.log('skip: no Chrome/Chromium binary found');
    process.exit(0);
  }

  const chrome = spawn(chromePath, [
    '--headless',
    '--disable-gpu',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${PROFILE}`,
    PAGE,
  ], { stdio: 'ignore' });

  let ws;
  try {
    const target = await waitForTarget();
    ws = new WebSocket(target.webSocketDebuggerUrl);

    let id = 0;
    const pending = new Map();
    const consoleErrors = [];

    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    });

    ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg);
        pending.delete(msg.id);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        consoleErrors.push(msg.params.exceptionDetails.text);
      }
    });

    const send = (method, params = {}) => new Promise(resolve => {
      const mid = ++id;
      pending.set(mid, resolve);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });

    const evaluate = async expression => {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r.result?.exceptionDetails) {
        throw new Error(r.result.exceptionDetails.text);
      }
      return r.result?.result?.value;
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await sleep(600);

    console.log('home page checks:');

    // --- Company identity is visible -------------------------------------
    const heroTitle = await evaluate(`document.querySelector('.hero-title').textContent.trim()`);
    check('hero shows the Vietnamese company name', heroTitle === 'Công ty TNHH Techfusion', `got "${heroTitle}"`);

    const businessNumber = await evaluate(`document.querySelector('.company-field-mono').textContent.trim()`);
    check('hero shows the business registration number', businessNumber === '1001261052', `got "${businessNumber}"`);

    const legalName = await evaluate(`document.querySelector('.company-field dd').textContent.trim()`);
    check('company card lists the legal name', legalName === 'Công ty TNHH Techfusion', `got "${legalName}"`);

    // --- Copy is Vietnamese ----------------------------------------------
    const lang = await evaluate(`document.documentElement.lang`);
    check('document language is Vietnamese', lang === 'vi', `got "${lang}"`);

    const navLabels = await evaluate(`[...document.querySelectorAll('.nav-link')].map(a => a.textContent.trim()).join('|')`);
    check('navigation is Vietnamese', navLabels === 'Trang chủ|Dự án|Dịch vụ|Liên hệ', `got "${navLabels}"`);

    const sectionTitles = await evaluate(`[...document.querySelectorAll('.section-title')].map(h => h.textContent.trim()).join('|')`);
    check('section headings are Vietnamese', sectionTitles.includes('Dự án nổi bật'), `got "${sectionTitles}"`);

    // --- No generic privacy content on the home page ----------------------
    // Each app links to its own policy page; the home page itself must not
    // advertise privacy policies or principles.
    const privacyOnHome = await evaluate(`(() => {
      const body = document.body.textContent;
      const nav = [...document.querySelectorAll('.nav-link')].map(a => a.textContent).join(' ');
      return {
        hasPrinciplesSection: !!document.getElementById('principles'),
        hasPrinciplesHeading: body.includes('Nguyên tắc về quyền riêng tư'),
        navMentionsPrivacy: /bảo mật|quyền riêng tư/i.test(nav),
        hasPrivacyPoliciesColumn: [...document.querySelectorAll('.footer-heading')].some(h => /bảo mật/i.test(h.textContent)),
        hasStatsPrivacyLabel: [...document.querySelectorAll('.stat-label')].some(s => /bảo mật|quyền riêng tư/i.test(s.textContent)),
      };
    })()`);
    check('home page has no privacy principles section', !privacyOnHome.hasPrinciplesSection && !privacyOnHome.hasPrinciplesHeading, JSON.stringify(privacyOnHome));
    check('navigation does not mention privacy', !privacyOnHome.navMentionsPrivacy, JSON.stringify(privacyOnHome));
    check('footer has no privacy policies column', !privacyOnHome.hasPrivacyPoliciesColumn, JSON.stringify(privacyOnHome));
    check('stats do not mention privacy', !privacyOnHome.hasStatsPrivacyLabel, JSON.stringify(privacyOnHome));

    // Each app keeps its own policy reference (the not-yet-released
    // placeholder card has none).
    const appPolicyRefs = await evaluate(`(() => {
      const cards = [...document.querySelectorAll('#apps .app-card')].filter(c => c.checkVisibility());
      const published = cards.filter(c => !c.classList.contains('project-card-upcoming'));
      return {
        published: published.length,
        withPolicyLink: published.filter(c => c.querySelector('a[href*="privacy/"]')).length,
      };
    })()`);
    check('each published project links to its own policy page', appPolicyRefs.published === appPolicyRefs.withPolicyLink, JSON.stringify(appPolicyRefs));

    // --- Store badges match each app's real availability ------------------
    const storeBadges = await evaluate(`(() => {
      const card = title => {
        const h = [...document.querySelectorAll('#apps .app-title')].find(x => x.textContent.includes(title));
        return h ? h.closest('.app-card') : null;
      };
      const links = c => c ? [...c.querySelectorAll('a[href*="play.google.com"], a[href*="apps.apple.com"]')].map(a => a.href) : [];
      const tags = c => c ? [...c.querySelectorAll('.app-tags .tag')].map(t => t.textContent.trim()) : [];
      const sim = card('Simulated AI Calls');
      const muc = card('Mực Thước');
      return {
        simLinks: links(sim),
        simTags: tags(sim),
        mucLinks: links(muc),
        mucTags: tags(muc),
      };
    })()`);
    check('Simulated AI Calls links to Google Play', storeBadges.simLinks.some(h => h.includes('play.google.com') && h.includes('dev.techfusion.funnyprankcalls')), JSON.stringify(storeBadges));
    check('Simulated AI Calls has no App Store link', !storeBadges.simLinks.some(h => h.includes('apps.apple.com')), JSON.stringify(storeBadges));
    check('Simulated AI Calls is tagged Android only', storeBadges.simTags.includes('Android') && !storeBadges.simTags.includes('iOS'), JSON.stringify(storeBadges.simTags));
    check('Mực Thước links to both stores', storeBadges.mucLinks.some(h => h.includes('play.google.com')) && storeBadges.mucLinks.some(h => h.includes('apps.apple.com')), JSON.stringify(storeBadges.mucLinks));

    // --- Custom software services section ---------------------------------
    const services = await evaluate(`(() => {
      const section = document.getElementById('services');
      if (!section) return { found: false };
      const links = [...section.querySelectorAll('a')].map(a => a.getAttribute('href'));
      return {
        found: true,
        title: section.querySelector('.section-title')?.textContent.trim(),
        cards: section.querySelectorAll('.service-card').length,
        hasEnglishLabel: !!section.querySelector('.bilingual-label'),
        linksVi: links.includes('services/'),
        linksEn: links.includes('services/en.html'),
        linksMail: links.some(h => h.startsWith('mailto:support@techfusion.dev')),
      };
    })()`);
    check('home page has a services section', services.found, JSON.stringify(services));
    check('services section is titled in Vietnamese', services.title === 'Dịch vụ phát triển phần mềm theo yêu cầu', JSON.stringify(services));
    check('services section lists the four offerings', services.cards === 4, `got ${services.cards}`);
    check('services section names the service in English too', services.hasEnglishLabel, JSON.stringify(services));
    check('services section links to both VI and EN pages', services.linksVi && services.linksEn, JSON.stringify(services));
    check('services section has a contact action', services.linksMail, JSON.stringify(services));

    // --- Project filter still works ---------------------------------------
    const filtered = await evaluate(`(() => {
      const input = document.getElementById('app-search');
      input.value = 'mực';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const cards = [...document.querySelectorAll('.app-card[data-app-keywords]')];
      const visible = cards.filter(c => c.style.display !== 'none');
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return { total: cards.length, visible: visible.length, name: visible[0]?.querySelector('.app-title')?.textContent.trim() };
    })()`);
    check('all projects are listed', filtered.total === 4, `got ${filtered.total}`);
    check('filter matches the Vietnamese keyword "mực"', filtered.visible === 1 && filtered.name.startsWith('Mực Thước'), JSON.stringify(filtered));

    // --- HabitHero is hidden for now (not published yet) ------------------
    const hidden = await evaluate(`(() => {
      const card = document.querySelector('.app-card[data-app-keywords*="habithero"]');
      const footerLinks = [...document.querySelectorAll('.site-footer a[href*="habit-hero"]')];
      return {
        cardExists: !!card,
        cardVisible: card ? card.checkVisibility() : false,
        footerLinks: footerLinks.length,
        footerLinksVisible: footerLinks.filter(a => a.checkVisibility()).length,
      };
    })()`);
    check('HabitHero card is hidden on the home page', hidden.cardExists && !hidden.cardVisible, JSON.stringify(hidden));
    check('HabitHero footer links are hidden', hidden.footerLinks > 0 && hidden.footerLinksVisible === 0, JSON.stringify(hidden));

    // --- Copy-to-clipboard still works ------------------------------------
    const copy = await evaluate(`(async () => {
      const btn = document.querySelector('.company-field .copy-badge-btn');
      let copied = null;
      navigator.clipboard.writeText = async text => { copied = text; };
      btn.click();
      await new Promise(r => setTimeout(r, 150));
      return { copied, label: btn.querySelector('.copy-tooltip')?.textContent };
    })()`);
    check('copy button copies the business number', copy.copied === '1001261052', JSON.stringify(copy));
    check('copy feedback is Vietnamese', copy.label === 'Đã sao chép!', JSON.stringify(copy));

    // --- No runtime errors ------------------------------------------------
    check('no uncaught JavaScript errors', consoleErrors.length === 0, consoleErrors.join('; '));

    // --- Mobile layout (390px) --------------------------------------------
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await sleep(300);

    const mobile = await evaluate(`(() => {
      const hero = getComputedStyle(document.querySelector('.hero-split')).gridTemplateColumns;
      return {
        heroColumns: hero.split(' ').length,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    })()`);
    check('hero stacks into one column on mobile', mobile.heroColumns === 1, `got ${mobile.heroColumns} column(s)`);
    check('no horizontal overflow on mobile', mobile.overflow <= 0, `overflows by ${mobile.overflow}px`);

    await send('Emulation.clearDeviceMetricsOverride');
    await sleep(200);

    // --- Privacy directory page -------------------------------------------
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send('Page.navigate', { url: PRIVACY_PAGE });
    await sleep(1200);

    const privacy = await evaluate(`(() => ({
      lang: document.documentElement.lang,
      title: document.querySelector('.policy-title')?.textContent.trim(),
      hasCompanyNumber: document.body.textContent.includes('1001261052'),
      hasVietnameseName: document.body.textContent.includes('Công ty TNHH Techfusion'),
      cards: document.querySelectorAll('.app-card[data-app-keywords]').length,
      visibleCards: [...document.querySelectorAll('.app-card[data-app-keywords]')].filter(c => c.checkVisibility()).length,
      habitHeroVisible: (document.querySelector('.app-card[data-app-keywords*="habithero"]')?.checkVisibility()) ?? false,
      nav: [...document.querySelectorAll('.nav-link')].map(a => a.textContent.trim()).join('|'),
    }))()`);
    check('privacy directory is in Vietnamese', privacy.lang === 'vi' && privacy.title === 'Danh mục chính sách quyền riêng tư', JSON.stringify(privacy));
    check('privacy directory shows the business number', privacy.hasCompanyNumber);
    check('privacy directory uses the Vietnamese legal name', privacy.hasVietnameseName);
    check('privacy directory lists the apps', privacy.cards === 3, `got ${privacy.cards}`);
    check('privacy directory shows 2 published apps', privacy.visibleCards === 2, `got ${privacy.visibleCards}`);
    check('HabitHero card is hidden in the privacy directory', !privacy.habitHeroVisible, JSON.stringify(privacy));
    check('privacy directory nav is Vietnamese', privacy.nav === 'Trang chủ|Danh mục ứng dụng|Hỗ trợ', `got "${privacy.nav}"`);

    // The home page and the privacy directory both use the 3-column footer.
    const footerCols = await evaluate(`getComputedStyle(document.querySelector('.footer-inner')).gridTemplateColumns.split(' ').length`);
    check('privacy directory keeps a 3-column footer', footerCols === 3, `got ${footerCols}`);

    await send('Page.navigate', { url: PAGE });
    await sleep(1200);
    const homeFooterCols = await evaluate(`getComputedStyle(document.querySelector('.footer-inner')).gridTemplateColumns.split(' ').length`);
    check('home page uses a 3-column footer', homeFooterCols === 3, `got ${homeFooterCols}`);
  } finally {
    if (ws) ws.close();
    chrome.kill();
    // Chrome may still be flushing its profile directory, so give it a moment
    // and treat cleanup as best-effort.
    await sleep(300);
    try {
      fs.rmSync(PROFILE, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {
      // Leftover temp profile is harmless.
    }
  }

  if (failures.length) {
    console.error(`\n${failures.length} check(s) failed`);
    process.exit(1);
  }
  console.log('\nall checks passed');
  process.exit(0);
})().catch(err => {
  console.error('FAIL', err);
  process.exit(1);
});
