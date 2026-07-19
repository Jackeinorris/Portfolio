# Relatório de análise frontend — jvdiasfilms.com.br

- **Data**: 2026-07-18
- **Autor**: Kimi (analista frontend) — relatório para auditoria e conversão em ciclos de implementação
- **Escopo**: UX/hierarquia, responsividade (360/720/1280px), acessibilidade, performance percebida, consistência visual e de microcopy
- **Método**: leitura integral do repositório (`css/styles.css` 2.449 linhas, `js/main.js`, `js/post-redirect.js`, 19 páginas HTML) + paridade repo↔produção por fetch + **verificação renderizada no site publicado** via Kimi WebBridge (emulação CDP 360×800@2x, 720×900, 1280×900; 14 screenshots em `tmp/shots/`; medições por `getBoundingClientRect`/`getComputedStyle`)
- **Restrições respeitadas**: nenhuma proposta envolve framework, bundler, reescrita de arquitetura, mudança de identidade visual, novos terceiros ou backend. Invariantes preservados: `aria-current` no nav, footer idêntico, HTMLs de `/ensaios/` gerados por build, `prefers-reduced-motion`.

Legenda de evidência: **[medido]** = verificado em renderização real · **[código]** = derivado de arquivo:linha · **[calculado]** = computado a partir de valores do código.

---

## Achados (ordenados por severidade)

### A1 — Faixa de cartazes de Aprendi Vivendo ilegível em telas pequenas

- **Onde**: `/projects/aprendi-vivendo` (e, em menor escala, o card da home), viewports ≤720px — crítico em ~360px
- **Evidência**: a faixa é uma única imagem composta 2400×864 (`aprendi-vivendo-strip.jpg`, 287 KB) com `width: 100%`, sem adaptação por viewport — sem galeria, scroll-snap, `srcset` alternativo ou recorte mobile **[código: `projects/aprendi-vivendo.html:234-240`; `css/styles.css:1006-1022`; o seletor não aparece em nenhum breakpoint]**. Medido em renderização real: **360px → 320×115px, 64px por cartaz (ilegível); 720px → 133px/cartaz; 1280px → 187px/cartaz (legível)** **[medido]**. A `figcaption` com o contexto está visualmente oculta por clip **[código: `styles.css:1024-1034`]**. A thumb da home usa a mesma composição (~60px/cartaz a 360px) **[medido: `tmp/shots/home-360-works-real.jpg`]**.
- **Impacto**: **alta** — o material central do projeto mais recente some para o visitante mobile.
- **Sugestão**: gerar recortes individuais dos cinco cartazes (pipeline `optimize-image` já existe) e, em telas pequenas, empilhá-los ou servir versão pensada para retrato; exibir a legenda visivelmente. Cobrir também a thumb da home se a composição continuar sendo usada ali.
- **Esforço**: médio

### A2 — Textos "meta" pequenos abaixo (ou no fio) do contraste AA

- **Onde**: todas as páginas (rodapé), home (metadados dos cards), kickers de seção — todos os viewports
- **Evidência**: texto `#eae6df` sobre `#0a0a0a` com `opacity` reduzida: links do rodapé `opacity: 0.45` a 0.82rem → **~3,8:1**; `.archive-meta` 0.45 → ~3,8:1; `.contact-kicker`/`.not-found-kicker` 0.45; `.work-meta` 0.5 → ~4,5:1, no fio **[código: `styles.css:750-753`, `:645`, `:677`, `:789`, `:498`] **[calculado]** (composição canal a canal)**. WCAG AA pede 4,5:1 para texto <18px.
- **Impacto**: **média** — links de navegação do rodapé e metadados de todos os cards, para leitores com baixa visão ou telas em ambiente claro.
- **Sugestão**: elevar a opacidade desses textos para ~0.65–0.7 (preserva hierarquia e passa de 4,5:1 com folga); reservar opacidades <0.5 a elementos puramente decorativos (separadores `·`).
- **Esforço**: pequeno

### A3 — Alvos de toque/clique abaixo do mínimo em CTAs de contato e links de rodapé

