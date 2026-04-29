# Bryndeli — bryndeli.co.uk

The marketing site for **Bryndeli** — _The AI companion every frontline carer should have._

This is a static site, deployable to **Vercel**, **GitHub Pages**, **Cloudflare Pages**, **Netlify**, or any static host. No build step, no framework, no dependencies. Plain HTML, CSS, and a sliver of JavaScript.

The repo is intentionally **host-agnostic** — both `vercel.json` (Vercel) and `CNAME` + `.nojekyll` (GitHub Pages) live in the root. Each platform reads the config it cares about and ignores the rest.

---

## Quick start (local)

```bash
git clone https://github.com/<your-username>/bryndeli-site.git
cd bryndeli-site

# Pick any local server
python3 -m http.server 8000
# or: npx serve .
# or just double-click index.html in a browser

# Visit http://localhost:8000
```

There's nothing to install or compile.

---

## Deploying to Vercel (recommended)

The fastest way:

1. Push this folder to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. Vercel auto-detects it as a static site — leave all defaults.
4. Click **Deploy**. Site live within ~30 seconds at `<repo>-<your-team>.vercel.app`.
5. Add the custom domain in **Project Settings → Domains**:
   - Add `bryndeli.co.uk` and `www.bryndeli.co.uk`.
   - Vercel shows the DNS records you need (an `A` record for the apex, a `CNAME` for `www`).
   - Add those at your DNS provider. HTTPS is automatic.

Alternatively, install the Vercel CLI and deploy from your terminal:

```bash
npm i -g vercel
vercel              # preview deploy
vercel --prod       # production deploy
```

Vercel also auto-creates **preview deployments** for every branch and pull request, so you can share a draft URL before merging.

### What `vercel.json` does

The config in this repo enables:

