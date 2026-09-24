// Worker do portfólio. Só é executado para /mapa/media/videos/* (ver "run_worker_first" em wrangler.jsonc);
// todo o resto do site continua saindo direto dos arquivos estáticos.
//
// Por quê: os arquivos estáticos do Worker não respondem a pedidos de trecho (Range) quando o vídeo não
// está no cache da Cloudflare, e o Chrome, o Edge e o Android então tratam o vídeo como não navegável
// (não dá para avançar). O R2 entrega trechos sempre, com ou sem cache (B-004 do Museu da Ilusão).
//
// Se o vídeo não estiver no bucket, a resposta cai na cópia estática, como antes.

const VIDEO_PREFIX = "/mapa/media/videos/";
const VIDEO_NAME = /^[a-z0-9-]+\.mp4$/;
const ONE_DAY = 86400;

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const key = pathname.startsWith(VIDEO_PREFIX) ? pathname.slice(VIDEO_PREFIX.length) : "";
    if (env.MAPA_VIDEOS && VIDEO_NAME.test(key) && (request.method === "GET" || request.method === "HEAD")) {
      const response = await serveVideo(request, env.MAPA_VIDEOS, key);
      if (response) return response;
    }
    return env.ASSETS.fetch(request);
  },
};

export async function serveVideo(request, bucket, key) {
  const meta = await bucket.head(key);
  if (!meta) return null;

  const size = meta.size;
  const headers = new Headers();
  meta.writeHttpMetadata(headers);
  headers.set("content-type", "video/mp4");
  headers.set("accept-ranges", "bytes");
  headers.set("etag", meta.httpEtag);
  headers.set("cache-control", `public, max-age=${ONE_DAY}`);
  headers.set("x-content-type-options", "nosniff");

  if (etagMatches(request.headers.get("if-none-match"), meta.httpEtag)) {
    return new Response(null, { status: 304, headers });
  }

  // If-Range: só honra o trecho se o validador ainda corresponde ao arquivo; caso contrário, arquivo inteiro.
  const ifRange = request.headers.get("if-range");
  const rangeAllowed = !ifRange || ifRange === meta.httpEtag;
  const range = rangeAllowed ? parseRange(request.headers.get("range"), size) : null;

  if (range === "unsatisfiable") {
    headers.set("content-range", `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }

  if (request.method === "HEAD") {
    headers.set("content-length", String(size));
    return new Response(null, { status: 200, headers });
  }

  if (!range) {
    const object = await bucket.get(key);
    if (!object) return null;
    headers.set("content-length", String(size));
    return new Response(object.body, { status: 200, headers });
  }

  const length = range.end - range.start + 1;
  const object = await bucket.get(key, { range: { offset: range.start, length } });
  if (!object) return null;
  headers.set("content-range", `bytes ${range.start}-${range.end}/${size}`);
  headers.set("content-length", String(length));
  return new Response(object.body, { status: 206, headers });
}

// Interpreta um único intervalo "bytes=início-fim". Retorna null quando o cabeçalho deve ser ignorado
// (ausente, malformado ou com vários intervalos; a resposta é o arquivo inteiro, como permite a RFC 9110)
// e "unsatisfiable" quando o intervalo começa depois do fim do arquivo (416).
export function parseRange(header, size) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;
  const [, startText, endText] = match;
  if (startText === "" && endText === "") return null;

  if (startText === "") {
    const suffix = Number(endText);
    if (suffix === 0 || size === 0) return "unsatisfiable";
    const length = Math.min(suffix, size);
    return { start: size - length, end: size - 1 };
  }

  const start = Number(startText);
  if (start >= size) return "unsatisfiable";
  const end = endText === "" ? size - 1 : Math.min(Number(endText), size - 1);
  if (end < start) return null;
  return { start, end };
}

function etagMatches(header, etag) {
  if (!header) return false;
  if (header.trim() === "*") return true;
  return header.split(",").some((value) => value.trim().replace(/^W\//, "") === etag);
}
