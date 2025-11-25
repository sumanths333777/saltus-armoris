export default async function handler(req, res) {
  // allow only POST
  if (req.method !== "POST") {
    res.status(405).json({ reply: "Method not allowed" });
    return;
  }

  // get question text from body
  const body = req.body || {};
  const question = body.question || "";

  // get Gemini API key from env (Vercel settings)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ reply: "Server API key missing" });
    return;
  }

  try {
    // call Gemini API
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: question || "Say hello to the student.",
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await geminiRes.json();

    // safely read reply text
    let reply = "Sorry, I couldn't generate an answer.";
    if (
      data &&
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] &&
      data.candidates[0].content.parts[0].text
    ) {
      reply = data.candidates[0].content.parts[0].text;
    }

    res.status(200).json({ reply });
  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(500).json({ reply: "Error talking to AI." });
  }
}
