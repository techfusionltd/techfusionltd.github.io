/**
 * TechFusion Web & Privacy Portal JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLanguageSwitcher();
  initCopyButtons();
  initTableOfContents();
  initAppSearch();
});

/* Theme Handling (Dark / Light) */
function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  const storedTheme = localStorage.getItem('tf_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const currentTheme = storedTheme || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcon(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('tf_theme', newTheme);
      updateThemeIcon(newTheme);
    });
  }
}

function updateThemeIcon(theme) {
  const sunIcon = document.getElementById('sun-icon');
  const moonIcon = document.getElementById('moon-icon');
  if (sunIcon && moonIcon) {
    if (theme === 'dark') {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    } else {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    }
  }
}

/* Bilingual Language Switcher (EN / VI) */
function initLanguageSwitcher() {
  const langButtons = document.querySelectorAll('[data-lang-target]');
  const enSections = document.querySelectorAll('.lang-section-en');
  const viSections = document.querySelectorAll('.lang-section-vi');
  const tocEn = document.getElementById('toc-en');
  const tocVi = document.getElementById('toc-vi');

  if (!langButtons.length) return;

  function switchLang(lang) {
    localStorage.setItem('tf_policy_lang', lang);
    langButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.langTarget === lang);
    });

    if (lang === 'vi') {
      enSections.forEach(el => el.classList.add('hidden'));
      viSections.forEach(el => el.classList.remove('hidden'));
      if (tocEn) tocEn.classList.add('hidden');
      if (tocVi) tocVi.classList.remove('hidden');
    } else if (lang === 'all') {
      enSections.forEach(el => el.classList.remove('hidden'));
      viSections.forEach(el => el.classList.remove('hidden'));
      if (tocEn) tocEn.classList.remove('hidden');
      if (tocVi) tocVi.classList.remove('hidden');
    } else {
      enSections.forEach(el => el.classList.remove('hidden'));
      viSections.forEach(el => el.classList.add('hidden'));
      if (tocEn) tocEn.classList.remove('hidden');
      if (tocVi) tocVi.classList.add('hidden');
    }
  }

  langButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetLang = btn.dataset.langTarget;
      switchLang(targetLang);
    });
  });

  // Load preferred or default language
  const savedLang = localStorage.getItem('tf_policy_lang') || 'en';
  switchLang(savedLang);
}

/* Copy to Clipboard Functionality */
function initCopyButtons() {
  const copyButtons = document.querySelectorAll('[data-copy-text]');
  
  copyButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const textToCopy = btn.dataset.copyText;
      try {
        await navigator.clipboard.writeText(textToCopy);
        const originalTitle = btn.getAttribute('title') || '';
        btn.setAttribute('title', 'Copied!');
        
        // Visual feedback
        btn.classList.add('copied');
        const feedbackBadge = document.createElement('span');
        feedbackBadge.className = 'copy-tooltip';
        feedbackBadge.innerText = 'Copied!';
        btn.appendChild(feedbackBadge);

        setTimeout(() => {
          btn.setAttribute('title', originalTitle);
          btn.classList.remove('copied');
          if (feedbackBadge.parentNode) {
            feedbackBadge.parentNode.removeChild(feedbackBadge);
          }
        }, 1500);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    });
  });
}

/* ScrollSpy for Table of Contents */
function initTableOfContents() {
  const sections = document.querySelectorAll('.policy-section[id]');
  const tocLinks = document.querySelectorAll('.toc-link');

  if (!sections.length || !tocLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        tocLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, {
    rootMargin: '-20% 0px -70% 0px'
  });

  sections.forEach(section => observer.observe(section));
}

/* Client-side App Search/Filter (For portfolio home page) */
function initAppSearch() {
  const searchInput = document.getElementById('app-search');
  const appCards = document.querySelectorAll('.app-card[data-app-keywords]');

  if (!searchInput || !appCards.length) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    appCards.forEach(card => {
      const keywords = card.dataset.appKeywords.toLowerCase();
      if (!query || keywords.includes(query)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });
}
