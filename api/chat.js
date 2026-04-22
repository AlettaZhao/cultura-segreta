const MOONSHOT_ENDPOINT = "https://api.moonshot.ai/v1/chat/completions";
const KIMI_MODEL = "kimi-k2.5";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.MOONSHOT_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      code: "no-key",
      error: "Missing MOONSHOT_API_KEY environment variable",
    });
  }

  const { system, user } = req.body || {};
  if (typeof user !== "string" || !user.trim()) {
    return res.status(400).json({ code: "bad-request", error: "Missing user message" });
  }

  const messages = [];
  if (typeof system === "string" && system.trim()) {
    messages.push({ role: "system", content: system.slice(0, 4000) });
  }
  messages.push({ role: "user", content: user.slice(0, 2000) });

  try {
    const response = await fetch(MOONSHOT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages,
        max_tokens: 300,
        temperature: 0.7,
        thinking: { type: "disabled" },
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({
        code: "kimi-error",
        error: data.error?.message || "Kimi API request failed",
      });
    }

    return res.status(200).json({
      text: data.choices?.[0]?.message?.content || "",
    });
  } catch {
    return res.status(502).json({
      code: "network-error",
      error: "Unable to reach Kimi API",
    });
  }
}
