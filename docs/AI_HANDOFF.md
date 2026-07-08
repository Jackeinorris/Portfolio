# AI_HANDOFF.md — JVDias Films portfolio site

## 1. Freshness warning

Last updated **2026-07-08 (late)**. The **Teleprompter app is RELEASED on the Microsoft Store** (`https://apps.microsoft.com/detail/9PMJD1Q6Z6L0`) and the site CTA links to it — deployed and verified live. `/teleprompter/` and `/teleprompter/privacy` are LIVE; the `.wrangler` leak is CLOSED; all work is committed and pushed (`master` == `origin/master` at `264b7c3`). Before acting on this handoff, re-verify with `git status` / `git log -6 --oneline`. File paths and build-script line references may drift.

## 2. Working mode (orchestrator pipeline)

Since 2026-07-07 the work runs as a multi-agent pipeline — **read this before doing anything**:

- **Claude (this assistant)** = key orchestrator: analyzes context, writes implementation **plans** (fixed 10-section format), flags risks, defines order, explains decisions, **and writes the ready-to-paste operational prompt for Codex** each cycle. Claude does **not** edit site code / commit / push unless the user explicitly asks. (Exception in practice: Claude may edit *its own* internal docs like this handoff and the memory, since those are advisory artifacts, not deployed site code.)
- **Codex** executes file edits in the repo from Claude's prompt; does not commit/push.
- **User** reviews, commits, pushes, runs `wrangler deploy`, and does external actions (Partner Center, Cloudflare dashboard).
- After each Codex report, Claude audits it against the plan's acceptance criteria and produces the next prompt.

## 3. Current repo state (2026-07-08)

