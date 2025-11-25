export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  const { question } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ reply: "Server API key missing" });
  }

  const model = "gemini-pro";
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    model +
    ":generateContent?key=" +
    apiKey;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: question || "Hello!" }]
          }
        ]
      })
    });

    const data = await response.json();

    // log full response to Vercel logs
    console.log("Gemini response:", JSON.stringify(data));

    // if HTTP status is not OK, return the error message so we can see it
    if (!response.ok) {
      const message =
        data?.error?.message || `HTTP ${response.status} from Gemini`;
      return res
        .status(500)
        .json({ reply: "Gemini error: " + message });
    }

    // normal success path
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate an answer from Gemini.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Gemini API error (network/other):", err);
    return res.status(500).json({ reply: "Error talking to AI server." });
  }
}
