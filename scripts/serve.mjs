// Zero-dependency static server for local preview (production serving is Cloudflare).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
};

http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname);
  let file = path.normalize(path.join(ROOT, url));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, "index.html");
  }
  if (!fs.existsSync(file)) {
    file = path.join(ROOT, "404.html");
    if (!fs.existsSync(file)) {
      res.writeHead(404).end("Not found");
      return;
    }
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fs.readFileSync(file));
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream" });
  res.end(fs.readFileSync(file));
}).listen(PORT, () => console.log(`Serving ${ROOT} at http://localhost:${PORT}`));
