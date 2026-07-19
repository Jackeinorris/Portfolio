# AI_HANDOFF.md — portfólio J. V. Dias

## Estado atual

Atualizado em **19 de julho de 2026**.

O portfólio está publicado em [jvdiasfilms.com.br](https://jvdiasfilms.com.br), hospedado como site estático no Cloudflare Workers. A atualização de trabalhos de julho de 2026 está no ar, incluindo as páginas de **Aprendi Vivendo** e **Versão Brasileira**. Não há freeze de atualização ativo.

Em 2026-07-19 foram implementados, commitados, **pushados e deployados** três ciclos de correção derivados da auditoria frontend de 2026-07-18 (`docs/FRONTEND_AUDIT_2026-07-18.md`, relatório da Kimi auditado pelo Claude): galeria de cartazes individuais no Aprendi Vivendo (A1, commit `f5b11bd`), contraste AA + alvos de toque (A2/A3, `463f4e8`) e redirect legado de ensaios + labels de players (A5/A7 parcial, `dbbdc9c`). Em 2026-07-19 o histórico do git foi reescrito para remover trailers "Co-Authored-By" — hashes antigos citados em outros documentos podem estar defasados. Deploy verificado em produção (`aprendi-vivendo-ep1.jpg` responde 200). Sobre o cache de 1 dia de `/css/*`: a página do Aprendi Vivendo fura o cache via `?v=20260719-1`; as demais páginas se curam em até 24h para visitantes recorrentes.

Antes de começar qualquer trabalho, confira `git status` e `git log --oneline -6`.

## Conteúdo publicado recentemente

- **Aprendi Vivendo** — página da série documental da AMB Digital com Ana Maria Braga. Crédito: assistência geral; cinco diárias, apoio a direção e produção, logística de equipamentos, set, monitor de direção, baterias e organização de mídia.
- **Versão Brasileira** — página do documentário da Farol Filmes. Créditos: assistência de direção, produtor assistente, operador de câmera e direção de fotografia; concepção da identidade visual e trailer 3D.
- Os demais projetos receberam uma apresentação mais consistente: contexto, crédito, função, links e navegação entre trabalhos.
- O visual ganhou uma camada discreta de transição entre páginas, grão fílmico e vinheta no hero. Respeita `prefers-reduced-motion`; em telas pequenas o grão fica estático.
- `scripts/build-cv.py` gera o currículo audiovisual em PDF. O arquivo de saída padrão fica em `output/pdf/`, que é propositalmente ignorado pelo Git e pelo deploy.

## Arquitetura

Site estático em pt-BR, sem framework: HTML escrito à mão, CSS e JavaScript vanilla. O build em Node gera a seção de ensaios e os arquivos de SEO.

### Páginas

- Escritas à mão: `index.html`, `about.html`, `404.html`, `projects/*.html` e `teleprompter/*.html`.
- Geradas: `ensaios/index.html`, `ensaios/<slug>.html`, `ensaios/feed.xml`, `sitemap.xml` e `robots.txt`.
- Fonte dos ensaios: `ensaios/posts/posts.json` e `ensaios/posts/*.md`. Nunca edite os HTMLs gerados diretamente.

`scripts/build-site.mjs` mantém canonicals, sitemap, feed e JSON-LD. Novas páginas de topo precisam ser registradas em `TOP_LEVEL_PAGES`; páginas em `projects/` são descobertas automaticamente.

Header e footer são repetidos nas páginas escritas à mão e também existem como templates no build dos ensaios. Ao alterar navegação, atualize todas as ocorrências e gere o site novamente.

## Comandos

```powershell
npm run build
npm run serve
npm run optimize-image -- <entrada> <nome-de-saida> [largura-maxima]
npm exec -- wrangler deploy
```

- `npm run build` é obrigatório após qualquer mudança em `ensaios/posts/`; também atualiza canonicals das páginas estáticas.
- `npm run serve` abre a prévia em `http://localhost:3000` e simula URLs sem extensão.
- Imagens de produção devem ir para `assets/images/optimized/`, normalmente pelo comando `optimize-image`.
- O currículo pode ser gerado com `python scripts/build-cv.py`. Ele requer Python com `reportlab` e fontes padrão do Windows; o PDF fica fora do versionamento em `output/`. Neste computador, o comando `python` não está no `PATH`; use um Python instalado/configurado ou o runtime fornecido pelo ambiente Codex.

Não há lint, testes automatizados ou CI. Para mudanças de site, rode `npm run build`, `git diff --check` e faça uma prévia local antes do deploy.

## Publicação e segurança

- Configuração: `wrangler.jsonc` publica o diretório raiz como assets estáticos no Worker `portfolio`.
- Domínios: `jvdiasfilms.com.br` e `www.jvdiasfilms.com.br`.
- Use o Wrangler instalado no projeto (`npm exec -- wrangler deploy`), não é necessário commit para o deploy refletir o working tree.
- `.assetsignore` define o que não pode chegar à produção. Mantenha alinhado com `.gitignore` para novos arquivos locais. `docs/`, `scripts/`, `tmp/`, `output/`, fontes pesadas e estado do Wrangler devem continuar excluídos.
- `_headers` contém CSP e cache. Se uma página carregar novo iframe ou outro recurso externo, atualize a CSP antes de publicar.
- CSS e JS têm cache de um dia. A página `projects/aprendi-vivendo.html` usa uma query de versão para evitar que visitantes recebam um CSS antigo depois de uma mudança de componente.

## Estilo e acessibilidade

O site é editorial, escuro e contido: fundo `#0a0a0a`, texto `#eae6df`, Fraunces para títulos e Inter para interface. Evite linguagem promocional genérica; os créditos devem ser factuais e em pt-BR.

Preserve `alt` nas imagens, `aria-current` na navegação de cabeçalho e `prefers-reduced-motion` nos efeitos. O footer não usa `aria-current` e deve permanecer idêntico em todas as páginas.

## Próximos passos possíveis

- Criar e adicionar um showreel quando houver material finalizado.
- Adicionar screenshots do Teleprompter JVDias quando houver imagens prontas.
- Atualizar currículo e páginas de projeto quando entrarem novos créditos verificáveis.
- Itens remanescentes da auditoria frontend (`docs/FRONTEND_AUDIT_2026-07-18.md`), todos de baixa prioridade: A4 (grão fílmico — **medir com profiler antes de otimizar**), A8 (revisão de microcopy/capitalização), A9 (regra de `alt` das capas no template de build dos ensaios), A10 (affordance de teclado dos players) e as "observações menores" do relatório.
- Decisões registradas da auditoria: **A6 rejeitado** — o esquema `aria-current` (`"page"` página exata / `"true"` seção) é deliberado e correto, não padronizar; a troca da seta `→`→`↗` no CTA da Store em `/teleprompter/` foi **recusada pelo usuário** (link mantém `→`).
