// SANITUS MELETE – MEBI chat frontend with image (OCR) support

// 🔹 will store the last selected image file
let selectedImageFile = null;

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

  // if no text and no image, do nothing
  if (!text && !selectedImageFile) return;

  const chat = document.getElementById("chat");
  const typing = document.getElementById("typing");

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

  try {
    // 🔹 prepare image payload if an image is selected
    let imageData = null;
    let imageType = null;

    if (selectedImageFile) {
      imageData = await fileToBase64(selectedImageFile);
      imageType = selectedImageFile.type || "image/png";
    }

    // 🔹 payload for backend
    const payload = {
      question: text,
      imageData,
      imageType,
    };

    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("AI:", data);

    const replyText = data.reply || "Sorry, I couldn't understand.";

    // hide typing
    if (typing) typing.classList.add("hidden");

    // bot bubble
    const botBubble = document.createElement("div");
    botBubble.className = "bubble bot";
    botBubble.textContent = replyText;
    chat.appendChild(botBubble);
    chat.scrollTop = chat.scrollHeight;

  } catch (err) {
    console.error(err);

    if (typing) typing.classList.add("hidden");

    const chat = document.getElementById("chat");
    const botBubble = document.createElement("div");
    botBubble.className = "bubble bot";
    botBubble.textContent = "MEBI: Network error. Please try again.";
    chat.appendChild(botBubble);
    chat.scrollTop = chat.scrollHeight;
  } finally {
    // after sending, clear the selected image
    selectedImageFile = null;
    // if you have any preview element, you can clear it here too
    // e.g. document.getElementById("image-preview").src = "";
  }
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
  // 👉 IMPORTANT: change "image-upload" to your actual input id if different
  const fileInput =
    document.getElementById("image-upload") ||
    document.querySelector('input[type="file"]');

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0] || null;
      selectedImageFile = file;

      // optional: you can also show a small "image attached" indicator
      // or preview here if you already have that in your HTML.
      console.log("Selected image:", file?.name);
    });
  }

  // ABOUT MEBI POPUP LOGIC (same as before)
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
