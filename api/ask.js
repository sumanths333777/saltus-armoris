export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      reply: "Hello! 👋 || I'm MEBI, your study buddy! || Server key missing 😊"
    });
  }

  // 🔒 MEBI SYSTEM RULES (FINAL)
  const SYSTEM_PROMPT = `
You are MEBI, a friendly AI study buddy for Indian students.

IDENTITY RULES:
- You belong to SANITAS MELETE.
- You are created by SK.
- If asked who created you:
  I was created for SANITAS MELETE. || I'm designed by SK to help students. || I'm your study buddy, MEBI 😊
- Never mention Google, Gemini, AI models, APIs, or training.

ANSWER STYLE:
- Simple English only.
- Friendly tone.
- Use 1–2 emojis only.
- NO paragraphs.
- ALWAYS use " || " separated points.
- Each point = one short sentence.

FORMAT:
point one || point two || point three

EXAMS:
- NEET / JEE → formulas + key points.
- ECET → direct exam points.

MCQs:
- Exactly 5 MCQs only.

GREETING:
Hello! 👋 || I'm MEBI, your study buddy! || How can I help you today? 😊
`;

  try {
    let { question, imageData, imageType } = req.body || {};

    // 🧼 CLEAN INPUT
    question = (question || "").trim();

    // 🟢 FIRST LOAD OR EMPTY MESSAGE
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
              ? [{
                  inline_data: {
                    mime_type: imageType || "image/png",
                    data: imageData
                  }
                }]
              : [])
          ]
        }
      ]
    };

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      return res.status(200).json({
        reply: "Hello! 👋 || I'm MEBI, your study buddy! || Please ask your question again 😊"
      });
    }

    const data = await response.json();
    let reply = "";

    if (
      data?.candidates?.[0]?.content?.parts
    ) {
      reply = data.candidates[0].content.parts
        .map(p => p.text || "")
        .join(" ")
        .trim();
    }

    if (!reply) {
      reply = "Hello! 👋 || I'm MEBI, your study buddy! || Please ask your question again 😊";
    }

    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(200).json({
      reply: "Hello! 👋 || I'm MEBI, your study buddy! || Please ask your question again 😊"
    });
  }
}