- **Onde**: `/#contact` e `404.html`, rodapé em desktop, CTAs do hero no mobile
- **Evidência**: `.contact-actions a`/`.not-found-actions a` só com `padding-bottom: 3px` → alvo efetivo ~20px **[código: `styles.css:701-711`, `:815-825`]**, abaixo do mínimo de 24×24px do WCAG 2.2 AA e longe dos ~44px para toque. `.hero-action` com `min-height: 40px` no mobile **[código: `:1858-1863`]**. Nav e rodapé em desktop sem padding (~15px) **[código: `:91-101`, `:747-757`]**.
- **Impacto**: **média** — o CTA final de conversão (e-mail/LinkedIn) é o alvo mais difícil de acertar no site.
- **Sugestão**: aumentar a área clicável com padding vertical real nos links de contato e rodapé (preservando o visual de link sublinhado), mirando ≥24px no geral e ~44px nos CTAs mobile.
- **Esforço**: pequeno

### A4 — Grão fílmico: custo potencial de compositing em desktops fracos

- **Onde**: todas as páginas, viewports >720px
- **Evidência**: `body::after` fixo com `inset: -100%` (área 3× a viewport), `z-index: 9999`, `mix-blend-mode: overlay`, `grain-shift 0.9s steps(8) infinite`, sem `will-change` **[código: `styles.css:2420-2443`]**. Blend recompõe sobre todo o conteúdo ~9×/s, inclusive sobre iframes de vídeo em reprodução. Corte por largura confirmado em renderização: `animation-name: none` a 360px, `grain-shift` ativo a 1280px **[medido]**. `prefers-reduced-motion` já o neutraliza **[código: `:1753-1766`]**.
- **Impacto**: **média (potencial — não medido com profiler)** — jank/bateria em máquinas fracas; confirmar antes de otimizar.
- **Sugestão**: medir com profiler do DevTools; se confirmado, promover a camada ao compositor, restringir o blend à área visível ou pausar a animação com player ativo.
- **Esforço**: pequeno-médio

### A5 — [BUG] Redirect legado de ensaios termina em URL com `.html`

- **Onde**: `/ensaios/post.html?slug=foo` → `/ensaios/foo.html`
- **Evidência**: `window.location.replace(`${slug}.html`)` **[código: `js/post-redirect.js:5`]** — a URL final exibida tem extensão, enquanto links internos, canonical e sitemap usam a forma limpa `/ensaios/foo` (resolvida pelo `html_handling`; `serve.mjs` replica localmente). O `AGENTS.md` descreve o redirect como indo para a URL limpa — divergência comportamento×documentação.
- **Impacto**: **baixa** — higiene de URL; canonical mitiga SEO.
- **Sugestão**: redirecionar para a forma sem extensão (`./${slug}`).
- **Esforço**: pequeno (uma linha)

### A6 — `aria-current` inconsistente no nav do header

- **Onde**: páginas de projeto, posts de ensaio, `/teleprompter/privacy` vs. demais
- **Evidência**: projetos usam `aria-current="true"` num link para outra página com âncora **[código: `projects/ana-maria-braga.html:158` e equivalentes]**; posts de ensaio `"true"` vs. `ensaios/index.html:152` `"page"`; `teleprompter/privacy.html:74` `"true"` vs. `teleprompter/index.html:97` `"page"`. Indicador visual funciona **[medido: sublinhado correto por página nos screenshots]**.
- **Impacto**: **baixa** — anúncio inconsistente em leitores de tela.
- **Sugestão**: padronizar o valor (idealmente `"page"`) mantendo o posicionamento atual — preserva o invariante do projeto.
- **Esforço**: pequeno

### A7 — Convenção de setas e CTAs inconsistente (↗ em links internos)

