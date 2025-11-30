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

  return parts
    .map((p, index) => `${index + 1}) ${p}`)
    .join("\n");
}

// SANITUS MELETE – MEBI chat frontend with image (OCR) support

// 🔹 will store the last selected image file
let selectedImageFile = null;
let chatHistory = [];

// 🔹 helper: convert File → base64 (without "data:..." prefix)
function fileToBase64(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result || "";
      const parts = result.toString().split(",");
      const base64 = parts.length > 1 ? parts[1] : parts[0];
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}

// 🔹 send message (text + optional image)
async function sendMessage() {
  const input = document.getElementById("user-input");
  const text = (input?.value || "").trim();

  const chat = document.getElementById("chat");
  const typing = document.getElementById("typing");

  if (!chat) {
    console.error("Chat container not found");
    return;
  }

  // 🛑 content filter for MEBI
  if (isBlockedMessage(text)) {
    warningCount++;

    if (warningCount >= MAX_WARNINGS) {
      // lock message
      const bot = document.createElement("div");
      bot.className = "bubble bot";
      bot.textContent =
        "🚫 Chat locked due to repeated unsafe messages. Refresh to restart.";
      chat.appendChild(bot);
      chat.scrollTop = chat.scrollHeight;
      return;
    }

    const bot = document.createElement("div");
    bot.className = "bubble bot";
    bot.textContent =
      "❌ Sorry, I can only answer education-related questions (NEET, JEE, ECET).";
    chat.appendChild(bot);
    chat.scrollTop = chat.scrollHeight;
    return;
  }

  // if no text and no image, do nothing
  if (!text && !selectedImageFile) return;

  // user bubble (only if text exists)
  if (text) {
    const userBubble = document.createElement("div");
    userBubble.className = "bubble user";
    userBubble.textContent = text;
    chat.appendChild(userBubble);
    chat.scrollTop = chat.scrollHeight;
  }

  // clear text box
  if (input) input.value = "";

  // show typing dots (if element exists)
  if (typing) typing.classList.remove("hidden");

// --- AUTO RETRY LOGIC (fix first-message error + OCR) ---
async function askOnce() {
  // convert image (if any)
  const imageBase64 = selectedImageFile
    ? await fileToBase64(selectedImageFile)
    : null;

  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: text,
      imageData: imageBase64,                     // 👈 matches ask.js
      imageType: selectedImageFile
        ? selectedImageFile.type                  // e.g. "image/png"
        : null,
    }),
  });

  if (!res.ok) throw new Error("HTTP " + res.status);

  const data = await res.json();
  return data.reply || "I'm here! 😊";
}


  let replyText = "";

  try {
    // 1st attempt
    replyText = await askOnce();
  } catch (e1) {
    try {
      // 2nd attempt (backend wake-up)
      replyText = await askOnce();
    } catch (e2) {
      // both attempts failed → show single error bubble
      console.error(e2);
      if (typing) typing.classList.add("hidden");

      const errorBubble = document.createElement("div");
      errorBubble.className = "bubble bot";
      errorBubble.textContent = "MEBI: Network error. Please try again.";
      chat.appendChild(errorBubble);
      chat.scrollTop = chat.scrollHeight;

      selectedImageFile = null;
      if (imageNameEl) imageNameEl.textContent = "";
      return;
    }
  }

  // ---- success path ----

  // save bot reply in history
  chatHistory.push({ role: "assistant", content: replyText });

// ---- success path ----

  // save bot reply in history
  chatHistory.push({ role: "assistant", content: replyText });

  // hide typing dots
  if (typing) typing.classList.add("hidden");

  // bot bubble
  const botBubble = document.createElement("div");
  botBubble.className = "bubble bot";

  // 🔍 detect NOTES / PHOTO requests (for cream card)
  const lowerQuestion = (text || "").toLowerCase();
  const isNotesRequest =
    lowerQuestion.includes("notes") ||
    lowerQuestion.includes("short notes") ||
    lowerQuestion.includes("summary") ||
    lowerQuestion.includes("photo") ||
    lowerQuestion.includes("image") ||
    lowerQuestion.includes("diagram");

  // ⭐ apply cream note style
  if (isNotesRequest) {
    botBubble.classList.add("note-bubble");
  }

  // format into numbered bullets
  botBubble.textContent = formatMebiReply(replyText);

  chat.appendChild(botBubble);
  chat.scrollTop = chat.scrollHeight;

  // after sending, clear the selected image
selectedImageFile = null;
const imageNameEl = document.getElementById("selected-image-name");
if (imageNameEl) imageNameEl.textContent = "";
}

// 🔹 NO PREVIEW – this does nothing (but HTML can still call showFile())
function showFile() {
  return;
}

// 🔹 DOM ready things
document.addEventListener("DOMContentLoaded", () => {
  // enter key sends message
  const input = document.getElementById("user-input");
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        sendMessage();
      }
    });
  }

  // 🔹 file input – capture the selected image for OCR
const fileInput =
  document.getElementById("fileInput") ||
  document.getElementById("image-upload") ||
  document.querySelector('input[type="file"]');

const imageNameEl = document.getElementById("selected-image-name");

if (fileInput) {
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0] || null;
    selectedImageFile = file;

    if (imageNameEl) {
      if (file) {
        imageNameEl.textContent = `📎 Image attached: ${file.name}`;
      } else {
        imageNameEl.textContent = "";
      }
    }

    console.log("Selected image:", file?.name);
  });
}
  // ABOUT MEBI POPUP LOGIC
  const aboutBtn = document.getElementById("aboutMebiBtn");
  const aboutModal = document.getElementById("aboutMebiModal");
  const closeBtn = aboutModal
    ? aboutModal.querySelector(".about-close-btn")
    : null;

  if (aboutBtn && aboutModal) {
    aboutBtn.addEventListener("click", () => {
      aboutModal.style.display = "flex";
    });
  }

  if (closeBtn && aboutModal) {
    closeBtn.addEventListener("click", () => {
      aboutModal.style.display = "none";
    });
  }
});

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
