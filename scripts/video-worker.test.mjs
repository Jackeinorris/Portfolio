import test from "node:test";
import assert from "node:assert/strict";
import worker, { parseRange } from "../worker/index.mjs";

const SIZE = 1000;
const video = new Uint8Array(SIZE).map((_, i) => i % 251);
const ETAG = '"etag-zootropio"';

function fakeBucket(files) {
  const meta = (key, data) => ({ key, size: data.length, httpEtag: ETAG, writeHttpMetadata: (headers) => headers.set("content-type", "application/octet-stream") });
  return {
    async head(key) { return files[key] ? meta(key, files[key]) : null; },
    async get(key, options = {}) {
      const data = files[key];
      if (!data) return null;
      const offset = options.range?.offset ?? 0;
      const length = options.range?.length ?? data.length - offset;
      return { ...meta(key, data), body: new Blob([data.subarray(offset, offset + length)]).stream() };
    },
  };
}
const assets = { fetch: async (request) => new Response("asset " + new URL(request.url).pathname, { headers: { "x-from": "assets" } }) };
const env = { MAPA_VIDEOS: fakeBucket({ "zootropio.mp4": video }), ASSETS: assets };
const URL_VIDEO = "https://jvdiasfilms.com.br/mapa/media/videos/zootropio.mp4";

async function call(headers = {}, { method = "GET", url = URL_VIDEO, environment = env } = {}) {
  const response = await worker.fetch(new Request(url, { method, headers }), environment);
  const body = method === "HEAD" ? new Uint8Array() : new Uint8Array(await response.arrayBuffer());
  return { response, body, header: (name) => response.headers.get(name) };
}

test("sem Range: 200 com o arquivo inteiro e anúncio de suporte a trechos", async () => {
  const { response, body, header } = await call();
  assert.equal(response.status, 200);
  assert.equal(header("accept-ranges"), "bytes");
  assert.equal(header("content-type"), "video/mp4");
  assert.equal(header("content-length"), String(SIZE));
  assert.deepEqual(body, video);
});

test("sonda do Safari bytes=0-1: 206 com dois bytes", async () => {
  const { response, body, header } = await call({ range: "bytes=0-1" });
  assert.equal(response.status, 206);
  assert.equal(header("content-range"), `bytes 0-1/${SIZE}`);
  assert.equal(header("content-length"), "2");
  assert.deepEqual(body, video.subarray(0, 2));
});

test("pedido inicial do Chromium bytes=0-: 206 com o arquivo inteiro", async () => {
  const { response, body, header } = await call({ range: "bytes=0-" });
  assert.equal(response.status, 206);
  assert.equal(header("content-range"), `bytes 0-999/${SIZE}`);
  assert.deepEqual(body, video);
});

test("salto para o meio: 206 com o trecho exato", async () => {
  const { response, body, header } = await call({ range: "bytes=500-599" });
  assert.equal(response.status, 206);
  assert.equal(header("content-range"), `bytes 500-599/${SIZE}`);
  assert.deepEqual(body, video.subarray(500, 600));
});

test("trecho aberto a partir do meio e fim além do tamanho são ajustados", async () => {
  assert.equal((await call({ range: "bytes=990-" })).header("content-range"), `bytes 990-999/${SIZE}`);
  const { body, header } = await call({ range: "bytes=990-5000" });
  assert.equal(header("content-range"), `bytes 990-999/${SIZE}`);
  assert.deepEqual(body, video.subarray(990));
});

test("sufixo bytes=-100: últimos 100 bytes", async () => {
  const { response, body, header } = await call({ range: "bytes=-100" });
  assert.equal(response.status, 206);
  assert.equal(header("content-range"), `bytes 900-999/${SIZE}`);
  assert.deepEqual(body, video.subarray(900));
});

test("trecho depois do fim: 416 com o tamanho real", async () => {
  const { response, header } = await call({ range: "bytes=1000-" });
  assert.equal(response.status, 416);
  assert.equal(header("content-range"), `bytes */${SIZE}`);
});

test("Range malformado ou com vários intervalos: arquivo inteiro com 200", async () => {
  for (const range of ["bytes=abc", "items=0-1", "bytes=0-1,5-6", "bytes=9-3", "bytes=-"]) {
    const { response, body } = await call({ range });
    assert.equal(response.status, 200, range);
    assert.equal(body.length, SIZE, range);
  }
});

test("If-None-Match igual: 304 sem corpo", async () => {
  assert.equal((await call({ "if-none-match": ETAG })).response.status, 304);
  assert.equal((await call({ "if-none-match": "W/" + ETAG })).response.status, 304);
  assert.equal((await call({ "if-none-match": '"outro"' })).response.status, 200);
});

test("If-Range: honra o trecho só com o validador atual", async () => {
  assert.equal((await call({ range: "bytes=0-1", "if-range": ETAG })).response.status, 206);
  const stale = await call({ range: "bytes=0-1", "if-range": '"antigo"' });
  assert.equal(stale.response.status, 200);
  assert.equal(stale.body.length, SIZE);
});

test("HEAD: cabeçalhos sem corpo", async () => {
  const { response, header } = await call({}, { method: "HEAD" });
  assert.equal(response.status, 200);
  assert.equal(header("content-length"), String(SIZE));
  assert.equal(header("accept-ranges"), "bytes");
});

test("fora do escopo ou ausente no bucket: cai nos arquivos estáticos", async () => {
  const cases = [
    ["https://jvdiasfilms.com.br/mapa/media/videos/zootropio.jpg", "GET"],
    ["https://jvdiasfilms.com.br/mapa/media/videos/lanterna.mp4", "GET"],
    ["https://jvdiasfilms.com.br/mapa/media/videos/Zootropio.mp4", "GET"],
    ["https://jvdiasfilms.com.br/mapa/media/videos/sub/zootropio.mp4", "GET"],
    ["https://jvdiasfilms.com.br/mapa/", "GET"],
    [URL_VIDEO, "POST"],
  ];
  for (const [url, method] of cases) {
    const { header } = await call({}, { url, method });
    assert.equal(header("x-from"), "assets", `${method} ${url}`);
  }
  const semBucket = await call({ range: "bytes=0-1" }, { environment: { ASSETS: assets } });
  assert.equal(semBucket.header("x-from"), "assets");
});

test("parseRange cobre os limites", () => {
  assert.equal(parseRange(null, 10), null);
  assert.deepEqual(parseRange("bytes=0-0", 10), { start: 0, end: 0 });
  assert.deepEqual(parseRange("bytes=-20", 10), { start: 0, end: 9 });
  assert.equal(parseRange("bytes=-0", 10), "unsatisfiable");
  assert.equal(parseRange("bytes=10-", 10), "unsatisfiable");
  assert.equal(parseRange(" bytes=2-3 ", 10).start, 2);
});
