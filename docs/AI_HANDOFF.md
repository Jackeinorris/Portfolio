# AI_HANDOFF.md — JVDias Films portfolio site

## 1. Freshness warning

This document was generated on **2026-07-07** from a direct inspection of the repository at commit `f580271` ("Code Cleaning", `master`, in sync with `origin/master`). Everything below describes the repo **as of that date**. Before acting on this handoff in a future session, re-verify the repo state (`git status`, `git log -5 --oneline`) — file paths, nav structure, and build-script line references may have drifted.

## 2. Current stage

- The portfolio site is live at **https://jvdiasfilms.com.br**, deployed on Cloudflare Workers static assets.
- Content is mature: homepage with hero + featured works, about page, 6 hand-written project pages, 5 published essays ("ensaios") + 1 draft, RSS feed, sitemap, structured data, security headers, analytics.
- **Planned next**: a page for the Teleprompter app (product page) and, later, a privacy policy page. **Neither exists yet** — this handoff is the preparation step; no site code was changed in this session.

## 3. Current repo state

Verified on 2026-07-07:

- Branch: `master`, up to date with `origin/master` (`https://github.com/Jackeinorris/Portfolio.git`).
- Working tree: clean except two untracked files — `CLAUDE.md` (project instructions for Claude Code) and `docs/AI_HANDOFF.md` (this document).
- Recent history: `f580271` Code Cleaning · `a455128` extensionless clean URLs migration · `0b5e5e8` GSC verification file · `290d9ef` security/cache headers, skip link · `4c51780` Cloudflare Web Analytics beacon.
- No CI/CD configuration (`.github/` does not exist). No lint or test suite.

## 4. Site architecture summary

Static personal portfolio for **J. V. Dias** (filmmaker / visual director), content in **Portuguese (pt-BR)**. **No frontend framework, no bundler.** Hand-written HTML/CSS/vanilla JS, plus a small Node build pipeline that generates the essays section and SEO files.

Two categories of pages:

1. **Hand-written**: `index.html`, `about.html`, `404.html`, `projects/*.html` (6 project pages). Authored directly; the build script only injects/maintains a canonical `<link>` in them.
2. **Generated** (build output — never hand-edit): `ensaios/index.html`, `ensaios/<slug>.html`, `ensaios/feed.xml`, `sitemap.xml`, `robots.txt`. Source of truth is `ensaios/posts/posts.json` (metadata: title, slug, date, excerpt, coverImage, coverPosition, videoUrl, tags, draft) + `ensaios/posts/<slug>.md` (body, minimal custom Markdown subset — no tables/code blocks).

Other moving parts:

- `scripts/build-site.mjs` — the whole build: essay HTML generation, JSON-LD structured data (`Person`/`WebSite`/`BlogPosting`/`CollectionPage`/`ItemList`), sitemap, RSS, robots.txt, canonical injection. `SITE_URL` is hardcoded here (single place to change domain).
- `scripts/serve.mjs` — zero-dependency local static server mimicking Cloudflare's `html_handling` (extensionless URLs).
- `scripts/optimize-image.mjs` — `sharp`-based image pipeline emitting `.jpg`/`.webp` pairs into `assets/images/optimized/`.
- `js/main.js` — nav logo reveal on scroll (IntersectionObserver) + lazy Vimeo embed loader (click-to-load iframe).
- `js/post-redirect.js` — client-side redirect for legacy `/ensaios/post.html?slug=foo` URLs to clean `/ensaios/foo` (slug validated against `^[a-z0-9-]+$`).
- `ensaios/post.html` — the legacy shell page that hosts that redirect script; keep it.
- `googlec051422149ae4b84.html` — Google Search Console verification; keep it.

Only dependency: `sharp` (devDependency, used by the image script only).

## 5. Commands

- `npm run build` — runs `scripts/build-site.mjs`. **Mandatory after editing `ensaios/posts/posts.json` or any `ensaios/posts/*.md`.** Regenerates all generated files listed above.
- `npm run serve` — local preview at `http://localhost:3000` (override with `PORT`), with production-like extensionless routing.
- `npm run optimize-image -- <input> <output-name> [maxWidth]` — produces `assets/images/optimized/<output-name>.jpg` + `.webp` (default max width 1280, quality 80). Use for **any** new image referenced by a page; never commit heavy originals.
- Deploy: no npm script — done with **Wrangler** against `wrangler.jsonc` (`npx wrangler deploy` or via the Cloudflare dashboard; no CI pipeline exists).

## 6. Routing / page structure

Routing is **filesystem-based** with clean/extensionless URLs in production (Cloudflare `html_handling`; `serve.mjs` replicates it locally):

