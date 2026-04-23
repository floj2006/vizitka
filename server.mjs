import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";
import { formatRsvpError, submitRsvp } from "./lib/rsvp.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.argv.includes("--dev");
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);

const app = express();

app.use(express.json({ limit: "1mb" }));

app.post("/api/rsvp", async (req, res) => {
  try {
    await submitRsvp(req.body);
    return res.status(200).json({ ok: true });
  } catch (error) {
    const { status, message } = formatRsvpError(error);
    return res.status(status).json({ error: message });
  }
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found." });
});

if (isDev) {
  const { createServer } = await import("vite");

  const vite = await createServer({
    server: {
      middlewareMode: true,
    },
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use(async (req, res, next) => {
    if (req.originalUrl.startsWith("/api/") || !["GET", "HEAD"].includes(req.method)) {
      return next();
    }

    try {
      const templatePath = path.resolve(__dirname, "index.html");
      const template = await fs.readFile(templatePath, "utf-8");
      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (error) {
      vite.ssrFixStacktrace(error);
      next(error);
    }
  });
} else {
  const distPath = path.resolve(__dirname, "dist");
  app.use(express.static(distPath));

  app.use(async (req, res, next) => {
    if (req.originalUrl.startsWith("/api/") || !["GET", "HEAD"].includes(req.method)) {
      return next();
    }

    try {
      const html = await fs.readFile(path.join(distPath, "index.html"), "utf-8");
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (error) {
      next(error);
    }
  });
}

app.listen(port, host, () => {
  console.log(`Wedding app running at http://${host}:${port}`);
});
