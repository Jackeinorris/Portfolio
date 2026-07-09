# AI_HANDOFF.md — JVDias Films portfolio site

## 1. Freshness warning

Last updated **2026-07-09 (night)**. The **Teleprompter app is RELEASED on the Microsoft Store** (`https://apps.microsoft.com/detail/9PMJD1Q6Z6L0`); the **§18 UX backlog is COMPLETE** (Cycles 1–4), and the **about-portrait refresh is DONE and verified live**: new editorial portrait `foto-sobre` site-wide + widescreen soft-edged `/about` hero (§7/§8/§17). Latest commit `5b18c1e` — **everything committed, pushed and deployed**; working tree clean except this handoff after its own update. **Active workstream: the user announced a "works and profile" update (2026-07-09) — profile is done, the works half is NOT yet scoped (ask what he wants for the projects section).** Also pending: mobile-legibility verdict on the new hero (§15 F) and deleting the old `foto-perfil` pair after ~2026-08-08. Before acting, re-verify with `git status` / `git log -6 --oneline`. File paths and CSS/build-script line references may drift.

## 2. Working mode (orchestrator pipeline)

Since 2026-07-07 the work runs as a multi-agent pipeline — **read this before doing anything**:

- **Claude (this assistant)** = key orchestrator: analyzes context, writes implementation **plans** (fixed 10-section format), flags risks, defines order, explains decisions, **and writes the ready-to-paste operational prompt for Codex** each cycle. Claude does **not** edit site code / commit / push unless the user explicitly asks. (Exception in practice: Claude may edit *its own* internal docs like this handoff and the memory, since those are advisory artifacts, not deployed site code.)
- **Codex** executes file edits in the repo from Claude's prompt; does not commit/push.
- **User** reviews, commits, pushes, runs `wrangler deploy`, and does external actions (Partner Center, Cloudflare dashboard).
- After each Codex report, Claude audits it against the plan's acceptance criteria and produces the next prompt.

## 3. Current repo state (2026-07-08)

- Branch `master`. Repo: `https://github.com/Jackeinorris/Portfolio.git`.
- **`master` == `origin/master`** at `5b18c1e` "Replace about portrait with editorial widescreen hero, soft edges" — deployed + verified live 2026-07-09 (`optimized/foto-sobre.jpg` 200; `A2_*` sources and `Foto Final.png` 404; `/about` serving 5 `foto-sobre` refs). Recent: `3fea96d` handoff (Cycle 4 closed), `09cdd09` UX Cycle 4 (footer nav), `bf2921b` UX Cycle 3 (mobile nav), `79e5812` UX Cycle 2 (prev/next on projects).
- **Uncommitted:** only this handoff (`docs/AI_HANDOFF.md`, advisory doc — safe to commit alone or with the next cycle). Working tree otherwise clean; the old CRLF churn was absorbed in UX Cycle 1's build.
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