| URL | File | Kind |
|---|---|---|
| `/` | `index.html` | hand-written (hero, featured works, archive, contact CTA) |
| `/about` | `about.html` | hand-written |
| `/projects/<name>` | `projects/<name>.html` | hand-written (6 pages) |
| `/ensaios/` | `ensaios/index.html` | **generated** |
| `/ensaios/<slug>` | `ensaios/<slug>.html` | **generated** |
| anything else | `404.html` | via `not_found_handling: "404-page"` |

Internal links always use the clean form (`/about`, `/ensaios/foo`), never `.html`.

SEO registration for pages is **partly manual** in `scripts/build-site.mjs`:
- Sitemap: `/` and `/about` are hardcoded entries (~line 510); `projects/*.html` are **auto-discovered** from the directory; published essays are added automatically.
- Canonical injection: hardcoded calls for `index.html`, `about.html`, and a loop over `projects/*.html` (~lines 606–612).
- **A new top-level page (e.g. `/teleprompter`) is NOT picked up automatically** — it must be added to both the sitemap list and the canonical-injection calls in `build-site.mjs`. A new page under `projects/` would be picked up automatically by both.

## 7. Components and styling

- **There are no components.** Header/nav and footer markup is **duplicated by hand** in every hand-written page, and duplicated once more as a template string inside `scripts/build-site.mjs` (~lines 311–315 for nav, ~330 for footer) for generated essay pages. Any nav change must be replicated in: `index.html`, `about.html`, all 6 `projects/*.html`, `404.html` (check), the build-script template, then `npm run build`.
- Current nav (subpages): `Projetos → /#works` · `Ensaios → /ensaios/` · `Sobre → /about` · `Contato → /#contact` (homepage uses in-page `#` anchors).
- **Single stylesheet**: `css/styles.css` (~800+ lines, section-commented: reset, header/nav, hero, works, archive, contact, footer, 404, project page, ensaios, about). No CSS variables/custom properties in use; colors are hardcoded.
- Accessibility touches already present: skip link (`.skip-link` → `#conteudo`), focus states, `aria-label`s.

## 8. Assets / public files

- `assets/images/optimized/` — production `.jpg`/`.webp` pairs generated by the optimize script (plus hand-placed `hero-1920.avif/webp`, `og-jvdias.jpg` OG image). Pages reference **these**, not originals.
- `assets/images/` (root) — a few small committed files: `logo.svg`, `Favicon.png`, `apple-touch-icon.png`, `foto-perfil.jpeg`, `Carlota.jpg`.
- Heavy source images are excluded from git (`.gitignore`) **and** from the deploy bundle (`.assetsignore`) — local-only. New local-only file categories generally need adding to **both** files.
- `pictureMarkup()` in the build script emits `<picture>` with a `.webp` source only if a sibling `.webp` exists, and reads PNG/JPEG headers directly to derive `width`/`height`.

## 9. Deployment / build notes

- **Cloudflare Workers static assets.** `wrangler.jsonc`: worker name `portfolio`, assets directory `.` (the whole repo root), `not_found_handling: "404-page"`, observability enabled.
- `.assetsignore` keeps source/tooling files (scripts, Markdown sources, configs, unoptimized originals) out of the deployed bundle.
- `_headers` (consumed by Cloudflare) sets: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and a strict **CSP**. Currently allowed third-party origins: Cloudflare Insights (script/connect), Google Fonts (style/font), Vimeo player (frame). Cache-control: `/assets/*` 30 days, `/css/*` and `/js/*` 1 day.
- **Any page loading a new third-party origin requires a CSP update in `_headers` first**, or the resource will be silently blocked in production.
- Analytics: Cloudflare Web Analytics beacon on all pages.
- Deploy appears to be manual (`wrangler deploy`); there is no GitHub Actions or other CI.

## 10. Visual / editorial style

- **Dark, cinematic, editorial-minimal.** Background `#0a0a0a`, warm off-white text `#eae6df`, generous whitespace, subtle radial/linear gradient overlays on the fixed header.
- Typography: **Fraunces** (light 300, serif) for h1–h3, **Libre Baskerville** for logo/section titles, **Inter** for UI/labels/buttons, system sans as body fallback. Old-style numerals via `font-feature-settings`. Fonts from Google Fonts.
- Hero: full-bleed 3D render image (avif/webp/jpg cascade) with an SVG handwritten-style "J. V. Dias" logo overlay.
- Media: Vimeo embeds are click-to-load (thumbnail first) for performance; `dnt=1` set on the player.
- Editorial voice: Portuguese, first-person, reflective/essayistic (essays about cinema, directing, 3D, creative process). Titles are lowercase-leaning, poetic. Any new page should match this register — restrained, no marketing-speak.

## 11. High-risk files or areas