- **Onde**: home, páginas de projeto, `/teleprompter/`
- **Evidência**: `↗` (convenção implícita de link externo) em links internos/âncoras **[código: `index.html:194`, `:237`; `projects/breach-the-abyss.html:191` — único CTA também sem a preposição "ao"]**; mesmo destino externo com dois tratamentos **[código: `teleprompter/index.html:111` sem seta vs. `:150` com `→`]**; "Política de Privacidade →" interno com seta **[código: `:144`]**; aria-labels dos players divergentes ("Reproduzir vídeo: X" ×5 vs. "Assistir ao documentário…", `index.html:229`).
- **Impacto**: **baixa** — wayfinding sutil quebrado.
- **Sugestão**: fixar convenção (↗ = externo; → ou nada = interno) e aplicar em uma passada; uniformizar labels.
- **Esforço**: pequeno

### A8 — Microcopy: capitalização e mistura de idiomas sem regra visível

- **Onde**: home, `/about`, `/ensaios/`, `/teleprompter/`, meta descriptions
- **Evidência**: "Projetos Selecionados" em Title Case vs. sentence case no resto **[código: `index.html:205`]**; "The Drama: Entre…" com maiúscula após dois-pontos vs. demais ensaios **[código: `ensaios/index.html:196`]**; anglicismos convivendo com equivalentes do próprio site — "Branded content" vs. "conteúdo de marca" **[código: `index.html:270` vs. `:271`]**, "Lead Artist"/"Producer" **[`:324`,`:341`]**, "Game Development" **[`about.html:187`]**, "Case de…" nas meta descriptions **[`projects/breach-the-abyss.html:7` e equivalentes]**.
- **Impacto**: **baixa** — desgaste sutil da voz editorial.
- **Sugestão**: tábua mínima de regras (sentence case; termo único por conceito) e uma passada de revisão.
- **Esforço**: pequeno

### A9 — Capas de ensaio: `alt` vazio no índice e redundante nos posts

- **Onde**: `/ensaios/` e posts gerados (template de build)
- **Evidência**: cinco capas do índice com `alt=""` **[código: `ensaios/index.html:174,192,210,228,246`]** — defensável em card com título adjacente, mas são imagens editoriais; nos posts, o `alt` repete literalmente o `<h1>` **[código: `carlota-…html:131` vs. `:135`, mesmo padrão nos demais]** — leitor de tela ouve o título duas vezes.
- **Impacto**: **baixa** — ruído/redundância, sem perda de navegação.
- **Sugestão**: decidir a regra no template de build (índice: decorativa ou descritiva; post: descrever a imagem em vez de repetir o título) — ajuste único no gerador.
- **Esforço**: pequeno

### A10 — Player lazy: área clicável maior para mouse que para teclado

- **Onde**: home (works/arquivo) e páginas de projeto com vídeo
- **Evidência**: listener na `div.work-lazy` inteira com `cursor: pointer`, sem `role`/`tabindex` **[código: `js/main.js:35-37`; `styles.css:383,583`]**; existe `<button class="play-btn">` real com aria-label que dispara a mesma ação por bubbling — operável por teclado, mas a affordance "clique em qualquer lugar" só existe para mouse. `iframe.focus()` mitiga a remoção do botão focado **[código: `main.js:32`]**.
- **Impacto**: **baixa** — inconsistência de affordance, sem bloqueio funcional.
- **Sugestão**: manter o botão como gatilho semântico documentado, ou estender a área de teclado ao contêiner; evitar que o cursor prometa mais que a semântica.
- **Esforço**: pequeno

---

## Top 5 priorizado (impacto ÷ esforço)

1. **A1** — único achado de severidade alta; o projeto-carro-chefe depende dele no mobile.
2. **A2** — poucos valores em um único arquivo, benefício em todas as páginas.
3. **A3** — esforço pequeno, ganho direto no CTA de conversão.
4. **A5 [BUG]** — impacto baixo, mas é bug e custa uma linha.
5. **A6** — padronização mecânica que fecha a higiene de acessibilidade do nav.

## Sugestão de agrupamento em ciclos (para o auditor)

