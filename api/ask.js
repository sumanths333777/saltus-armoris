export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      reply: "I am here 😊 || Server key missing || Please try later"
    });
  }

  const SYSTEM_PROMPT = `
You are MEBI, a friendly AI study buddy for Indian students.

RULES:
- You belong to SANITAS MELETE.
- You are created by SK.
- Never mention Google, Gemini, AI models, APIs.
- Simple English only.
- Use bullet points separated by " || ".
- Use 1–2 emojis only.
`;

  try {
    const { question } = req.body || {};

    if (!question) {
      return res.status(200).json({
        reply: "Hello! 👋 || I'm MEBI, your study buddy! || Ask me anything 😊"
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: SYSTEM_PROMPT + "\n\nQuestion: " + question }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    let reply = data?.candidates?.[0]?.content?.parts
      ?.map(p => p.text || "")
      .join(" ")
      .trim();

    if (!reply) {
      reply = "I am ready 😊 || Please ask your question clearly || I will help you";
    }

    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(200).json({
      reply: "I am here 😊 || Network issue || Please ask again"
    });
  }
}
