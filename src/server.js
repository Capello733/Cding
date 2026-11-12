const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "snippets.json");
const PUBLIC_DIR = path.join(__dirname, "..", "public");

function ensureDataFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
}

function readSnippets() {
  ensureDataFile();

  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSnippets(snippets) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(snippets, null, 2));
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text, contentType = "text/plain; charset=utf-8") {
  res.writeHead(statusCode, { "Content-Type": contentType });
  res.end(text);
}

function serveStaticFile(res, filePath) {
  const normalized = path.normalize(filePath).replace(/^([.][.][/\\])+/, "");
  const resolved = path.join(PUBLIC_DIR, normalized);

  if (!resolved.startsWith(PUBLIC_DIR)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  fs.readFile(resolved, (error, content) => {
    if (error) {
      sendText(res, 404, "Not found");
      return;
    }

    const ext = path.extname(resolved).toLowerCase();
    const contentTypes = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8"
    };

    res.writeHead(200, { "Content-Type": contentTypes[ext] || "text/plain; charset=utf-8" });
    res.end(content);
  });
}

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const pathname = url.pathname;

    if (pathname === "/health") {
      return sendText(res, 200, "ok");
    }

    if (pathname === "/api/snippets" && req.method === "GET") {
      return sendJson(res, 200, readSnippets());
    }

    if (pathname === "/api/snippets" && req.method === "POST") {
      let body = "";

      req.on("data", chunk => {
        body += chunk;
      });

      req.on("end", () => {
        try {
          const incoming = JSON.parse(body || "{}");
          const snippets = readSnippets();
          const newSnippet = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
            title: String(incoming.title || "Untitled"),
            language: String(incoming.language || "plaintext"),
            description: String(incoming.description || ""),
            code: String(incoming.code || ""),
            createdAt: new Date().toISOString()
          };

          snippets.unshift(newSnippet);
          writeSnippets(snippets);
          return sendJson(res, 201, newSnippet);
        } catch {
          return sendJson(res, 400, { error: "Invalid JSON payload" });
        }
      });

      return undefined;
    }

    if (pathname.startsWith("/api/snippets/") && req.method === "DELETE") {
      const id = pathname.split("/").pop();
      const snippets = readSnippets().filter(item => item.id !== id);
      writeSnippets(snippets);
      return sendJson(res, 200, { success: true });
    }

    if (pathname === "/" || pathname === "/index.html") {
      return serveStaticFile(res, "index.html");
    }

    if (pathname === "/styles.css" || pathname === "/app.js") {
      return serveStaticFile(res, pathname.slice(1));
    }

    if (pathname === "/favicon.ico") {
      return sendText(res, 204, "");
    }

    return sendText(res, 404, "Not found");
  });
}

function startServer(port = process.env.PORT || 3000) {
  const server = createServer();
  server.listen(port, () => {
    console.log(`Cding running at http://localhost:${port}`);
  });
  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createServer,
  startServer,
  readSnippets,
  writeSnippets
};