- **No components.** Header/nav and footer are **duplicated by hand** in every hand-written page (~11 files incl. the 2 teleprompter pages) **and** as a template (`renderHeader()`/`renderFooter()`) in the build script for essays. Any nav/footer change touches ~11 files + the template. **Centralization decided against on 2026-07-09** (see §17) — remaining churn was finite and `aria-current` makes the header nav page-specific anyway.
- **Footer since UX Cycle 4 (2026-07-09):** three centered rows — name → `nav.footer-nav` with `aria-label="Rodapé"` (Projetos `/#works` · Ensaios · Teleprompter · Sobre) → contact (`.footer-links`: email · LinkedIn). **Byte-identical on every page, deliberately with NO `aria-current`** (location is the header nav's job; keeps the 17 copies desync-proof — verify with a hash check when auditing). `.footer-nav` piggybacks on the `.footer-links` selectors; at ≤720px it wraps horizontally with touch padding while `.footer-links` stacks vertically.
- **About hero since 2026-07-09 (portrait refresh):** single-column widescreen photo hero on `/about` — `.about-photo` is 16:9 at full content width, order photo → title → intro (mirrors essay covers). Image is served clean: the old `filter: brightness/contrast` was removed (portrait is graded at source). **Soft edges:** mask feather (48px desktop / 24px ≤720px; `-webkit-mask-image` + standard, `mask-composite: intersect`) + `::after` inset vignette (`box-shadow inset` 120px / 60px in `rgba(10,10,10,0.9)`) dissolve the frame into the page background. **Do not re-add a `background` to `.about-photo`** — it would show through the faded edges.
- **Nav has 5 items since UX Cycle 1 (2026-07-08):** `Projetos · Ensaios · Teleprompter (/teleprompter/) · Sobre · Contato` — **visible at all viewports since UX Cycle 3 (2026-07-09)**. At ≤720px the header stacks masthead-style: `position: absolute` (scrolls away with the page — deliberate, a fixed ~130px bar would eat ~20% of a small viewport), logo centered on top, links below centered with `flex-wrap` and touch padding (`0.7rem 0.5rem`, `display: inline-block`); internal pages' mobile top paddings were bumped 6rem→8.5rem to clear the taller header. **Since Cycle 3 the nav is NOT identical across pages:** the current section's link carries `aria-current="page"` (exact page — Sobre on `/about`, Teleprompter on `/teleprompter/`, Ensaios on `/ensaios/`) or `aria-current="true"` (section — Projetos on `projects/*`, Teleprompter on `/teleprompter/privacy`, Ensaios on essay posts); `index.html` and `404.html` carry none. Active style: `.nav-links a[aria-current]` (subtle underline, base CSS). `renderHeader(ariaCurrentEnsaios)` in the build script takes `"page"` (essay index) / `"true"` (posts). **Never copy a nav block between pages without fixing `aria-current`.** The homepage has a `#product` "Produto" strip between `#works` and `#archive` (`.product-*` classes) with the Store CTA + link to `/teleprompter/`; the old text-only archive card was removed (Arquivo has 2 cards again).
- **Single stylesheet** `css/styles.css` (base sections + a `/* --- Teleprompter page --- */` block appended at the end, ~165 lines, using `.teleprompter-*` classes; balanced braces/comments verified). Colors hardcoded, no CSS variables.

## 8. Assets / public files

- `assets/images/optimized/` — production `.jpg`/`.webp` pairs. Teleprompter v1 is **text-only** (no screenshots yet); OG image reuses `og-jvdias.jpg`.
- **Profile image since 2026-07-09:** `optimized/foto-sobre.jpg/.webp` (1800×1013, 119/82 KB) — used by the `/about` hero + og:image and by **every** Person JSON-LD (hand-written pages + `PROFILE_IMAGE` in the build script → generated essays). Master is local-only: `assets/images/A2_04674-editorial-dramatic-6k.jpg` (6000×3376). **Old `foto-perfil.jpg/.webp` are unreferenced but deliberately still deployed** (stale og caches on WhatsApp/LinkedIn) — delete after ~2026-08-08. All session source photos are ignore-guarded by `assets/images/A2_*` and `assets/images/Foto Final.png` in **both** ignore files (verified 404 in prod — never leaked).
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
- **UX backlog (§18) — COMPLETE** (Cycles 1–4 all live). Only unscheduled minor items remain: product-page screenshots (needs user material), possible "Arquivo" section rename.
- **Works update — announced by the user 2026-07-09 ("update nos meus trabalhos e perfil"), profile half done, works half NOT scoped yet.** Start the next session by asking what he wants for the projects section.
- **Mobile legibility of the new about hero** (16:9 at 360px ≈ 203px tall): user hasn't given a verdict; if faces read too small, add an art-directed tighter crop for ≤720px via `<source media>` (the 6000px master gives plenty of room).
- **Delete `optimized/foto-perfil.jpg/.webp` after ~2026-08-08** (og-cache grace period ends; they're unreferenced since `5b18c1e`).
- Screenshots for the product page (`npm run optimize-image`) — v1 is text-only.
- English version of product/privacy pages (site is pt-BR).
- If the official MS badge *image* is ever adopted: CSP `img-src` change or self-host (§13).
- ~~Cosmetic CRLF churn~~ — absorbed when `npm run build` rewrote the generated files in UX Cycle 1.

## 16. Open questions

1. ~~Nav item for Teleprompter?~~ — **RESOLVED 2026-07-08 (UX Cycle 1)**: added to all navs (desktop/tablet; hidden ≤720px until the mobile-nav rework, §18 Cycle 3).
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
- **2026-07-08 (UX Cycle 1)** — UX audit of the whole site produced the prioritized backlog in §18. Cycle 1 executed (Codex, audited 6/6), deployed, and verified live: homepage `#product` "Produto" strip (between `#works` and `#archive`, `.product-*` CSS block at end of `styles.css`), "Teleprompter" nav item on all 11 hand-written pages + `renderHeader()` (18 occurrences; hidden ≤720px pending Cycle 3), weak text-only archive card removed. `npm run build` re-ran (generated navs updated; old CRLF churn absorbed). User decisions: nav item YES; remove archive card YES.
- **2026-07-08 (UX Cycle 2)** — Prev/next nav added to the 6 project pages (Codex, audited 12/12 hrefs + 12/12 titles): `.project-nav-*` CSS mirroring `ensaio-nav` (end of `styles.css`, own ≤720px query), looping chain in homepage order (VB → CV → Frutap → Friboi → Zen → Breach → VB), block inside `.project-info` after `.project-details`, `aria-label="Outros projetos"`. No build needed (hand-written pages only). Deployed and verified live (chain checked at both loop endpoints, 6/6 pages 200).
- **2026-07-09 (Cycle 3 decision)** — **Nav/footer centralization ("Option C") definitively skipped for Cycles 3–4**: remaining churn is finite (two mechanical passes), centralization would touch the highest-risk file (`build-site.mjs`) and blur the hand-written/generated boundary, and `aria-current` makes the nav page-specific anyway (a shared template would need per-page parameterization). Revisit only if English page versions or continued nav churn materialize.
- **2026-07-09 (UX Cycle 3)** — Mobile nav rework shipped (`bf2921b`), deployed and verified live (360×740 + desktop, incognito). At ≤720px: header stacks (logo top, links centered, `flex-wrap`), `position: absolute` so it scrolls away (a fixed ~130px bar over a to-transparent gradient was rejected), touch padding on links, Teleprompter item re-shown (`display:none` removed), duplicate `.nav-links` gap rule removed, internal pages' mobile top padding 6rem→8.5rem (note: `.teleprompter-page`'s lives in its own ≤640px query — checked, no gap in 641–720px). `aria-current` active states everywhere (`page`/`true` semantics, §7): 9 hand-written pages edited + `renderHeader(ariaCurrentEnsaios)` parameterized + `npm run build`. Audit caught one blocker in Codex's first pass — the mobile `.nav` rule was missing `flex-direction: column` (header wouldn't stack) — fixed in a follow-up pass before commit; everything else matched the plan exactly (grep counts `page`=3, `true`=12).
- **2026-07-09 (UX Cycle 4 — backlog complete)** — Footer wayfinding shipped (`09cdd09`, deploy `f660a3f3`), verified live. Footer became three rows: name → `nav.footer-nav` (Projetos/Ensaios/Teleprompter/Sobre — "Sobre" moved out of the contact row; no "Contato" link since the email sits right below) → contact (email/LinkedIn). Kept **byte-identical on all pages with no `aria-current`** (§7). CSS via extended `.footer-links` selectors + mobile wrap/touch rules. Audit caught a mangled LinkedIn anchor in Codex's first pass — `target="rer"` (the block paste ate `_blank" rel="noopener noreferre`), propagated to all 17 footers + `renderFooter()` — fixed via **literal search-replace** in 12 files + rebuild, re-verified string-exact and hash-identical. **Pipeline lesson (2nd cycle in a row): Codex block-pastes can silently mutilate attributes — audit diffs string-exact and write fix prompts as literal search-replace, not block re-pastes.**
- **2026-07-09 (About portrait refresh)** — New editorial portrait shipped (`5b18c1e`), deployed and verified live (foto-sobre 200; `A2_*`/`Foto Final.png` 404; `/about` serving 5 new refs; `master` == `origin/master`). Frame chosen: `A2_04674-editorial-dramatic-6k.jpg` (**direct gaze**, dog beside him, 6000×3376 master, local-only) — picked over a looking-away variant because eye contact fits an about page; the wide 16:9 tableau (curated objects as visual bio) drove the hero rework. Claude ran the image pipeline itself (`optimize-image` at **1800px** → 119 KB jpg / 82 KB webp; **new filename `foto-sobre`** to dodge the 30-day `/assets/*` cache). `.about-hero`: 4:5 side column → single-column 16:9 full width (photo → title → intro); CSS `filter` dropped (portrait graded at source). **Soft edges added after a scratchpad `file://` HTML comparator** with 4 variants on the real image — user picked vignette + fade (mask feather + `::after` inset shadow, mobile-scaled values); `border-radius` rejected (site is hard-geometry). All `foto-perfil` refs swapped via literal search-replace (15 in hand-written + build script; 0 left); old pair kept deployed for og caches (delete ~2026-08-08). **Ignore guard (`assets/images/A2_*`, `Foto Final.png`) added before any deploy could leak ~35 MB of session sources** — prod checked, nothing ever went live. Codex executed cleanly (one benign deviation, `gap: 2rem`, accepted). Open: mobile-legibility verdict on the hero; the "works" half of the announced update.

