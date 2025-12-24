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

// 🔒 REQUEST LOCK (CRITICAL FIX)
let isSending = false;

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
  return parts.map((p,i)=>`${i+1}) ${p}`).join("\n");
}

// 🔹 globals
let selectedImageFile = null;
let chatHistory = [];
let mcqHintShown = false;

// 🔹 helper: convert File → base64
function fileToBase64(file) {
  return new Promise(resolve => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result || "";
      const parts = result.toString().split(",");
      resolve(parts.length > 1 ? parts[1] : parts[0]);
    };
    reader.readAsDataURL(file);
  });
}

// 🔹 send message (text + optional image)
async function sendMessage() {
  if (isSending) return; // 🔒 LOCK
  isSending = true;

  const input = document.getElementById("user-input");
  const text = (input?.value || "").trim();

  const chat = document.getElementById("chat");
  const typing = document.getElementById("typing");
  const imageNameEl = document.getElementById("selected-image-name");

  if (!chat) {
    isSending = false;
    return;
  }

  // 🛑 content filter
  if (isBlockedMessage(text)) {
    warningCount++;
    const bot = document.createElement("div");
    bot.className = "bubble bot";
    bot.textContent =
      warningCount >= MAX_WARNINGS
        ? "🚫 Chat locked due to repeated unsafe messages. Refresh to restart."
        : "❌ Sorry, I can only answer education-related questions (NEET, JEE, ECET).";
    chat.appendChild(bot);
    chat.scrollTop = chat.scrollHeight;
    isSending = false;
    return;
  }

  if (!text && !selectedImageFile) {
    isSending = false;
    return;
  }

  // user bubble
  if (text) {
    const userBubble = document.createElement("div");
    userBubble.className = "bubble user";
    userBubble.textContent = text;
    chat.appendChild(userBubble);
    chat.scrollTop = chat.scrollHeight;
  }

  if (input) input.value = "";
  if (typing) typing.classList.remove("hidden");

  async function askOnce() {
    const imageBase64 = selectedImageFile
      ? await fileToBase64(selectedImageFile)
      : null;

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: text,
        imageData: imageBase64,
        imageType: selectedImageFile ? selectedImageFile.type : null
      })
    });

    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    return data.reply || "I'm here! 😊";
  }

  let replyText = "";

  try {
    // 1st attempt
    replyText = await askOnce();
  } catch {
    try {
      // single safe retry (backend wake-up)
      await new Promise(r => setTimeout(r, 1200));
      replyText = await askOnce();
    } catch (e2) {
      if (typing) typing.classList.add("hidden");
      const errorBubble = document.createElement("div");
      errorBubble.className = "bubble bot";
      errorBubble.textContent = "MEBI: Network error. Please try again.";
      chat.appendChild(errorBubble);
      chat.scrollTop = chat.scrollHeight;
      selectedImageFile = null;
      if (imageNameEl) imageNameEl.textContent = "";
      isSending = false; // 🔓 UNLOCK
      return;
    }
  }

  // success
  chatHistory.push({ role: "assistant", content: replyText });
  if (typing) typing.classList.add("hidden");

  const botBubble = document.createElement("div");
  botBubble.className = "bubble bot";

  const lowerQuestion = (text || "").toLowerCase();
  const isNotesRequest =
    lowerQuestion.includes("notes") ||
    lowerQuestion.includes("short notes") ||
    lowerQuestion.includes("summary") ||
    lowerQuestion.includes("photo") ||
    lowerQuestion.includes("image") ||
    lowerQuestion.includes("diagram");

  const isMcqRequest =
    lowerQuestion.includes("mcq") ||
    lowerQuestion.includes("mcqs") ||
    lowerQuestion.includes("objective questions") ||
    lowerQuestion.includes("multiple choice");

  if (isNotesRequest) botBubble.classList.add("note-bubble");
  else if (isMcqRequest) botBubble.classList.add("mcq-bubble");

  botBubble.textContent = formatMebiReply(replyText);
  chat.appendChild(botBubble);
  chat.scrollTop = chat.scrollHeight;

  selectedImageFile = null;
  if (imageNameEl) imageNameEl.textContent = "";
  isSending = false; // 🔓 UNLOCK
}

// 🔹 NO PREVIEW
function showFile(){}

// 🔹 DOM ready
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("user-input");
  if (input) {
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") sendMessage();
    });
  }

  const fileInput =
    document.getElementById("fileInput") ||
    document.getElementById("image-upload") ||
    document.querySelector('input[type="file"]');

  const imageNameEl = document.getElementById("selected-image-name");

  if (fileInput) {
    fileInput.addEventListener("change", e => {
      selectedImageFile = e.target.files?.[0] || null;
      if (imageNameEl) {
        imageNameEl.textContent = selectedImageFile
          ? `📎 Image attached: ${selectedImageFile.name}`
          : "";
      }
    });
  }

  const mcqMenu = document.getElementById("mcq-menu-item");
  const chat = document.getElementById("chat");

  if (mcqMenu && input && chat) {
    mcqMenu.style.cursor = "pointer";
    mcqMenu.addEventListener("click", () => {
      chat.scrollTop = chat.scrollHeight;
      input.value = "Give MCQs on ";
      input.focus();
      if (!mcqHintShown) {
        const hint = document.createElement("div");
        hint.className = "bubble bot mcq-bubble";
        hint.textContent =
          "Type a topic after 'Give MCQs on' (example: Give MCQs on respiration).";
        chat.appendChild(hint);
        chat.scrollTop = chat.scrollHeight;
        mcqHintShown = true;
      }
    });
  }
});

// 🔸 Wake backend once (gentle)
async function warmupMEBI() {
  try {
    await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "warmup" })
    });
  } catch {}
}

window.addEventListener("load", warmupMEBI);
