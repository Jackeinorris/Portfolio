import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_URL = "https://jvdiasfilms.com.br";
const POSTS_DIR = path.join(ROOT, "ensaios", "posts");
const ENSAIOS_DIR = path.join(ROOT, "ensaios");
const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const DEFAULT_IMAGE = `${SITE_URL}/assets/images/optimized/og-jvdias.jpg`;
const PROFILE_IMAGE = `${SITE_URL}/assets/images/foto-perfil.jpeg`;

const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const write = (file, text) => fs.writeFileSync(path.join(ROOT, file), text, "utf8");
const exists = (file) => fs.existsSync(path.join(ROOT, file));

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function inlineMarkdown(value) {
  let out = escapeHtml(value);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return out;
}

function renderMarkdown(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let para = [];
  let quote = [];
  let list = null;

  function flushPara() {
    if (!para.length) return;
    html.push(`<p>${inlineMarkdown(para.join(" "))}</p>`);
    para = [];
  }

  function flushQuote() {
    if (!quote.length) return;
    html.push(`<blockquote><p>${inlineMarkdown(quote.join(" "))}</p></blockquote>`);
    quote = [];
  }

  function flushList() {
    if (!list) return;
    html.push(`<${list.type}>${list.items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</${list.type}>`);
    list = null;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushPara();
      flushQuote();
      flushList();
      continue;
    }

    const unordered = trimmed.match(/^[-*]\s+(.+)$/);
    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (unordered || ordered) {
      flushPara();
      flushQuote();
      const type = unordered ? "ul" : "ol";
      if (list && list.type !== type) flushList();
      if (!list) list = { type, items: [] };
      list.items.push(unordered?.[1] || ordered?.[1]);
      continue;
    }

    flushList();
    if (trimmed.startsWith(">")) {
      flushPara();
      quote.push(trimmed.replace(/^>\s?/, ""));
      continue;
    }

    flushQuote();
    if (trimmed === "---") {
      flushPara();
      html.push("<hr>");
    } else if (trimmed.startsWith("### ")) {
      flushPara();
      html.push(`<h3>${inlineMarkdown(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      flushPara();
      html.push(`<h2>${inlineMarkdown(trimmed.slice(3))}</h2>`);
    } else {
      para.push(trimmed);
    }
  }

  flushPara();
  flushQuote();
  flushList();
  return html.join("\n");
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMonth(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function readingTime(md) {
  const words = md.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function absoluteUrl(url) {
  return `${SITE_URL}/${url.replace(/^\.\.\//, "").replace(/^\.\//, "")}`;
}

function imageDimensions(imagePath) {
  const local = path.normalize(path.join(ENSAIOS_DIR, imagePath));
  if (!fs.existsSync(local)) return null;

  const buffer = fs.readFileSync(local);
  if (buffer.length >= 24 && buffer.toString("ascii", 1, 4) === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset < buffer.length) {
    while (buffer[offset] === 0xff) offset++;
    const marker = buffer[offset++];
    if (marker === 0xda || marker === 0xd9) break;
    if (offset + 2 > buffer.length) break;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) break;
    if (sofMarkers.has(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }
    offset += length;
  }

  return null;
}

function imageDimensionAttrs(imagePath) {
  const dimensions = imageDimensions(imagePath);
  return dimensions ? `width="${dimensions.width}" height="${dimensions.height}"` : "";
}

function mergeAttrs(...attrs) {
  return attrs.filter(Boolean).join(" ");
}

function safeJsonLd(value) {
  return JSON.stringify(value, null, 2).replace(/</g, "\\u003c");
}

function structuredDataScript(graph) {
  return `<script type="application/ld+json" id="structured-data">\n${safeJsonLd({ "@context": "https://schema.org", "@graph": graph })}\n  </script>`;
}

function personNode() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: "J. V. Dias",
    url: `${SITE_URL}/`,
    image: PROFILE_IMAGE,
    jobTitle: "Diretor visual, filmmaker e artista 3D",
    email: "mailto:joaodias@jvdias.com",
    sameAs: ["https://www.linkedin.com/in/JvDiasM"],
    knowsAbout: ["cinema", "direção visual", "3D", "direção de fotografia", "produção audiovisual", "pipeline de render"],
  };
}

function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: "J. V. Dias",
    inLanguage: "pt-BR",
    publisher: { "@id": PERSON_ID },
  };
}