## 18. UX backlog (2026-07-08 audit — COMPLETE 2026-07-09)

Prioritized findings from a full-site UI/UX review (home, about, project page, ensaios, teleprompter, JS, CSS incl. breakpoints). Work runs in cycles via the §2 pipeline.

| Cycle | Item | Status |
|---|---|---|
| 1 | Teleprompter as first-class product: home `#product` strip + nav item + remove archive card | ✅ DONE (2026-07-08, verified live) |
| 2 | Prev/next navigation on the 6 `projects/*.html` pages — `.project-nav-*` classes mirroring `ensaio-nav`, looping chain in homepage order, inserted inside `.project-info` after `.project-details` | ✅ DONE (2026-07-08, verified live) |
| 3 | Mobile nav rework: stacked masthead header ≤720px (`position: absolute`, scrolls away), touch padding on links, Teleprompter item re-shown, `aria-current` active states (`page`/`true`, see §7), mobile top paddings 6rem→8.5rem | ✅ DONE (2026-07-09, verified live) |
| 4 | Footer wayfinding: `footer-nav` row (Projetos/Ensaios/Teleprompter/Sobre) between name and contact rows; byte-identical on all pages, no `aria-current` (§7) | ✅ DONE (2026-07-09, verified live) |
| — | Minor: consider renaming "Arquivo" section; product-page screenshots (needs user material) | unscheduled |

Notes: **backlog complete.** Nav/footer centralization was decided against on 2026-07-09 (§17). Any header-nav edit must respect the per-page `aria-current` (§7); the footer must stay byte-identical everywhere (no `aria-current` there).
