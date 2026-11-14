"use strict";
/*
 * AI 情报报纸 · 本地采集服务
 * 作用：1) 提供页面静态文件；2) 代理海外 RSS / arXiv 等无 CORS 的资源。
 * 仅监听 127.0.0.1，不对外网开放。
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const ROOT = __dirname;
const PORT = 8765;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "text/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon"
};

function headers(extra) {
  return Object.assign({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Cache-Control": "no-store"
  }, extra || {});
}

function reply(res, code, type, body) {
  res.writeHead(code, headers({ "Content-Type": type || "text/plain; charset=utf-8" }));
  res.end(body);
}

async function proxy(target, res) {
  let u;
  try {
    u = new URL(target);
  } catch (e) {
    return reply(res, 400, "application/json; charset=utf-8", JSON.stringify({ error: "invalid url" }));
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return reply(res, 400, "application/json; charset=utf-8", JSON.stringify({ error: "unsupported protocol" }));
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 18000);
  try {
    const r = await fetch(u.href, {
      headers: {
        "User-Agent": UA,
        "Accept": "*/*",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
      },
      redirect: "follow",
      signal: ctrl.signal
    });
    const buf = Buffer.from(await r.arrayBuffer());
    clearTimeout(timer);
    if (buf.length > 4 * 1024 * 1024) {
      return reply(res, 413, "application/json; charset=utf-8", JSON.stringify({ error: "response too large" }));
    }
    reply(res, r.status, r.headers.get("content-type") || "text/plain; charset=utf-8", buf);
  } catch (e) {
    clearTimeout(timer);
    reply(res, 502, "application/json; charset=utf-8", JSON.stringify({ error: String((e && e.message) || e) }));
  }
}

const server = http.createServer((req, res) => {
  let u;
  try {
    u = new URL(req.url, "http://127.0.0.1:" + PORT);
  } catch (e) {
    return reply(res, 400, "text/plain; charset=utf-8", "bad request");
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204, headers());
    return res.end();
  }
  if (u.pathname === "/ping") {
    return reply(res, 200, "application/json; charset=utf-8", JSON.stringify({ ok: true, service: "ai-paper", ts: Date.now() }));
  }
  if (u.pathname === "/proxy") {
    return proxy(u.searchParams.get("url"), res);
  }

  let rel = "/index.html";
  try {
    rel = decodeURIComponent(u.pathname === "/" ? "/index.html" : u.pathname);
  } catch (e) { /* 保持默认 */ }
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT)) {
    return reply(res, 403, "text/plain; charset=utf-8", "forbidden");
  }
  fs.readFile(file, (err, data) => {
    if (err) return reply(res, 404, "text/plain; charset=utf-8", "Not found: " + rel);
    reply(res, 200, MIME[path.extname(file).toLowerCase()] || "application/octet-stream", data);
  });
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.log("[AI Paper] 端口 8765 已被占用，沿用现有服务。");
    process.exit(0);
  }
  console.error("[AI Paper] 启动失败：", err);
  process.exit(1);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("[AI Paper] 已启动：http://127.0.0.1:" + PORT);
  console.log("[AI Paper] 关闭本窗口即停止服务。");
});