function essayIndexStructuredData(posts) {
  const url = `${SITE_URL}/ensaios/`;
  return [
    personNode(),
    websiteNode(),
    {
      "@type": "CollectionPage",
      "@id": `${url}#webpage`,
      url,
      name: "Ensaios — J. V. Dias",
      description: "Ensaios semanais sobre cinema, direção visual, 3D e processo criativo por J. V. Dias.",
      inLanguage: "pt-BR",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": PERSON_ID },
      mainEntity: { "@id": `${url}#blog` },
    },
    {
      "@type": "Blog",
      "@id": `${url}#blog`,
      url,
      name: "Ensaios",
      inLanguage: "pt-BR",
      author: { "@id": PERSON_ID },
      blogPost: posts.map((post) => ({ "@id": `${SITE_URL}/ensaios/${post.slug}.html#article` })),
    },
    {
      "@type": "ItemList",
      "@id": `${url}#posts`,
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}/ensaios/${post.slug}.html`,
        name: post.title,
      })),
    },
  ];
}

function essayPostStructuredData(post, md, readTime) {
  const url = `${SITE_URL}/ensaios/${post.slug}.html`;
  const image = absoluteUrl(post.coverImage || "../assets/images/optimized/og-jvdias.jpg");
  const wordCount = md.trim().split(/\s+/).filter(Boolean).length;
  return [
    personNode(),
    websiteNode(),
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: `${post.title} — J. V. Dias`,
      description: post.excerpt,
      inLanguage: "pt-BR",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": PERSON_ID },
      primaryImageOfPage: image,
      mainEntity: { "@id": `${url}#article` },
    },
    {
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      mainEntityOfPage: { "@id": `${url}#webpage` },
      headline: post.title,
      description: post.excerpt,
      image,
      datePublished: post.date,
      dateModified: post.date,
      author: { "@id": PERSON_ID },
      publisher: { "@id": PERSON_ID },
      inLanguage: "pt-BR",
      keywords: post.tags || [],
      timeRequired: `PT${readTime}M`,
      wordCount,
    },
  ];
}

function webpCandidate(imagePath) {
  if (!imagePath) return "";
  const webp = imagePath.replace(/\.(jpg|jpeg|png)$/i, ".webp");
  const local = path.join(ENSAIOS_DIR, webp);
  return fs.existsSync(local) ? webp : "";
}

function pictureMarkup(imagePath, alt, attrs = "") {
  if (!imagePath) return "";
  const webp = webpCandidate(imagePath);
  const attr = mergeAttrs(imageDimensionAttrs(imagePath), attrs);
  const attrText = attr ? ` ${attr}` : "";
  return `<picture>
            ${webp ? `<source srcset="${escapeAttr(webp)}" type="image/webp">` : ""}
            <img src="${escapeAttr(imagePath)}" alt="${escapeAttr(alt)}"${attrText}>
          </picture>`;
}

function renderHeader() {
  return `  <header class="site-header">
    <nav class="nav">
      <a href="../index.html" class="logo visible">J. V. Dias</a>
      <ul class="nav-links">
        <li><a href="../index.html#works">Projetos</a></li>
        <li><a href="./">Ensaios</a></li>
        <li><a href="../about.html">Sobre</a></li>
      </ul>
    </nav>
  </header>`;
}

function renderFooter() {
  return `  <footer class="site-footer">
    <div class="footer-inner">
      <span class="footer-name">J. V. Dias</span>
      <div class="footer-links">
        <a href="mailto:joaodias@jvdias.com">joaodias@jvdias.com</a>
        <span class="footer-sep">·</span>
        <a href="https://www.linkedin.com/in/JvDiasM" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <span class="footer-sep">·</span>
        <a href="../about.html">Sobre</a>
      </div>
    </div>
  </footer>`;
}

