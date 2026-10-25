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
    check('hero shows the company name', heroTitle === 'Techfusion Ltd', `got "${heroTitle}"`);

    const businessNumber = await evaluate(`document.querySelector('.company-field-mono').textContent.trim()`);
    check('hero shows the business registration number', businessNumber === '1001261052', `got "${businessNumber}"`);

    // --- Copy is Vietnamese ----------------------------------------------
    const lang = await evaluate(`document.documentElement.lang`);
    check('document language is Vietnamese', lang === 'vi', `got "${lang}"`);

    const navLabels = await evaluate(`[...document.querySelectorAll('.nav-link')].map(a => a.textContent.trim()).join('|')`);
    check('navigation is Vietnamese', navLabels === 'Trang chủ|Dự án|Chính sách bảo mật|Nguyên tắc bảo mật|Liên hệ', `got "${navLabels}"`);

    const sectionTitles = await evaluate(`[...document.querySelectorAll('.section-title')].map(h => h.textContent.trim()).join('|')`);
    check('section headings are Vietnamese', sectionTitles.includes('Dự án nổi bật'), `got "${sectionTitles}"`);

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
      cards: document.querySelectorAll('.app-card[data-app-keywords]').length,
      nav: [...document.querySelectorAll('.nav-link')].map(a => a.textContent.trim()).join('|'),
    }))()`);
    check('privacy directory is in Vietnamese', privacy.lang === 'vi' && privacy.title === 'Danh mục chính sách quyền riêng tư', JSON.stringify(privacy));
    check('privacy directory shows the business number', privacy.hasCompanyNumber);
    check('privacy directory lists the apps', privacy.cards === 3, `got ${privacy.cards}`);
    check('privacy directory nav is Vietnamese', privacy.nav === 'Trang chủ|Danh mục ứng dụng|Hỗ trợ', `got "${privacy.nav}"`);

    // The privacy page keeps the 3-column footer, the home page uses 4.
    const footerCols = await evaluate(`getComputedStyle(document.querySelector('.footer-inner')).gridTemplateColumns.split(' ').length`);
    check('privacy directory keeps a 3-column footer', footerCols === 3, `got ${footerCols}`);

    await send('Page.navigate', { url: PAGE });
    await sleep(1200);
    const homeFooterCols = await evaluate(`getComputedStyle(document.querySelector('.footer-inner')).gridTemplateColumns.split(' ').length`);
    check('home page uses a 4-column footer', homeFooterCols === 4, `got ${homeFooterCols}`);
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