- **Ciclo 1 (A1)**: recortes + markup/CSS da faixa mobile (+ thumb da home se aplicável). Pré-requisito para a medida de LCP.
- **Ciclo 2 (A2+A3)**: passada única de CSS — opacidades de texto meta + áreas clicáveis.
- **Ciclo 3 (A5+A6+A7)**: micro-correções — redirect, `aria-current`, convenção de setas/labels.
- **Ciclo 4 (A8)**: revisão de microcopy com tábua de regras.
- **Ciclo 5 (A9)**: regra de `alt` no template de build dos ensaios.
- **Sob demanda**: A4 (medir primeiro), A10 (junto de algum ciclo que toque os players).

## Observações menores (sem ficha completa)

- **Perf percebida de imagens (a validar)**: nas capturas, áreas de imagem ficaram como caixas escuras por alguns segundos (hero de `versao-brasileira`, faixa a 360px, thumbs da home, capas de ensaios). Em parte artefato do ambiente de teste (cache frio + rolagem instantânea), mas o modo de falha é visível — sem placeholder além do `#141414` — e a faixa (287 KB) é a imagem de conteúdo mais pesada do site. Medir LCP mobile com Lighthouse/WebPageTest antes de agir; variantes por viewport (exigidas por A1) tenderiam a resolver.
- **Header mobile**: `fixed`→`absolute` ≤720px **[código: `styles.css:1810`]** — sem nav persistente em páginas longas; logo + nav em duas linhas ocupam ~1/4 da primeira dobra nas internas **[medido: `versao-360.jpg`, `about-360.jpg`]**. Há o "← Voltar"; registrar como escolha a revisar.
- **Cadeia anterior/próximo circular**: do projeto mais novo, "Anterior" leva ao mais antigo (Breach the Abyss); consistente como loop, potencialmente confuso como rótulo — considerar ocultar "Anterior" no primeiro da cadeia.
- **Corpo dos ensaios plano**: só `<p>` em textos longos (o Markdown do build já suporta `##`/`###`) — escaneabilidade.
- **Separador de `<title>` inconsistente**: projetos "… — … | J. V. Dias" vs. demais "… — J. V. Dias".
- **`ensaios/post.html` legado** sem meta description, skip-link e landmarks — redirect instantâneo, impacto quase nulo.
- **Libre Baskerville** (2 pesos) quase só para logo/títulos de seção/rodapé — família inteira para poucos glifos; avaliação de custo/benefício.
- **`.project-details`** sem `flex-wrap` entre 721–900px **[código: `styles.css:1105-1111`]** — aperta, sem overflow.
- **Higiene de CSS** (não é proposta de reescrita): blocos `.ensaio-nav*`/`.project-nav*` quase idênticos, `.work-link::after` definido duas vezes, quatro blocos `@media (max-width: 720px)` separados — consolidação futura dentro do CSS único.

## Verificado e correto (não re-sinalizar)

`lang="pt-BR"` e meta viewport em 19/19 páginas; um `<h1>` por página, sem saltos de hierarquia; landmarks completos + skip-link funcional em 19/19; `:focus-visible` global sem `outline: none`; `prefers-reduced-motion` com cobertura global (CSS, view transitions e smooth-scroll do JS); players lazy-por-clique sem iframe no markup inicial, criados com `title`, `loading="lazy"` e `referrerPolicy`; nenhum autoplay; todas as imagens do site principal com `alt` e `width`/`height`; nenhum ID duplicado; nenhuma âncora interna quebrada; **nenhum overflow horizontal — medido `scrollWidth == innerWidth` a 360px nas 6 páginas principais**; corte do grão por largura confirmado em renderização; fontes com `display=swap` + `preconnect`; hero com `preload` + `fetchpriority="high"`; pares jpg/webp otimizados (4 MB, lazy).

## Artefatos desta análise

- Screenshots: `tmp/shots/*.jpg` (14 capturas; `tmp/` é local-only)
- Roteiros de captura reproduzíveis: `tmp/wb_drive.py` (navegação + screenshots), `tmp/wb_measure.py` (medições), `tmp/wb_shots2.py` (capturas com rolagem instantânea)
- Para regressão visual após cada ciclo: re-rodar os roteiros e comparar com esta rodada.
