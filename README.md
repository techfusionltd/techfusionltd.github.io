# Techfusion Ltd GitHub Pages Website & Privacy Portal

Official repository for **[techfusionltd.github.io](https://techfusionltd.github.io)** — the landing page, app showcase, and mobile privacy policy directory for Techfusion Ltd.

---

## 📁 Repository Structure

```
├── index.html                  # Main homepage & mobile app directory
├── sitemap.xml                 # Public pages for search engines (add new pages here)
├── robots.txt                  # Allows all crawlers, points to the sitemap
├── favicon.svg                 # Brand vector icon
├── favicon.png                 # Brand icon
├── logo.png                    # Brand logo
├── assets/
│   ├── logo.png                # Official Techfusion Ltd company logo
│   ├── funny-prank-calls.png   # Simulated AI Calls official app icon
│   └── muc-thuoc/              # Mực Thước screenshots (WebP) and social preview image
├── css/
│   └── style.css               # Shared modern CSS design system & typography
├── js/
│   └── main.js                 # Dark/light theme, language switcher (en / vi / zh-Hans / zh-Hant), TOC scrollspy, copy actions
├── muc-thuoc/                  # Mực Thước landing page, one static file per language (SEO, hreflang)
│   ├── index.html              # Tiếng Việt (default)
│   ├── en.html                 # English
│   ├── zh-hans.html            # 简体中文
│   └── zh-hant.html            # 繁體中文
├── privacy/
│   ├── index.html              # Directory of all privacy policies
│   ├── muc-thuoc.html          # Privacy Policy for Mực Thước (EN / VI / 简体 / 繁體)
│   ├── habit-hero.html         # Complete bilingual Privacy Policy for HabitHero: AI Voice Coach (iOS)
│   ├── habit-buddy.html        # Backward-compatible redirect to habit-hero.html
│   ├── habit-buddy-ai-voice-coach.html # Alias redirect to habit-hero.html
│   ├── simulated-ai-calls.html # Complete bilingual Privacy Policy for Simulated AI Calls
│   └── funny-prank-calls.html  # Backward-compatible redirect to simulated-ai-calls.html
└── README.md                   # Documentation
```

---

## 📱 Published Applications & Policies

| App Name | Package ID | Platform | Privacy Policy |
|---|---|---|---|
| **HabitHero: AI Voice Coach** | `dev.techfusion.funnyprankcalls` | iOS | [`/privacy/habit-hero.html`](https://techfusionltd.github.io/privacy/habit-hero.html) |
| **Simulated AI Calls** | `dev.techfusion.funnyprankcalls` | Android / iOS | [`/privacy/simulated-ai-calls.html`](https://techfusionltd.github.io/privacy/simulated-ai-calls.html) |
| **Mực Thước – Thước Lỗ Ban** (墨尺) | `dev.techfusion.luban` | Android | [`/privacy/muc-thuoc.html`](https://techfusionltd.github.io/privacy/muc-thuoc.html) · landing page [`/muc-thuoc/`](https://techfusionltd.github.io/muc-thuoc/) |

---

## 🚀 How to Add a New App & Privacy Policy

When you release a new app:

1. **Create the Policy Page**:
   - Duplicate `privacy/simulated-ai-calls.html` to `privacy/your-new-app-slug.html`.
   - Update the title, package ID, effective date, and policy sections.
2. **Link from the Home Page**:
   - Open `index.html` and add an `<article class="app-card">` block inside the `<div class="apps-grid">` container.
   - Point the policy button to `privacy/your-new-app-slug.html`.
3. **Optional landing page**: copy `muc-thuoc/` (one file per language, each with its own canonical and the shared `hreflang` links), and add the new URLs to `sitemap.xml`.
4. **Commit & Push to GitHub**:
   - Push to `main` branch. GitHub Pages will automatically deploy your updates.

---

## 🌐 GitHub Pages Deployment Setup

1. Go to your GitHub repository settings (`https://github.com/techfusionltd/techfusionltd.github.io/settings/pages`).
2. Under **Build and deployment > Source**, select **Deploy from a branch**.
3. Choose the **`main`** branch and the **`/ (root)`** folder.
4. Click **Save**. Your site will be live at `https://techfusionltd.github.io`!

---

## 📧 Support & Business Information

- **Company:** Techfusion Ltd
- **Registration:** Registered business under the laws of Vietnam (Company number: 1001261052)
- **Support Email:** `support@techfusion.dev`