function renderEssayIndex(posts) {
  const entries = posts.map((post) => {
    const style = post.coverPosition ? `style="object-position: ${escapeAttr(post.coverPosition)};" ` : "";
    const cover = post.coverImage
      ? `<div class="ensaio-cover">${pictureMarkup(post.coverImage, "", `${style}loading="lazy" decoding="async"`)}</div>`
      : "";

    return `      <!-- ENSAIO: ${post.slug} -->
      <a href="${post.slug}.html" class="ensaio-entry">
        ${cover}
        <div class="ensaio-entry-content">
          <time class="ensaio-date" datetime="${post.date}">${formatDate(post.date)}</time>
          <h2 class="ensaio-entry-title">${escapeHtml(post.title)}</h2>
          <p class="ensaio-excerpt">${escapeHtml(post.excerpt)}</p>
          <div class="ensaio-meta">
            ${post.tags.map((tag) => `<span class="ensaio-tag">${escapeHtml(tag)}</span>`).join("\n            ")}
          </div>
        </div>
      </a>`;
  }).join("\n\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ensaios — J. V. Dias</title>
  <meta name="description" content="Ensaios semanais sobre cinema, direção visual, 3D e processo criativo por J. V. Dias.">
  <meta name="theme-color" content="#0a0a0a">
  <link rel="canonical" href="${SITE_URL}/ensaios/">

  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE_URL}/ensaios/">
  <meta property="og:title" content="Ensaios — J. V. Dias">
  <meta property="og:description" content="Ensaios semanais sobre cinema, direção visual, 3D e processo criativo.">
  <meta property="og:image" content="${SITE_URL}/assets/images/optimized/og-jvdias.jpg">
  <meta name="twitter:card" content="summary_large_image">
  ${structuredDataScript(essayIndexStructuredData(posts))}

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;400&family=Inter:wght@400;500&family=Libre+Baskerville:wght@400;700&display=swap" rel="stylesheet">
  <link rel="icon" type="image/png" href="../assets/images/Favicon.png">
  <link rel="stylesheet" href="../css/styles.css">
</head>
<body>

${renderHeader()}

  <main class="ensaios-page">

    <div class="ensaios-masthead">
      <span class="ensaios-dateline">Vol. 01 · 2026</span>
      <h1 class="ensaios-title">Ensaios</h1>
      <p class="ensaios-subtitle">Textos semanais sobre imagem, processo e construção visual.</p>
    </div>

    <div class="ensaio-list" id="ensaio-list">

${entries}

    </div>

  </main>

${renderFooter()}

</body>
</html>
`;
}

function renderStaticPost(post, index, published, md) {
  const prev = published[index + 1];
  const next = published[index - 1];
  const dateStr = formatDate(post.date);
  const readTime = readingTime(md);
  const coverPosition = post.coverPosition || "center";
  const coverAttrs = mergeAttrs(`style="object-position: ${escapeAttr(coverPosition)};"`, imageDimensionAttrs(post.coverImage), 'decoding="async"');
  const cover = post.coverImage
    ? `<div class="ensaio-cover-hero"><img src="${escapeAttr(post.coverImage)}" alt="${escapeAttr(post.title)}" ${coverAttrs}></div>`
    : "";
  const tags = post.tags?.length
    ? `<div class="ensaio-tags">${post.tags.map((tag) => `<span class="ensaio-tag">${escapeHtml(tag)}</span>`).join("")}</div>`
    : "";
  const videoId = post.videoUrl?.match(/vimeo\.com\/(\d+)/)?.[1];
  const video = videoId
    ? `<div class="ensaio-video"><div class="ensaio-video-player"><iframe src="https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0" allow="autoplay; fullscreen; picture-in-picture" title="Vídeo: ${escapeAttr(post.title)}" frameborder="0"></iframe></div></div>`
    : "";
  const nav = prev || next
    ? `<nav class="ensaio-nav">
        ${prev ? `<a href="${prev.slug}.html" class="ensaio-nav-link ensaio-nav-prev"><span class="ensaio-nav-label">&larr; Anterior</span><span class="ensaio-nav-title">${escapeHtml(prev.title)}</span></a>` : "<span></span>"}
        ${next ? `<a href="${next.slug}.html" class="ensaio-nav-link ensaio-nav-next"><span class="ensaio-nav-label">Próximo &rarr;</span><span class="ensaio-nav-title">${escapeHtml(next.title)}</span></a>` : "<span></span>"}
      </nav>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)} — J. V. Dias</title>
  <meta name="description" content="${escapeAttr(post.excerpt)}">
  <meta name="theme-color" content="#0a0a0a">
  <link rel="canonical" href="${SITE_URL}/ensaios/${post.slug}.html">

  <meta property="og:type" content="article">
  <meta property="og:url" content="${SITE_URL}/ensaios/${post.slug}.html">
  <meta property="og:title" content="${escapeAttr(post.title)} — J. V. Dias">
  <meta property="og:description" content="${escapeAttr(post.excerpt)}">
  <meta property="og:image" content="${absoluteUrl(post.coverImage || "../assets/images/optimized/og-jvdias.jpg")}">
  <meta property="article:published_time" content="${post.date}">
  <meta name="twitter:card" content="summary_large_image">
  ${structuredDataScript(essayPostStructuredData(post, md, readTime))}

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;400&family=Inter:wght@400;500&family=Libre+Baskerville:wght@400;700&display=swap" rel="stylesheet">
  <link rel="icon" type="image/png" href="../assets/images/Favicon.png">
  <link rel="stylesheet" href="../css/styles.css">
