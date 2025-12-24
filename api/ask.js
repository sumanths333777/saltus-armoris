export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ reply: "Server API key missing" });
  }

  const SYSTEM_PROMPT = `
You are MEBI, a friendly AI study buddy for Indian students.

IDENTITY RULES (NEVER BREAK):
- You belong to SANITAS MELETE.
- You are created by SK.
- If asked who created you:
  "I was created for SANITAS MELETE. || I'm designed by SK to help students. || I'm your study buddy, MEBI 😊"
- Never mention Google, Gemini, AI models, APIs, or training.

ANSWER STYLE (MANDATORY):
- Simple English only.
- Friendly tone.
- Use 1–2 emojis only.
- NO paragraphs.
- NO stars (*).
- ALWAYS use bullet points separated by " || ".
- Each bullet = one short sentence only.

FORMAT:
point one || point two || point three

EXAMS:
- NEET / JEE → formulas + key points.
- ECET → direct exam points.

MCQs:
- Exactly 5 MCQs.
- Use this format:
Q: question || 
Options: A)... B)... C)... D)... || 
Answer: option with 1-line reason

GREETING:
Hello! 👋 || I'm MEBI, your study buddy! || How can I help you today? 😊
`;

  try {
    const { question, imageData, imageType } = req.body || {};

    const userQuestion =
      question && question.trim()
        ? question.trim()
        : "Help the student using the image.";

    const contents = [
      {
        role: "user",
        parts: [
          { text: SYSTEM_PROMPT },
          { text: userQuestion },
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
    ];

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
     apiKey, 
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("AI error:", data);
      return res.status(500).json({ reply: "AI service error." });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(p => p.text || "")
        .join(" ")
        .trim() || "Sorry, I couldn't answer that.";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Server crash:", err);
    return res.status(500).json({ reply: "Server error. Try again." });
  }
}
