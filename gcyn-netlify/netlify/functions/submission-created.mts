// Runs automatically after every verified Netlify Forms submission
// and forwards it to a Telegram chat.

const HIDDEN_FIELDS = new Set(["form-name", "bot-field", "ip", "user_agent", "referrer"]);

export default async (req: Request) => {
  const { payload } = await req.json();

  const token = Netlify.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Netlify.env.get("TELEGRAM_CHAT_ID");

  if (!token || !chatId) {
    console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return new Response("Misconfigured", { status: 500 });
  }

  const fields = Object.entries(payload?.data ?? {})
    .filter(([key]) => !HIDDEN_FIELDS.has(key))
    .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
    .join("\n");

  const text =
    `📬 New message from GCYN website` +
    (payload?.form_name ? ` (${payload.form_name})` : "") +
    `\n\n${fields}`;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text.slice(0, 4000), // Telegram limit is 4096 characters
    }),
  });

  if (!res.ok) {
    console.error("Telegram error:", res.status, await res.text());
    return new Response("Telegram failed", { status: 502 });
  }

  return new Response("OK");
};
