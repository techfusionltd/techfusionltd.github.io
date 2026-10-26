# Techfusion company limited GitHub Pages Website & Privacy Portal

Official repository for **[tf.io.vn](https://tf.io.vn)** — the landing page, app showcase, and mobile privacy policy directory for Techfusion company limited.

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
│   ├── logo.png                # Official Techfusion company limited logo
│   ├── funny-prank-calls.png   # Simulated AI Calls official app icon
│   └── muc-thuoc/              # Mực Thước screenshots (WebP) and social preview image
├── css/
│   └── style.css               # Shared modern CSS design system & typography
├── js/
│   └── main.js                 # Dark/light theme, language switcher (en / vi / zh-Hans / zh-Hant), TOC scrollspy, copy actions
├── tests/
│   ├── run-all.js               # Runs every check below
│   ├── homepage-check.js        # Home page: company info, Vietnamese copy, project filter, services section, mobile layout
│   └── policy-pages-check.js    # Privacy policies + landing pages: language switcher, no overflow
├── muc-thuoc/                  # Mực Thước landing page, one static file per language (SEO, hreflang)
│   ├── index.html              # Tiếng Việt (default)
│   ├── en.html                 # English
│   ├── zh-hans.html            # 简体中文
│   └── zh-hant.html            # 繁體中文
├── services/                   # Custom software development landing pages (VI / EN)
│   ├── index.html              # Tiếng Việt (default)
│   └── en.html                 # English
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

The home page (`index.html`) and the policy directory (`privacy/index.html`) are in **Vietnamese**.
Individual policy pages stay multilingual (EN / VI / 中文) with their own language switcher.

| App Name | Package ID | Platform | Privacy Policy |
|---|---|---|---|
| **HabitHero: AI Voice Coach** | `dev.techfusion.funnyprankcalls` | iOS | [`/privacy/habit-hero.html`](https://tf.io.vn/privacy/habit-hero.html) |
| **Simulated AI Calls** | `dev.techfusion.funnyprankcalls` | Android / iOS | [`/privacy/simulated-ai-calls.html`](https://tf.io.vn/privacy/simulated-ai-calls.html) |
| **Mực Thước – Thước Lỗ Ban** (墨尺) | `dev.techfusion.luban` | Android | [`/privacy/muc-thuoc.html`](https://tf.io.vn/privacy/muc-thuoc.html) · landing page [`/muc-thuoc/`](https://tf.io.vn/muc-thuoc/) |

---

## 🧩 Custom Software Development (Client Services)

Besides the in-house apps above, Techfusion company limited takes on client software projects. The home page
advertises this in the `#services` section (Vietnamese copy with English service names) and links to a
dedicated landing page in both languages:

| Page | URL | Language |
|---|---|---|
| Dịch vụ phát triển phần mềm | [`/services/`](https://tf.io.vn/services/) | Tiếng Việt (default) |
| Custom Software Development | [`/services/en.html`](https://tf.io.vn/services/en.html) | English |

Each file has its own `canonical` URL, the shared `hreflang` alternates (`vi`, `en`, `x-default`) and a
`nav.language-switch-bar` linking the two, exactly like `muc-thuoc/`.

**To update the services copy:** edit `services/index.html` (VI) and `services/en.html` (EN) — they are
standalone pages, so the two files must be edited side by side. The shared card styles live in
`css/style.css` (`.service-grid`, `.service-card`, `.process-grid`, `.process-step`).

---

## 🚀 How to Add a New App & Privacy Policy

When you release a new app:

1. **Create the Policy Page**:
   - Duplicate `privacy/simulated-ai-calls.html` to `privacy/your-new-app-slug.html`.
   - Update the title, package ID, effective date, and policy sections.
2. **Link from the Home Page**:
   - Open `index.html` and add an `<article class="app-card project-card">` block inside the `<div class="apps-grid">` container.
   - Copy an existing card and update the icon, `data-app-keywords`, title, description (Vietnamese), tags and links. Keep the `project-card-top` block with the `project-index` label so the numbering stays in order.
   - Point the policy button to `privacy/your-new-app-slug.html`.
3. **Optional landing page**: copy `muc-thuoc/` (one file per language, each with its own canonical and the shared `hreflang` links), and add the new URLs to `sitemap.xml`.
4. **Verify**: run `node tests/run-all.js` — it drives headless Chrome and asserts the company name, the business registration number, the Vietnamese copy, the project filter, the mobile layout and the language switchers on the policy pages.
5. **Commit & Push to GitHub**:
   - Push to `main` branch. GitHub Pages will automatically deploy your updates.

---

## 🌐 GitHub Pages Deployment Setup

1. Go to your GitHub repository settings (`https://github.com/techfusionltd/techfusionltd.github.io/settings/pages`).
2. Under **Build and deployment > Source**, select **Deploy from a branch**.
3. Choose the **`main`** branch and the **`/ (root)`** folder.
4. Click **Save**. Your site will be live at `https://tf.io.vn`!

**Custom domain:** the `CNAME` file holds `tf.io.vn`. DNS is on Cloudflare: the apex has GitHub Pages A/AAAA records and `www` is a CNAME to `techfusionltd.github.io`, all set to **DNS only** (grey cloud) so GitHub can renew the HTTPS certificate. Old `techfusionltd.github.io` links redirect to `tf.io.vn`, so keep the domain renewed or every store privacy link breaks.

---

## 📧 Support & Business Information

- **Company:** Techfusion company limited (Công ty TNHH Techfusion)
- **Registration:** Registered business under the laws of Vietnam (Company number: 1001261052)
- **Support Email:** `support@techfusion.dev`

### Legal name by language

Always write the registered name in the language of the text:

| Language | Legal name |
|---|---|
| Vietnamese | **Công ty TNHH Techfusion** |
| English | **Techfusion company limited** |
| Chinese | **Techfusion company limited** (no Chinese form is registered) |

Rules:
- The short brand **Techfusion** (no suffix) stays as-is for brand references — logo alt text, "đội ngũ Techfusion", package IDs (`dev.techfusion.*`), and `support@techfusion.dev`.
- On the bilingual policy pages (`privacy/muc-thuoc.html`, `privacy/simulated-ai-calls.html`, `privacy/habit-hero.html`), the shared header/footer chrome is English and uses **Techfusion company limited**; the Vietnamese section uses **Công ty TNHH Techfusion**.
- Structured data carries all three forms: `name` (page language), `legalName`, `alternateName`.