| File / area | Why risky |
|---|---|
| `scripts/build-site.mjs` | Generates essays, sitemap, RSS, robots.txt, JSON-LD, canonicals. A bug here breaks SEO/content site-wide. `SITE_URL` hardcoded here. |
| `_headers` (CSP) | A wrong CSP silently breaks fonts, analytics, or Vimeo in production; not reproduced by the local server. |
| Generated files (`ensaios/*.html`, `ensaios/feed.xml`, `sitemap.xml`, `robots.txt`) | Hand edits are lost on next `npm run build`. Edit sources instead. |
| Nav/footer duplication | Markup repeated across ~10 files + the build template; partial edits leave pages inconsistent. |
| `wrangler.jsonc`, `.assetsignore`, `.gitignore` | Control what deploys and what's tracked; mistakes can ship source files or drop assets from production. |
| `ensaios/post.html` + `js/post-redirect.js` | Legacy URL compatibility; deleting breaks old inbound links. |
| `googlec051422149ae4b84.html` | Google Search Console verification; do not delete or rename. |
| `index.html` hero SVG | Large inline SVG paths; easy to corrupt with careless edits. |

## 12. Current website goals

- Serve as the professional portfolio/presence for J. V. Dias (filmmaker/visual director): showcase projects, publish essays, provide contact.
- Strong SEO/performance posture already invested in (clean URLs, canonicals, structured data, optimized images, strict CSP) — new work must not regress it.
- Upcoming expansion: present the **Teleprompter app** as a product (next step), and add a **privacy policy** page (likely required by the app's store listing).

## 13. Future Teleprompter page context placeholder

The Teleprompter app will be brought in as a product source in a **next step**. Its actual details (name, features, screenshots, store links, copy) will come **from the app's own repository/handoff** — do not invent them. What this site's side of the integration will need (verified against the current codebase):

- A new page — either top-level (e.g. `/teleprompter`, requiring manual additions to the sitemap list and canonical-injection calls in `scripts/build-site.mjs`) or placed to benefit from existing auto-discovery. Decision deferred to the planning session.
- A nav link (see §7 — must be replicated across all hand-written pages **and** the build-script template).
- Any screenshots/images must go through `npm run optimize-image`.
- Any external origins (store badges, app domain) require a CSP update in `_headers`.

## 14. Future privacy policy page context placeholder

No legal/privacy page or structure exists today. When needed (likely as a requirement for the Teleprompter app's store listing), it would be a new hand-written top-level page following the `about.html` pattern (same header/footer markup, `css/styles.css`), plus manual sitemap + canonical registration in `scripts/build-site.mjs`. Content is pending — do not draft legal text without input from the owner.

## 15. Next prompt for Teleprompter page planning

Suggested prompt for the next session (planning only, no implementation):

> Você está no repositório do website JVDias Films. Leia `docs/AI_HANDOFF.md` deste repo e o handoff do app Teleprompter (fornecido em anexo ou no repo do app). Com base nos dois documentos, produza um PLANO para a página do Teleprompter no site — sem implementar nada ainda. O plano deve cobrir: (1) URL e localização do arquivo (top-level vs. `projects/`), considerando o que o build script registra automaticamente; (2) estrutura e seções da página, coerentes com o estilo visual/editorial do site (dark, editorial-minimal, pt-BR); (3) lista exata de arquivos a tocar (página nova, nav em todas as páginas + template do build script, `scripts/build-site.mjs` para sitemap/canonical, `_headers` se houver origens externas, imagens via `npm run optimize-image`); (4) se/quando a página de privacy policy entra; (5) riscos e ordem de execução. Não edite código nesta sessão; apenas apresente o plano para aprovação.

## 16. Open questions

1. Where should the Teleprompter page live — top-level `/teleprompter` (reads as a product) or `/projects/teleprompter` (reads as portfolio work, gets sitemap/canonical automation for free)?
2. Should "Teleprompter" get its own nav item, or live under an existing section (e.g. linked from the works archive)?
3. Will the page need external origins (app store badges, download links, demo video host other than Vimeo)? Each one is a CSP change.
4. Is the privacy policy scoped to the app only, or should it also cover the website (Cloudflare Analytics is cookieless, but coverage is a legal/owner decision)?
5. Language: site is pt-BR throughout — will the Teleprompter page (and privacy policy) need an English version for store listings?
6. Deploy is manual via Wrangler — confirm who runs deploys and whether a CI step is wanted before adding more pages.

## 17. Decision log

- **2026-07-07** — Handoff document created. Session scope was deliberately analysis-only: no site code, config, CSS, assets, or routes were touched; no commits made. Decision to defer all Teleprompter page details until the app's own handoff is available (avoid inventing product facts).
