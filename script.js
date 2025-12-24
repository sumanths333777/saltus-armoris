// 🔐 SIMPLE CONTENT FILTER FOR MEBI
const bannedWords = [
  "sex","porn","nude","xxx","fuck","boobs","dick","pussy","bastard","asshole",
  "suicide","kill myself","murder","bomb","terrorist"
];

const bannedTopics = [
  "how to hack","hack wifi","make bomb","drugs","weed","ganja"
];

let warningCount = 0;
const MAX_WARNINGS = 3;

function isBlockedMessage(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  if (bannedWords.some(w => lower.includes(w))) return true;
  if (bannedTopics.some(w => lower.includes(w))) return true;
  return false;
}

// ⭐ FORMAT MEBI REPLY INTO NUMBERED BULLETS
function formatMebiReply(text) {
  if (!text) return text;

  const parts = text
    .split("||")
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (parts.length <= 1) return text;

  return parts.map((p, i) => `${i + 1}) ${p}`).join("\n");
}

// 🔹 GLOBALS
let selectedImageFile = null;
let chatHistory = [];

// 🔹 File → base64
function fileToBase64(file) {
  return new Promise(resolve => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}

// 🔹 SEND MESSAGE
async function sendMessage() {
  const input = document.getElementById("user-input");
  const chat = document.getElementById("chat");
  const typing = document.getElementById("typing");
  const imageNameEl = document.getElementById("uploadPreview");

  const text = (input.value || "").trim();

  // 🚫 FILTER
  if (isBlockedMessage(text)) {
    warningCount++;
    const bot = document.createElement("div");
    bot.className = "bubble bot";
    bot.textContent =
      warningCount >= MAX_WARNINGS
        ? "🚫 Chat locked due to unsafe messages."
        : "❌ Only education-related questions allowed.";
    chat.appendChild(bot);
    chat.scrollTop = chat.scrollHeight;
    return;
  }

  if (!text && !selectedImageFile) return;

  // 👤 USER BUBBLE
  if (text) {
    const userBubble = document.createElement("div");
    userBubble.className = "bubble user";
    userBubble.textContent = text;
    chat.appendChild(userBubble);
    chatHistory.push({ role: "user", text });
  }

  input.value = "";
  if (typing) typing.classList.remove("hidden");

  // 🧠 CONTEXT (LAST 6 MESSAGES)
  const combinedQuestion = chatHistory
    .slice(-6)
    .map(m => m.text)
    .join(" || ");

  async function askOnce() {
    const imageBase64 = selectedImageFile
      ? await fileToBase64(selectedImageFile)
      : null;

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: combinedQuestion,
        imageData: imageBase64,
        imageType: selectedImageFile?.type || null
      })
    });

    const data = await res.json();
    return data.reply;
  }

  let reply = "";
  try {
    reply = await askOnce();
  } catch {
    reply = "";
  }

  if (typing) typing.classList.add("hidden");

  // 🤖 BOT SAFE FALLBACK
  if (!reply) {
    reply = "Hello! 👋 || I'm MEBI, your study buddy! || Please ask your question again 😊";
  }

  const botBubble = document.createElement("div");
  botBubble.className = "bubble bot";
  botBubble.textContent = formatMebiReply(reply);
  chat.appendChild(botBubble);

  chatHistory.push({ role: "bot", text: reply });

  selectedImageFile = null;
  if (imageNameEl) imageNameEl.textContent = "";
  chat.scrollTop = chat.scrollHeight;
}

// 🔹 FILE INPUT
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const imageNameEl = document.getElementById("uploadPreview");

  if (fileInput) {
    fileInput.addEventListener("change", e => {
      selectedImageFile = e.target.files[0] || null;
      imageNameEl.textContent = selectedImageFile
        ? `📎 Image attached: ${selectedImageFile.name}`
        : "";
    });
  }
});
