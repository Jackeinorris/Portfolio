# Build e validação editorial

Execute `npm run build` depois de editar os metadados ou o Markdown dos ensaios.
Execute `npm test` para verificar o gerador com casos isolados em pastas temporárias.
Os testes não alteram as páginas do portfólio e não exigem novas dependências.

## Publicação e remoção de ensaios

- `slug` deve ser único e conter apenas letras minúsculas sem acentos, números e hífens. `index` e `post` são reservados.
- Ensaios publicados precisam de título, resumo, data válida em `YYYY-MM-DD`, lista de tags e arquivo `<slug>.md`.
- Imagens de capa devem apontar para arquivos existentes do site, com caminho relativo à pasta `ensaios`. O vídeo opcional deve usar uma URL de vídeo do Vimeo.
- Rascunhos podem ter conteúdo editorial incompleto; precisam de slug válido e único e `draft: true`.
- Remover uma entrada do JSON, trocar seu slug ou marcar como rascunho remove o HTML antigo gerado no próximo build bem-sucedido. O Markdown original é preservado.
- A limpeza reconhece o comentário de geração nos novos HTML e a estrutura dos ensaios antigos. Preserva `ensaios/index.html`, o redirecionador `ensaios/post.html` e HTML avulso sem identificação de ensaio gerado.

## Comportamento em caso de erro

O gerador valida os dados, lê os Markdown e prepara todas as páginas, feeds e canonical antes de gravar as saídas. Erros de conteúdo ou de template deixam os arquivos do último build intactos. Isso não é uma transação de sistema de arquivos: falhas de disco ou interrupções durante a gravação ainda podem exigir executar o build novamente.

Os canonical das páginas autoradas são atualizados conforme o endereço configurado, inseridos quando ausentes e deduplicados. Essa atualização não reescreve outros metadados autorados manualmente, como Open Graph e JSON-LD.
