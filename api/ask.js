export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;   // 👈 same env name you already use
  if (!apiKey) {
    return res.status(500).json({ reply: "Server API key missing" });
  }

  try {
    const { question, imageData, imageType } = req.body || {};

    // 🔹 Build the text instructions for MEBI
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
- For definitions → give only 1–2 bullets.

IMPORTANT:
If the question is casual (like "hi" or "hello"), reply in friendly short bullets:
Hello! 👋 || I'm MEBI, your study buddy! || How can I help you today? 😊
`;

    const userQuestion = question && question.trim()
      ? question.trim()
      : "Help the student using the text inside this image.";

    // 🔹 Build "parts" (text + optional image)
    const parts = [
      { text: systemPrompt },
      { text: `Student question:\n${userQuestion}` },
    ];

    if (imageData && imageType) {
      parts.push({
        inline_data: {
          mime_type: imageType,   // e.g. "image/png"
          data: imageData,        // base64 string (no data: prefix)
        },
      });
    }

    const modelName = "gemini-2.5-flash";

   const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\nStudent question: ${question || ""}`
            }
          ]
        }
      ]
    })
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
      reply: replyText || "Sorry, I couldn't generate an answer.",
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ reply: "Error talking to AI." });
  }
}