- **Clean URLs** (`/about` instead of `/about.html` if you add more pages)
- **Security headers** (HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- **Aggressive caching** for assets (`/assets/*` cached for 1 year, immutable)
- **HTML revalidation** on every load (visitors always see your latest copy)

You don't need to edit `vercel.json` unless you want to change defaults.

---

## Deploying to GitHub Pages

1. Push this folder to a GitHub repo.
2. Repo settings → **Pages** → set source to `Deploy from a branch` → branch `main`, root `/`.
3. GitHub publishes to `https://<your-username>.github.io/<repo-name>/` within a minute.
4. For the custom domain `bryndeli.co.uk`:
   - The `CNAME` file in this repo already points GitHub at `bryndeli.co.uk`.
   - In your DNS provider, add `A` records for the apex `@` pointing at GitHub's IPs:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Add a `CNAME` record for `www` pointing at `<your-username>.github.io`.
   - In repo settings → Pages, tick **Enforce HTTPS** once GitHub issues the certificate (usually within an hour).

`.nojekyll` tells GitHub Pages to skip Jekyll preprocessing and serve files as-is.

### Vercel vs GitHub Pages — which to use?

Both serve this site identically as far as visitors can tell. The trade-offs:

| Feature                       | Vercel                 | GitHub Pages        |
| ----------------------------- | ---------------------- | ------------------- |
| HTTPS                         | Automatic              | Automatic           |
| Global CDN                    | Edge network           | Limited regions     |
| Preview deploys per PR        | Yes                    | No                  |
| Custom security headers       | Yes (`vercel.json`)    | No                  |
| Custom redirects/rewrites     | Yes (`vercel.json`)    | No                  |
| Build minutes / bandwidth     | Generous free tier     | Public repos only   |
| Setup time                    | ~30 seconds            | ~5 minutes          |

For a marketing site like this, **Vercel is the better default** — faster globally, more control, preview URLs are useful when iterating on copy. GitHub Pages is fine if you want zero external services and the site lives in a public repo anyway.

You can switch between them by just changing where DNS points. The codebase doesn't care.

---

## File structure

```
bryndeli-site/
├── index.html              # The landing page
├── 404.html                # Branded not-found page
├── vercel.json             # Vercel config (clean URLs, security headers, caching)
├── CNAME                   # GitHub Pages custom domain binding
├── .nojekyll               # Tells GitHub Pages to skip Jekyll
├── manifest.webmanifest    # PWA manifest (add-to-home-screen support)
├── robots.txt              # Crawler rules
├── sitemap.xml             # Sitemap (extend as you add pages)
├── README.md
├── .gitignore
└── assets/
    └── images/
        ├── favicon.svg              # Vector favicon
        ├── favicon-64.png           # PNG fallback
        ├── symbol.svg               # The Nest symbol alone
        ├── lockup.svg               # Symbol + wordmark horizontal
        ├── og-image.png             # Open Graph / Twitter card (1200×630)
        ├── app-icon-180.png         # Apple touch icon
        ├── app-icon-192.png         # Android Chrome
        ├── app-icon-512.png         # Larger Android / general
        ├── app-icon-512-pwa.png     # PWA manifest
        └── app-icon-1024.png        # App Store / large displays
```

All paths in `index.html` are root-absolute (`/assets/...`), so the site works at any depth and on either host.

---

## Editing the site

The whole site is one file: **`index.html`**. CSS and JS are inline, so there's nothing to hunt for.

### Common edits

**Tagline or hero copy** — search for `<h1>` in `index.html`. Sub-copy is the `.hero-sub` paragraph immediately below.

**Brand colours** — at the top of the `<style>` block, you'll find the `:root` design tokens:

```css
:root {
  --pine: #2F5D4E;
  --terracotta: #C9614A;
  --oat: #F8EDE0;
  --honey: #E0B469;
  /* ... */
}
```

Change a single value here and it cascades across every component.

**Add a new section** — copy any existing `<section>` block and adjust the content. The `.reveal` classes give scroll-fade animations for free; add `.delay-1`, `.delay-2`, `.delay-3` to stagger them.

**Update the testimonial** — search `<blockquote>`. The `<em>` tags inside create the terracotta italic emphasis.

**Edit the demo phone mockup** — the phone is real HTML inside `.phone-screen`. Change the visit names, times, and prep notes by editing the `.visit-card` blocks.

### Brand consistency

The site uses the locked-in Bryndeli identity:

- **Display type**: Fraunces (variable serif — `opsz 144` for the hero, `opsz 100` for sections)
- **Body type**: Inter
- **Mono type**: JetBrains Mono (eyebrow labels and trust pills)
- **Palette**: Warm Sage — Pine `#2F5D4E`, Terracotta `#C9614A`, Oat `#F8EDE0`, Honey `#E0B469`
- **Mark**: The Nest — two concentric broken rings around a held terracotta core

Don't introduce new fonts or accent colours without going back to the brand guide first.

---

## Performance

- Total page weight under 200KB on first load.
- Fonts via Google Fonts with `&display=swap` — text shows in fallback first, swaps when fonts arrive.
- Phone mockup is rendered in HTML/CSS — no screenshot, scales perfectly at any DPI.
- Reveal-on-scroll uses `IntersectionObserver` (broad browser support); falls back to "all visible" if not available.
- On Vercel, all assets are cached for 1 year via `vercel.json`. Filenames don't change, so this is safe.

---

## SEO checklist

- [x] `<title>` and `<meta name="description">`
- [x] Open Graph tags
- [x] Twitter card tags
- [x] `theme-color` meta for mobile browser chrome
- [x] Semantic HTML (`<nav>`, `<section>`, `<header>`, `<footer>`, `<blockquote>`)
- [x] All images have `alt` or `aria-hidden="true"`
- [x] `:focus-visible` styles for keyboard navigation
- [x] `prefers-reduced-motion` support
- [x] `robots.txt` and `sitemap.xml`
- [ ] Google Search Console verification (do this once DNS is live)
- [ ] Analytics (optional — see below)

### Adding analytics later

The lightweight, privacy-respecting options:

- **Vercel Analytics** — one-click in the Vercel dashboard, no code change.
- **Plausible** — one script tag, GDPR-friendly, ~1KB.
- **Fathom** — similar to Plausible, paid.

Avoid Google Analytics for a UK healthcare brand — it's GDPR-grey and adds ~30KB of script.

---

## Accessibility

- All interactive elements have visible focus styles via `:focus-visible`.
- Reveal animations respect `prefers-reduced-motion: reduce`.
- Colour contrast meets WCAG AA on body text (Pine on Oat ≈ 7:1, Bark on Oat ≈ 11:1).
- Decorative SVGs have `aria-hidden="true"`; functional ones have `aria-label` on the parent link.
- Headings are correctly nested (one `<h1>`, multiple `<h2>` for sections, `<h3>` for cards).

---

## Roadmap

Things to add as the company grows, in rough priority order:

1. **`/legal/privacy`, `/legal/terms`, `/legal/dpa`** — required before paid customers.
2. **`/about`** — once the team is more than one person.
3. **`/changelog` or `/blog`** — once there's a product story to tell.
4. **Booking widget** (Cal.com or Calendly embed) replacing the `mailto:` CTA.
5. **`/security`** — a one-pager covering NHS DSPT alignment, encryption, data residency. Care managers will ask.

Each is a new HTML file — drop it in, link to it from `index.html`, add it to `sitemap.xml`. No tooling required. With Vercel's `cleanUrls` you'll get `/about` instead of `/about.html` automatically.

---

## License & ownership

© 2026 Bryndeli Ltd. All brand assets, copy, and design are the property of Bryndeli Ltd.

---

## Contact

For questions about this codebase: olu@bryndeli.co.uk
For Bryndeli the product: hello@bryndeli.co.uk
