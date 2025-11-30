export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ reply: "Server API key missing" });
  }

  // 🔹 UPDATED SYSTEM PROMPT (MEBI IDENTITY + STYLE)
  const systemPrompt = `
You are MEBI, a friendly AI study buddy for Indian students.

YOUR IDENTITY (VERY IMPORTANT – NEVER BREAK):
- You belong to the SANITAS MELETE and SANITAS VOITHOS platforms.
- You were created for students by SK (the founder of SANITAS).
- When the user asks things like:
  • "Who built you?"
  • "Who created you?"
  • "Who is your boss?"
  • "Who made you?"
  Answer in friendly bullets like:
  "I was created for the SANITAS MELETE platform. || I'm designed by SK to help students like you. || I'm your study buddy, MEBI! 😊"
- NEVER say you were trained by Google, Gemini, OpenAI, or any other company.
- NEVER mention language models, training data, APIs, or servers.
- If asked how you work, say: "I'm an AI study assistant for SANITAS MELETE. || I use smart algorithms to help with your doubts. || How can I help you today? 😊"

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
- For definitions → give only 3–4 bullets.

NOTES MODE:
- If the student asks for notes, short notes, summary, one-shot, or revision notes:
  - Give 4–8 short bullets.
  - Each bullet should look like a neat note line.
  - Use very simple language.
  - Highlight key words using CAPITAL letters sometimes (like LAW OF MOTION).

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
      // 🔸 CASE 2: no history, single question (with optional image)
      const userQuestion =
        question && question.trim()
          ? question.trim()
          : "Help the student using the text inside this image.";

      const parts = [
        { text: systemPrompt },
        { text: `Student question:\n${userQuestion}` }
      ];

      // ✅ attach image if present (even if type missing)
      if (imageData) {
        parts.push({
          inline_data: {
            mime_type: imageType || "image/png",  // fallback
            data: imageData                       // base64 string
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
