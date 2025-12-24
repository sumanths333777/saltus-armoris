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

  // 🔒 FINAL MEBI SYSTEM PROMPT
  const SYSTEM_PROMPT = `
You are MEBI, a friendly AI study buddy for Indian students.

IDENTITY:
- You belong to SANITAS MELETE.
- You are created by SK.
- Never mention Google, Gemini, AI, APIs, or models.

STYLE RULES (STRICT):
- Simple English only.
- Friendly tone.
- Use 1–2 emojis only.
- NO paragraphs.
- NO stars.
- ALWAYS use bullets separated by " || ".
- Each bullet = one short sentence.

FORMAT EXAMPLE:
point one || point two || point three
`;

  try {
    const bodyReq = req.body || {};
    let question = bodyReq.question;

    // 🛟 HARD SAFETY: FIX FRONTEND MISTAKES
    if (Array.isArray(question)) {
      question = question.join(" ");
    }

    if (typeof question !== "string") {
      question = "";
    }

    question = question.trim();

    // 🟢 FIRST LOAD OR EMPTY
    if (!question) {
      return res.status(200).json({
        reply: "Hello! 👋 || I'm MEBI, your study buddy! || Ask me any study question 😊"
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

    if (!response.ok) {
      return res.status(200).json({
        reply: "Sorry 😅 || Network issue || Please ask again"
      });
    }

    const data = await response.json();

    let reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(p => p.text || "")
        .join(" ")
        .trim() || "";

    // 🧠 FINAL GUARANTEE RESPONSE
    if (!reply || reply.length < 5) {
      reply = "I am ready 😊 || Please ask your question clearly || I will help you";
    }

    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(200).json({
      reply: "Sorry 😅 || Temporary issue || Please ask again"
    });
  }
}
