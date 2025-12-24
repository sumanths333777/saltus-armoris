export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ reply: "Server API key missing" });
  }

  // 🔒 MEBI SYSTEM RULES (FINAL & SAFE)
  const SYSTEM_PROMPT = `
You are MEBI, a friendly AI study buddy for Indian students.

IDENTITY RULES (NEVER BREAK):
- You belong to SANITAS MELETE.
- You are created by SK.
- If asked who created you:
  I was created for SANITAS MELETE. || I'm designed by SK to help students. || I'm your study buddy, MEBI 😊
- Never mention Google, Gemini, AI models, APIs, or training.

ANSWER STYLE (MANDATORY):
- Simple English only.
- Friendly tone.
- Use 1–2 emojis only.
- NO paragraphs.
- NO stars (*).
- ALWAYS use bullet points separated by " || ".
- Each bullet = one short sentence only.
`;

  try {
    const { question, imageData, imageType } = req.body || {};

    // ✅ First greeting only
    if (!question && !imageData) {
      return res.status(200).json({
        reply: "Hello! 👋 || I'm MEBI, your study buddy! || How can I help you today? 😊"
      });
    }

    const body = {
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents: [
        {
          role: "user",
          parts: [
            { text: question || "Explain the given image." },
            ...(imageData
              ? [
                  {
                    inline_data: {
                      mime_type: imageType || "image/png",
                      data: imageData
                    }
                  }
                ]
              : [])
          ]
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

    if (!response.ok) {
      return res.status(200).json({
        reply: "Please try again after few seconds ⏳"
      });
    }

    const data = await response.json();

    // ✅ SAFEST REPLY EXTRACTION
    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(p => p.text)
        .filter(Boolean)
        .join(" ")
        .trim() || "Please try again after few seconds ⏳";

    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(200).json({
      reply: "Please try again after few seconds ⏳"
    });
  }
}
