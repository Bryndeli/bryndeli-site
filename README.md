# Bryndeli — bryndeli.co.uk

The marketing site for **Bryndeli** — _The AI companion every frontline carer should have._

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

---

### Brand consistency

The site uses the locked-in Bryndeli identity:

- **Display type**: Fraunces (variable serif — `opsz 144` for the hero, `opsz 100` for sections)
- **Body type**: Inter
- **Mono type**: JetBrains Mono (eyebrow labels and trust pills)
- **Palette**: Warm Sage — Pine `#2F5D4E`, Terracotta `#C9614A`, Oat `#F8EDE0`, Honey `#E0B469`
- **Mark**: The Nest — two concentric broken rings around a held terracotta core


---

The lightweight, privacy-respecting options:

- **Vercel Analytics** — one-click in the Vercel dashboard, no code change.
- **Plausible** — one script tag, GDPR-friendly, ~1KB.
- **Fathom** — similar to Plausible, paid.

---

## Accessibility

- All interactive elements have visible focus styles via `:focus-visible`.
- Reveal animations respect `prefers-reduced-motion: reduce`.
- Colour contrast meets WCAG AA on body text (Pine on Oat ≈ 7:1, Bark on Oat ≈ 11:1).
- Decorative SVGs have `aria-hidden="true"`; functional ones have `aria-label` on the parent link.
- Headings are correctly nested (one `<h1>`, multiple `<h2>` for sections, `<h3>` for cards).

---

---

## License & ownership

© 2026 Bryndeli Ltd. All brand assets, copy, and design are the property of Bryndeli Ltd.

---

## Contact

For questions about this codebase: olu@bryndeli.co.uk
For Bryndeli the product: hello@bryndeli.co.uk
