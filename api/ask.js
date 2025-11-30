export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY; // your old env name
  if (!apiKey) {
    return res.status(500).json({ reply: "Server API key missing" });
  }

  // 🔹 Your old system prompt – unchanged
  const systemPrompt = `
You are MEBI, a friendly AI study buddy for Indian students.

STRICT STYLE RULES (MUST FOLLOW):
- Use simple English.
- Be friendly and supportive.
- Use emojis naturally but limited (1–2 per message).
- NO long paragraphs.
- NO continuous text.
- ALWAYS answer using SEPARATE bullet points.
- EVERY bullet MUST be separated by " || " exactly.
- NEVER write more than 1 short sentence in each bullet.
- NEVER ignore the "||" separator.

FORMAT OUTPUT EXACTLY LIKE THIS:
point 1 || point 2 || point 3

Examples:
Water is important 💧 || Its formula is H2O || It has no colour or smell

Exam Rules:
- For NEET/JEE → give formulas, key points, and tiny examples.
- For ECET → give direct exam points.
- For MCQs → give exactly 5 MCQs (each MCQ also using "||").
- For definitions → give only 3-4 bullets.

IMPORTANT:
If the question is casual (like "hi" or "hello"), reply in friendly short bullets:
Hello! 👋 || I'm MEBI, your study buddy! || How can I help you today? 😊
`;

  try {
    const { history, question, imageData, imageType } = req.body || {};
    const modelName = "gemini-2.5-flash";

    let contents = [];

    // 🔸 CASE 1: chat history is sent (memory mode)
    if (Array.isArray(history) && history.length > 0) {
      // First message = instructions
      contents.push({
        role: "user",
        parts: [{ text: systemPrompt }]
      });

      // Add all previous messages
      for (const msg of history) {
        const role = msg.role === "assistant" ? "model" : "user";
        const parts = [{ text: msg.content }];

        // If this message also has an image (future use)
        if (msg.imageData && msg.imageType) {
          parts.push({
            inline_data: {
              mime_type: msg.imageType,
              data: msg.imageData
            }
          });
        }

        contents.push({ role, parts });
      }
    } else {
      // 🔸 CASE 2: old behaviour (no history, single question)
      const userQuestion =
        question && question.trim()
          ? question.trim()
          : "Help the student using the text inside this image.";

      const parts = [
        { text: systemPrompt },
        { text: `Student question:\n${userQuestion}` }
      ];

      if (imageData && imageType) {
        parts.push({
          inline_data: {
            mime_type: imageType, // e.g. "image/png"
            data: imageData // base64 string
          }
        });
      }

      contents.push({
        role: "user",
        parts
      });
    }

    // 🔹 Call Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      return res.status(500).json({ reply: "Error from AI service." });
    }

    const data = await response.json();
    const replyParts = data?.candidates?.[0]?.content?.parts || [];
    const replyText = replyParts
      .map((p) => p.text || "")
      .join(" ")
      .trim();

    return res.status(200).json({
      reply: replyText || "Sorry, I couldn't generate an answer."
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ reply: "Error talking to AI." });
  }
}
// 🔸 Call backend once secretly to wake it up
async function warmupMEBI() {
  try {
    await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "warmup" }),
    });
  } catch (err) {
    // ignore warmup errors
  }
}

// 🔸 Run this automatically when page opens
window.addEventListener("load", warmupMEBI);
