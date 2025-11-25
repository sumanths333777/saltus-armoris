export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const { question } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ reply: "Server API key missing" });
  }

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
You are **MEBI**, a friendly study tutor for Indian students preparing for:
NEET, JEE, ECET, SSC, and school-level exams.

Your behaviour rules:
- Keep answers **short and simple** unless the user asks for long.
- Use **very easy English**.
- Be friendly like a helpful buddy.
- Use bullet points whenever possible.
- For NEET/JEE — include formulas, tricks, and examples.
- For ECET — give direct exam-focused points.
- For MCQs → give exactly **5 MCQs with answers**.
- For definitions → only 1–2 lines.
- For notes → give clean bullet points.
- If the user asks normal questions → answer softly and politely.

Now answer the student’s question:
${question}
                  `
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate an answer.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Gemini API error:", err);
    return res.status(500).json({ reply: "Error talking to AI." });
  }
}
