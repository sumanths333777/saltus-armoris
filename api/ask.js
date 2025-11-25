// pages/api/ask.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ reply: 'Method not allowed' });
  }

  const { question } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;  // from Vercel / .env.local

  if (!apiKey) {
    return res.status(500).json({ reply: 'Server API key missing' });
  }

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: question || 'Say hello to the student.'
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    // Take first candidate text safely
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn’t generate an answer.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Gemini API error:', err);
    return res.status(500).json({ reply: 'Error talking to AI.' });
  }
}
