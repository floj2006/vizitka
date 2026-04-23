import { formatRsvpError, submitRsvp } from "../lib/rsvp.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;

    await submitRsvp(body);
    return res.status(200).json({ ok: true });
  } catch (error) {
    const { status, message } = formatRsvpError(error);
    return res.status(status).json({ error: message });
  }
}
