import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.argv.includes("--dev");
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);

const app = express();

app.use(express.json({ limit: "1mb" }));

const attendanceLabels = {
  yes: "С радостью будет",
  pair: "Будет с парой",
  no: "К сожалению, не сможет",
};

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildTelegramMessage(payload) {
  const name = cleanText(payload.name);
  const attendance = attendanceLabels[payload.attendance] || attendanceLabels.yes;
  const companion = cleanText(payload.companion);
  const note = cleanText(payload.note);
  const sentAt = new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Yekaterinburg",
  }).format(new Date());

  const lines = [
    "Новый ответ на свадьбу Алины и Андрея",
    "",
    `Имя: ${name}`,
    `Ответ: ${attendance}`,
  ];

  if (payload.attendance === "pair" && companion) {
    lines.push(`Пара: ${companion}`);
  }

  if (note) {
    lines.push(`Комментарий: ${note}`);
  }

  lines.push(`Отправлено: ${sentAt}`);

  return lines.join("\n");
}

app.post("/api/rsvp", async (req, res) => {
  const name = cleanText(req.body?.name);
  const attendance = cleanText(req.body?.attendance);
  const companion = cleanText(req.body?.companion);
  const note = cleanText(req.body?.note);

  if (!name) {
    return res.status(400).json({ error: "Пожалуйста, укажите имя." });
  }

  if (!attendanceLabels[attendance]) {
    return res.status(400).json({ error: "Не удалось распознать вариант ответа." });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({
      error:
        "Telegram пока не настроен. Добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в файл .env.",
    });
  }

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildTelegramMessage({
          name,
          attendance,
          companion,
          note,
        }),
      }),
    });

    const telegramData = await telegramResponse.json();

    if (!telegramResponse.ok || !telegramData.ok) {
      const description =
        telegramData?.description || "Telegram не принял сообщение. Проверьте токен и chat id.";

      return res.status(502).json({ error: description });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({
      error: "Не удалось отправить ответ в Telegram. Проверьте интернет и настройки бота.",
    });
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