- Branch `master`. Repo: `https://github.com/Jackeinorris/Portfolio.git`.
- **`master` == `origin/master`** at `264b7c3` "Link Teleprompter CTA to Microsoft Store listing" — everything pushed. Recent: `f5bce28` deploy config + `.wrangler` ignores, `19b82e9` internal docs excluded from bundle, `85a6649` Teleprompter pages.
- **Uncommitted:** only this handoff (`docs/AI_HANDOFF.md`, advisory doc — safe to commit alone) and cosmetic churn: `ensaios/*.html` + `robots.txt` (CRLF/LF only, empty content diff), `ensaios/feed.xml` (`lastBuildDate` only). The churn can be discarded (`git checkout -- ensaios/ robots.txt`) or committed whenever convenient.
- **Untracked / gitignored:** `CLAUDE.md`, `AGENTS.md`, `.codex/` are now in `.gitignore` (won't show). `docs/TELEPROMPTER_PRODUCT_BRIEF.md` was committed in `85a6649`.
- Node.js **is now installed** at `C:\Program Files\nodejs` (Node v24.18.0, npm 11.16.0). A shell opened before install needs the full path prefix.
- No CI/CD (`.github/` absent). No lint/test suite.

## 4. Site architecture summary

Static personal portfolio for **J. V. Dias** (filmmaker / visual director), **pt-BR**. **No framework, no bundler.** Hand-written HTML/CSS/vanilla JS + a small Node build pipeline for the essays section and SEO files.

Two page categories:
1. **Hand-written**: `index.html`, `about.html`, `404.html`, `projects/*.html` (6), and now **`teleprompter/index.html`**, **`teleprompter/privacy.html`**. The build only injects/maintains a canonical `<link>` in these.
2. **Generated** (never hand-edit): `ensaios/index.html`, `ensaios/<slug>.html`, `ensaios/feed.xml`, `sitemap.xml`, `robots.txt`. Source of truth: `ensaios/posts/posts.json` + `ensaios/posts/<slug>.md`.

Other moving parts:
- `scripts/build-site.mjs` — the whole build: essay HTML, JSON-LD, sitemap, RSS, robots.txt, canonical injection. `SITE_URL` hardcoded here. Top-level pages registered in the `TOP_LEVEL_PAGES` array near the top (see §6).
- `scripts/serve.mjs` — zero-dependency local server mimicking Cloudflare `html_handling`. **Does NOT apply `_headers`** (no CSP, no cache headers) — so some prod-only behavior isn't reproduced locally (see §9 gotchas).
- `scripts/optimize-image.mjs` — `sharp` image pipeline → `assets/images/optimized/`.
- `js/main.js` — nav logo reveal + lazy Vimeo. `js/post-redirect.js` — legacy essay URL redirect.
- `ensaios/post.html` (legacy shell) and `googlec051422149ae4b84.html` (GSC verification) — keep both.

Only dependency: `sharp` (dev).

## 5. Commands

- `npm run build` — runs `scripts/build-site.mjs`. **Mandatory after editing `ensaios/posts/*` .** Injects canonicals into registered top-level pages and regenerates all generated files.
- `npm run serve` — local preview at `http://localhost:3000`.
- `npm run optimize-image -- <input> <output-name> [maxWidth]` — `.jpg`+`.webp` pair into `assets/images/optimized/`.
- **Deploy:** `npx wrangler deploy` from repo root (assets-only worker "portfolio"). See §9 for the two-account gotcha and how to verify.

## 6. Routing / page structure

Filesystem-based, clean/extensionless URLs (Cloudflare `html_handling`; `serve.mjs` replicates locally):

| URL | File | Kind |
|---|---|---|
| `/` | `index.html` | hand-written (hero, works, archive, contact) |
| `/about` | `about.html` | hand-written |
| `/projects/<name>` | `projects/<name>.html` | hand-written (6) |
| `/teleprompter/` | `teleprompter/index.html` | hand-written **(LIVE)** |
| `/teleprompter/privacy` | `teleprompter/privacy.html` | hand-written **(LIVE)** |
| `/ensaios/` , `/ensaios/<slug>` | generated | build output |
| anything else | `404.html` | `not_found_handling` |

SEO registration is **centralized** in `TOP_LEVEL_PAGES` (top of `scripts/build-site.mjs`), feeding **both** sitemap and canonical injection. Active entries now include `teleprompter/index.html` → `/teleprompter/` (0.8) and `teleprompter/privacy.html` → `/teleprompter/privacy` (0.3). `projects/*.html` stay auto-discovered; essays auto-added.
**`upsertCanonical()` throws (build fails) if a registered page lacks `<meta name="theme-color" content="#0a0a0a">`.** Every new hand-written page must include that meta tag; do not hand-add a canonical (the build injects it after that meta). Pages in subdirectories must use **absolute** asset paths (`/css/styles.css`, `/assets/...`).

## 7. Components and styling

- **No components.** Header/nav and footer are **duplicated by hand** in every hand-written page (now ~11 files incl. the 2 teleprompter pages) **and** as a template (`renderHeader()`/`renderFooter()`) in the build script for essays. Any nav change touches ~11 files + the template. **Centralization deliberately deferred** until after launch (see §17).
- **No Teleprompter nav item was added.** The page is reached via an **archive card on the homepage** (`index.html`, `#archive` section, `class="archive-card"` linking `/teleprompter/`) and via the sitemap/direct URL. Nav is still the 4 items: `Projetos /#works · Ensaios /ensaios/ · Sobre /about · Contato /#contact`.
- **Single stylesheet** `css/styles.css` (base sections + a `/* --- Teleprompter page --- */` block appended at the end, ~165 lines, using `.teleprompter-*` classes; balanced braces/comments verified). Colors hardcoded, no CSS variables.

## 8. Assets / public files

- `assets/images/optimized/` — production `.jpg`/`.webp` pairs. Teleprompter v1 is **text-only** (no screenshots yet); OG image reuses `og-jvdias.jpg`.
- Heavy originals excluded from git and the deploy bundle. New local-only categories need adding to **both** `.gitignore` and `.assetsignore`.

## 9. Deployment / build notes  ← updated 2026-07-08

- **Cloudflare Workers static assets**, worker "portfolio", assets dir `.`, `not_found_handling: "404-page"`.
- **`wrangler.jsonc` now declares custom-domain routes** for `jvdiasfilms.com.br` and `www.jvdiasfilms.com.br` and sets `workers_dev: false` (both hostnames were already served via the dashboard; now in config). **This change is LIVE but not yet committed** (§3).
- **`.assetsignore`** now also excludes `docs/**`, `CLAUDE.md`, `.codex`, `AGENTS.md` (internal docs/tooling — confirmed `/docs/AI_HANDOFF.md` and `/AGENTS.md` return 404 in prod).
- `_headers` (Cloudflare): security headers + strict **CSP** (allowed origins: Cloudflare Insights, Google Fonts, Vimeo). Cache-control: `/assets/*` 30d, `/css/*` and `/js/*` **1 day**. Any new third-party origin needs a CSP edit here first.

**Deploy gotchas (all hit on 2026-07-08 — read before deploying):**
1. **Two Cloudflare accounts.** The production zone is **NOT** on account `0eeedcff1423e88eca16ba400d138322`; that account errored "Could not find zone". (The orphan "portfolio" worker it held was **deleted by the user on 2026-07-08**.) If deploy errors on the zone, `wrangler logout` → `wrangler login` to the account that owns the domain. `wrangler whoami` shows current.
2. **`.wrangler` temp-file leak — CLOSED (2026-07-08).** Wrangler writes `.wrangler/tmp/deploy-XXXX/no-op-worker.js(.map)` during deploy and the asset scanner used to publish them (was live **200**). Fixed by adding `.wrangler` to `.assetsignore` + `.gitignore` and redeploying; manifest-based sync pruned the leaked files. Verified: `.../no-op-worker.js` and `.js.map` now **404**; `/teleprompter/`, `/teleprompter/privacy`, `/` still **200**. **Keep `.wrangler` in both ignore files** — the temp files regenerate on every deploy.
3. **CSS cache after a new page.** `/css/*` is cached 1 day and the whole site shares one `styles.css`. After deploying a page with new CSS, **returning visitors keep the old cached stylesheet** → the new page looks unstyled/left-aligned. **Not a bug** — verify in an incognito window (renders fine); hard-refresh (Ctrl+Shift+R). Self-heals in 24h. This is why localhost never shows it (fresh cache, no long cache header from `serve.mjs`). This exact issue was diagnosed and cleared for `/teleprompter/` on 2026-07-08.

## 10. Visual / editorial style

Dark, cinematic, editorial-minimal. Background `#0a0a0a`, text `#eae6df`. Fraunces (h1–h3), Libre Baskerville (logo/section titles), Inter (UI). pt-BR, restrained, no marketing-speak. The Teleprompter page follows this register (masthead like the essays, sober badge CTA).

## 11. High-risk files or areas

| File / area | Why risky |
|---|---|
| `scripts/build-site.mjs` | Generates all SEO/essay output; `TOP_LEVEL_PAGES` + `SITE_URL` here. |
| `_headers` (CSP + cache) | Wrong CSP silently breaks prod (not reproduced locally). 1-day CSS cache causes the "unstyled new page" effect (§9.3). |
| Generated files | Hand edits lost on `npm run build`. |
| Nav/footer duplication | ~11 files + build template; partial edits desync pages. |
| `wrangler.jsonc` / `.assetsignore` / `.gitignore` | Control deploy + tracking. The `.wrangler` leak (§9.2) shows how easily junk ships. |
| Cloudflare account choice | Deploying from the wrong account fails or pollutes it (§9.1). |
| `ensaios/post.html`, `js/post-redirect.js`, `googlec051422149ae4b84.html` | Legacy/verification — do not delete. |

## 12. Current website goals

Portfolio + essays + a **product page for Teleprompter JVDias** (free Windows teleprompter app, **RELEASED on the Microsoft Store**: `https://apps.microsoft.com/detail/9PMJD1Q6Z6L0`). Preserve the strong SEO/perf posture. The Teleprompter launch is done end-to-end (pages, real Store CTA, deploy hygiene); what remains is optional polish only (§15 F).

## 13. Teleprompter pages — DONE (was: future placeholder)

- **Built & live:** `/teleprompter/` (masthead + "Para que serve" + recursos + controle pelo celular + privacidade + como baixar + FAQ) and `/teleprompter/privacy`. Content sourced strictly from `docs/TELEPROMPTER_PRODUCT_BRIEF.md`.
- **CTA links to the real Store listing** (swapped 2026-07-08, commit `264b7c3`): `https://apps.microsoft.com/detail/9PMJD1Q6Z6L0` — clean URL, no tracking/locale params (Store auto-detects). Two links on the page: masthead badge-link "Baixar na Microsoft Store" (`a.teleprompter-availability`, hover/focus rules added at the end of the Teleprompter CSS block) and a `teleprompter-text-link` in "Como baixar". **No CSP change was needed** — an outbound link is a navigation target, not a loaded resource. If the official MS badge *image* is ever adopted, add `get.microsoft.com` to `img-src` in `_headers` or self-host it.
- JSON-LD `SoftwareApplication` on the product page (price 0, `operatingSystem: Windows`); now includes `downloadUrl` + `installUrl` (both = Store listing URL); no `aggregateRating`.
- Constraints honored from brief §16 (don't claim: already on Store, has public URL, approved, other platforms).

## 14. Privacy policy — DONE

`/teleprompter/privacy` is live, app-scoped, contact `joaodias@jvdias.com`, "Última atualização: 8 de julho de 2026". **Partner Center: DONE (2026-07-08)** — privacy-policy URL set to `https://jvdiasfilms.com.br/teleprompter/privacy`; the Store-listing update propagates automatically once it clears certification.

## 15. NEXT STEPS (for the next session — start here)

**All of A–E: ✅ DONE (2026-07-08):**

- **A. `.wrangler` leak** — `.wrangler` added to `.assetsignore` + `.gitignore`, redeployed; leaked files now 404 (§9.2).
- **B. Deploy config committed** — `f5bce28` "Declare custom domain routes; exclude .wrangler from deploy and git".
- **C. Pushed** — `master` == `origin/master`.
- **D. External** — Partner Center privacy URL set (propagates once the listing update clears certification); orphan worker on account `0eeedcff…` deleted.
- **E. Store CTA** — app **RELEASED** (`https://apps.microsoft.com/detail/9PMJD1Q6Z6L0`); CTA, "Como baixar", JSON-LD (`downloadUrl`/`installUrl`) and homepage card swapped in `264b7c3`; deployed and verified live (Store URL ×4 in served HTML, zero "Em breve" left, new CSS on edge).

**F. Remaining (all optional, no urgency):**
- Commit `docs/AI_HANDOFF.md` (this file) — docs-only commit; its diff includes a whole-file line-ending normalization, expected.
- Cosmetic churn (`ensaios/*.html` + `robots.txt` CRLF-only; `feed.xml` `lastBuildDate`) — discard or commit anytime.
- Screenshots for the product page (`npm run optimize-image`) — v1 is text-only.
- Nav item for Teleprompter — still deferred with nav/footer centralization (§17); page is reached via the homepage archive card.
- English version of product/privacy pages (site is pt-BR).
- If the official MS badge *image* is ever adopted: CSP `img-src` change or self-host (§13).

## 16. Open questions

1. Nav item for Teleprompter, or keep the archive-card link only? (Nav item = ~11-file edit; deferred with nav/footer centralization.)
2. Screenshots for the product page (v1 is text-only)?
3. English version of the product/privacy pages for the Store listing? (Site is pt-BR.)
4. ~~Real Microsoft Store URL~~ — **RESOLVED 2026-07-08**: `https://apps.microsoft.com/detail/9PMJD1Q6Z6L0` (CTA live). GitHub Release URL still unknown and not used on the site.

## 17. Decision log

- **2026-07-07** — Handoff created (analysis-only). `TOP_LEVEL_PAGES` structural prep ("Option B") implemented in the build script. Teleprompter URL structure approved (`teleprompter/` dir). Nav/footer centralization ("Option C") deferred until after launch.
- **2026-07-08** — Teleprompter `/teleprompter/` + `/teleprompter/privacy` built (Codex), verified (9/9 acceptance criteria), committed (`85a6649`), and **deployed live**. Homepage archive card links to the page; no nav item added. CTA is provisional text (no Store URL).
- **2026-07-08** — Internal docs/tooling excluded from the deploy bundle (`19b82e9`); confirmed `/docs/*` and `/AGENTS.md` now 404 in prod.
- **2026-07-08** — `wrangler.jsonc` given custom-domain routes + `workers_dev:false` to fix a deploy that failed with no routes; deployed from the **correct** Cloudflare account after the first attempts hit the wrong one (`0eeedcff…`, now holds an orphan worker).
- **2026-07-08** — Diagnosed a "page looks unstyled in prod" report as **browser CSS cache** (1-day `/css/*` cache serving the pre-Teleprompter stylesheet), not a code bug; cleared via incognito/hard-refresh. Recorded as gotcha §9.3.
- **2026-07-08** — Stopped for the day (user credits low) with the `.wrangler` leak fix, the `wrangler.jsonc` commit, and the push still pending (see §15).
- **2026-07-08 (resume)** — Re-verified repo/prod state (leak still 200). Codex added `.wrangler` to `.assetsignore` + `.gitignore` (diff audited clean, +1 / +3 lines, no other files touched). User redeployed (`npx wrangler deploy`, Version `b5fdf3ab`); **leak CLOSED** — `.../no-op-worker.js(.map)` now 404, `/teleprompter/`, `/teleprompter/privacy`, `/` still 200. User then committed the deploy config (`f5bce28`) and pushed.
- **2026-07-08 (late)** — **Teleprompter JVDias RELEASED on the Microsoft Store**: `https://apps.microsoft.com/detail/9PMJD1Q6Z6L0`. Site updated (Codex, audited 9/9): masthead CTA → badge-link "Baixar na Microsoft Store", "Como baixar" → available + text link, JSON-LD + `downloadUrl`/`installUrl`, homepage card → "Disponível na Microsoft Store", hover/focus CSS for the badge-link. Clean Store URL (no tracking/locale params); no CSP change needed (outbound link). Committed (`264b7c3`), deployed, pushed, and verified live. Externals done the same day: Partner Center privacy URL set (awaiting certification propagation); orphan worker on `0eeedcff…` deleted. **§15 A–E all closed; only optional polish remains (§15 F).**
