# Verant — AI Opportunity Audits for Oil & Gas

Marketing site for Verant. **From truth to action.**

## Pages

| File | Purpose |
|---|---|
| `index.html` | Main site: findings, process, data security, name/philosophy, pricing, FAQ |
| `sample-audit.html` | Redacted illustrative audit extract (opportunity matrix + roadmap) |
| `privacy.html` | Privacy & security policy — the written version of the data-protection commitments |
| `404.html` | Not-found page |
| `assets/main.css` / `assets/main.js` | The entire design system and interaction layer |
| `_headers` | Hardened HTTP headers (Netlify / Cloudflare Pages format) |
| `.well-known/security.txt` | Security-researcher disclosure contact (RFC 9116) |

## Security posture

This is a **fully static site with no attack surface by design**:

- **Zero third-party code.** No CDN scripts, no external fonts, no embeds, no analytics,
  no trackers. Every byte is served from this repo. There is no supply chain to poison.
- **Zero data collection.** No forms, no cookies, no localStorage, no database, no
  server-side code. Booking/intake happens on Tally's own site (opened with
  `rel="noopener noreferrer"`).
- **Strict Content-Security-Policy** on every page (both as a `<meta>` tag baked into
  the HTML and as an HTTP header via `_headers`):
  `default-src 'none'` with narrow allowances for same-origin scripts, styles, and
  images only. No inline scripts, no inline styles, no `eval`.
- **Hardened headers** in `_headers`: `frame-ancestors 'none'` + `X-Frame-Options: DENY`
  (no clickjacking), `nosniff`, `Referrer-Policy`, `Permissions-Policy` (camera/mic/
  geolocation disabled), COOP/CORP, and HSTS.
- **JS is defensive.** All DOM is built with `createElement`/`textContent` (no HTML
  string injection anywhere), and the whole site works with JavaScript disabled —
  animations are additive, content is never gated on JS.
- **`security.txt`** gives researchers a disclosure path.

### Honest limits (read this)

No website is "unhackable" — anyone promising that is selling something. What this
architecture does is **eliminate the usual ways sites get compromised**: there are no
credentials, sessions, databases, plugins, or third-party scripts to attack. The
remaining risk lives in (1) the hosting account and (2) this GitHub account — protect
both with strong unique passwords + 2FA, and the site inherits that protection.

## Hosting notes

- **Cloudflare Pages / Netlify (recommended):** deploy the repo root; `_headers` is
  picked up automatically, so all hardened headers (including HSTS and frame-ancestors)
  are served. TLS is automatic.
- **GitHub Pages:** works, but it **ignores `_headers`** — you keep the `<meta>` CSP
  (the most important protection) but lose HSTS/frame-ancestors/nosniff. Fine for a
  preview; use Cloudflare Pages or Netlify (or Cloudflare in front) for production.
- Before going live: update the `Policy:` URL in `.well-known/security.txt` to the real
  domain, and confirm the contact email is the one you want published.

## Local preview

Open `index.html` directly, or serve the folder:

```
python -m http.server 8080
```

## Editing

No build step. Edit the HTML/CSS/JS directly and redeploy. Keep these rules:

1. Never add inline `style=""` attributes or `<script>` blocks — the CSP blocks them.
   Add a class in `main.css` / code in `main.js` instead.
2. Any new external link gets `rel="noopener noreferrer"`.
3. Keep every claim on the security page true — the "0 cookies / 0 trackers /
   0 third-party scripts" line is a promise, not copy.
