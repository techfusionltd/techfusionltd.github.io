# Techfusion Ltd GitHub Pages Website & Privacy Portal

Official repository for **[techfusionltd.github.io](https://techfusionltd.github.io)** — the landing page, app showcase, and mobile privacy policy directory for Techfusion Ltd.

---

## 📁 Repository Structure

```
├── index.html                  # Main homepage & mobile app directory
├── favicon.svg                 # Brand vector icon
├── favicon.png                 # Brand icon
├── logo.png                    # Brand logo
├── assets/
│   ├── logo.png                # Official Techfusion Ltd company logo
│   └── funny-prank-calls.png   # Funny Prank Calls official app icon
├── css/
│   └── style.css               # Shared modern CSS design system & typography
├── js/
│   └── main.js                 # Dark/light theme, bilingual switcher, TOC scrollspy, copy actions
├── privacy/
│   ├── index.html              # Directory of all privacy policies
│   └── funny-prank-calls.html  # Complete bilingual Privacy Policy for Funny Prank Calls
└── README.md                   # Documentation
```

---

## 📱 Published Applications & Policies

| App Name | Package ID | Platform | Privacy Policy |
|---|---|---|---|
| **Funny Prank Calls** | `dev.techfusion.funnyprankcalls` | Android / iOS | [`/privacy/funny-prank-calls.html`](https://techfusionltd.github.io/privacy/funny-prank-calls.html) |

---

## 🚀 How to Add a New App & Privacy Policy

When you release a new app:

1. **Create the Policy Page**:
   - Duplicate `privacy/funny-prank-calls.html` to `privacy/your-new-app-slug.html`.
   - Update the title, package ID, effective date, and policy sections.
2. **Link from the Home Page**:
   - Open `index.html` and add an `<article class="app-card">` block inside the `<div class="apps-grid">` container.
   - Point the policy button to `privacy/your-new-app-slug.html`.
3. **Commit & Push to GitHub**:
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

