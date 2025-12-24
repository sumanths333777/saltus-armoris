export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      reply: "Server is waking up || Please try again in a moment ⏳"
    });
  }

  const SYSTEM_PROMPT = `
You are MEBI, a friendly AI study buddy for Indian students.

IMPORTANT RULES:
- Do NOT repeat greetings or identity unless asked.
- Answer only the question directly.
- Use SIMPLE English.
- Use bullet points separated by " || ".
- One short sentence per bullet.
- Use max 2 emojis.
`;

  try {
    const { question } = req.body || {};
    if (!question) {
      return res.status(200).json({
        reply: "Please ask a study question 📘"
      });
    }

    const body = {
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: question }]
        }
      ]
    };

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(200).json({
        reply: "AI is busy now || Please try again after few seconds ⏳"
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(p => p.text || "")
        .join(" ")
        .trim() ||
      "I am here || Please ask again 😊";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error(err);
    return res.status(200).json({
      reply: "Temporary issue || Please try again 😌"
    });
  }
}
