/**
 * Home page bilingual UI (vi / en).
 * The displayed language is chosen from the browser locale once, on load —
 * there is no visible language toggle. Every translatable element carries
 * data-i18n="key"; the Vietnamese text is the server-rendered default, so the
 * page degrades gracefully without JS.
 *
 * The actual string map lives in data-i18n.js as window.TF_I18N_DICT and is
 * loaded before this file.
 */
(function () {
  function pickLang() {
    const userLangs = navigator.languages || [navigator.language || navigator.userLanguage || 'en'];
    // Chinese readers get English, since only vi/en are provided here.
    for (const raw of userLangs) {
      const l = (raw || '').toLowerCase();
      if (l.startsWith('vi')) return 'vi';
    }
    return 'en';
  }

  function apply(lang) {
    const dict = (window.TF_I18N_DICT && window.TF_I18N_DICT[lang]) || {};

    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const v = dict[el.dataset.i18n];
      if (v) el.textContent = v;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const v = dict[el.dataset.i18nPlaceholder];
      if (v) el.setAttribute('placeholder', v);
    });

    if (dict.pageTitle !== undefined) document.title = dict.pageTitle;
    const descEl = document.querySelector('meta[name="description"]');
    if (descEl && dict.pageDescription !== undefined) descEl.setAttribute('content', dict.pageDescription);
  }

  function pickLang() {
    const userLangs = navigator.languages || [navigator.language || navigator.userLanguage || 'en'];
    // Chinese readers get English, since only vi/en are provided here.
    for (const raw of userLangs) {
      const l = (raw || '').toLowerCase();
      if (l.startsWith('vi')) return 'vi';
    }
    return 'en';
  }

  // Exposed for tests and integration use; no visible toggle on the page.
  window.TF_I18N = { apply, pickLang };

  document.addEventListener('DOMContentLoaded', () => apply(pickLang()), { once: true });
})();