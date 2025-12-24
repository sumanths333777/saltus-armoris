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
    const { question, imageData, imageType } = req.body || {};

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
            { text: question || "Explain the image." },
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();

    let reply = "";

    // ✅ SAFE EXTRACTION (THIS SAVES THE PATIENT)
    if (data?.candidates?.length) {
      const content = data.candidates[0].content;

      if (content?.parts?.length) {
        reply = content.parts
          .map(p => (typeof p.text === "string" ? p.text : ""))
          .join(" ");
      } else if (typeof content?.text === "string") {
        reply = content.text;
      }
    }

    reply = reply.replace(/\s+/g, " ").trim();

    // 🛡️ FINAL SAFETY
    if (!reply || reply.length < 10) {
      reply = "I am ready 😊 || Please ask your question clearly || I will help you";
    }

    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(200).json({
      reply: "I am here 😊 || Network was slow || Please ask again"
    });
  }
}