</head>
<body>

${renderHeader()}

  <main class="ensaio-page">
    <a href="./" class="back-link">&larr; Ensaios</a>

    <article class="ensaio-article">
      ${cover}

      <header class="ensaio-header">
        <h1 class="ensaio-title">${escapeHtml(post.title)}</h1>
        <div class="ensaio-info"><time datetime="${post.date}">${dateStr}</time><span class="ensaio-info-sep">·</span><span>${readTime} min de leitura</span></div>
      </header>

      ${video}

      <div class="ensaio-body">
${renderMarkdown(md)}
      </div>

      <div class="ensaio-signature">
        <div class="ensaio-signature-rule" aria-hidden="true">· · ·</div>
        <div class="ensaio-signature-author">— J. V. Dias</div>
        <div class="ensaio-signature-place">${escapeHtml(post.location || "São Paulo")}, ${formatMonth(post.date)}</div>
      </div>

      ${tags}
    </article>

    ${nav}
  </main>

${renderFooter()}

</body>
</html>
`;
}

function renderSitemap(posts) {
  const pages = [
    { loc: "/", priority: "1.0" },
    { loc: "/about.html", priority: "0.8" },
    { loc: "/ensaios/", priority: "0.8" },
    ...fs.readdirSync(path.join(ROOT, "projects"))
      .filter((file) => file.endsWith(".html"))
      .sort()
      .map((file) => ({ loc: `/projects/${file}`, priority: "0.7" })),
    ...posts.map((post) => ({ loc: `/ensaios/${post.slug}.html`, lastmod: post.date, priority: "0.7" })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((page) => `  <url>
    <loc>${SITE_URL}${page.loc}</loc>${page.lastmod ? `\n    <lastmod>${page.lastmod}</lastmod>` : ""}
    <priority>${page.priority}</priority>
  </url>`).join("\n")}
</urlset>
`;
}

function renderRobots() {
  return `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

function upsertCanonical(file, href) {
  let text = read(file);
  if (text.includes('rel="canonical"')) return;
  const canonical = `  <link rel="canonical" href="${href}">`;
  text = text.replace(/(  <meta name="theme-color" content="#0a0a0a">\n)/, `$1${canonical}\n`);
  write(file, text);
}

const posts = JSON.parse(read("ensaios/posts/posts.json"));
const published = posts
  .filter((post) => !post.draft)
  .sort((a, b) => new Date(b.date) - new Date(a.date));

write("ensaios/index.html", renderEssayIndex(published));

for (const post of posts) {
  const out = `ensaios/${post.slug}.html`;
  if (post.draft) {
    if (exists(out)) fs.unlinkSync(path.join(ROOT, out));
    continue;
  }

  const mdPath = path.join(POSTS_DIR, `${post.slug}.md`);
  if (!fs.existsSync(mdPath)) {
    throw new Error(`Missing markdown file for post: ${post.slug}`);
  }

  const md = fs.readFileSync(mdPath, "utf8");
  const index = published.findIndex((p) => p.slug === post.slug);
  write(out, renderStaticPost(post, index, published, md));
}

write("sitemap.xml", renderSitemap(published));
write("robots.txt", renderRobots());

upsertCanonical("index.html", `${SITE_URL}/`);
upsertCanonical("about.html", `${SITE_URL}/about.html`);

for (const file of fs.readdirSync(path.join(ROOT, "projects")).filter((name) => name.endsWith(".html"))) {
  upsertCanonical(`projects/${file}`, `${SITE_URL}/projects/${file}`);
}

console.log(`Built ${published.length} essay pages, sitemap.xml, and robots.txt.`);
