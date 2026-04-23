export class RsvpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "RsvpError";
    this.status = status;
  }
}

export const attendanceLabels = {
  yes: "С радостью будет",
  pair: "Будет с парой",
  no: "К сожалению, не сможет",
};

export function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeRsvpPayload(input) {
  const payload = {
    name: cleanText(input?.name),
    attendance: cleanText(input?.attendance),
    companion: cleanText(input?.companion),
    note: cleanText(input?.note),
  };

  if (!payload.name) {
    throw new RsvpError(400, "Пожалуйста, укажите имя.");
  }

  if (!attendanceLabels[payload.attendance]) {
    throw new RsvpError(400, "Не удалось распознать вариант ответа.");
  }

  return payload;
}

export function buildTelegramMessage(payload) {
  const attendance = attendanceLabels[payload.attendance] || attendanceLabels.yes;
  const sentAt = new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Yekaterinburg",
  }).format(new Date());

  const lines = [
    "Новый ответ на свадьбу Алины и Андрея",
    "",
    `Имя: ${payload.name}`,
    `Ответ: ${attendance}`,
  ];

  if (payload.attendance === "pair" && payload.companion) {
    lines.push(`Пара: ${payload.companion}`);
  }

  if (payload.note) {
    lines.push(`Комментарий: ${payload.note}`);
  }

  lines.push(`Отправлено: ${sentAt}`);

  return lines.join("\n");
}

export async function submitRsvp(input, env = process.env) {
  const payload = normalizeRsvpPayload(input);
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new RsvpError(
      500,
      "Telegram пока не настроен. Добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env локально или в переменные окружения Vercel."
    );
  }

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildTelegramMessage(payload),
      }),
    });

    const telegramData = await telegramResponse.json().catch(() => ({}));

    if (!telegramResponse.ok || !telegramData?.ok) {
      throw new RsvpError(
        502,
        telegramData?.description || "Telegram не принял сообщение. Проверьте токен и chat id."
      );
    }

    return { ok: true };
  } catch (error) {
    if (error instanceof RsvpError) {
      throw error;
    }

    throw new RsvpError(
      500,
      "Не удалось отправить ответ в Telegram. Проверьте интернет и настройки бота."
    );
  }
}

export function formatRsvpError(error) {
  if (error instanceof RsvpError) {
    return {
      status: error.status,
      message: error.message,
    };
  }

  return {
    status: 500,
    message: "Не удалось обработать ответ. Попробуйте ещё раз.",
  };
}
