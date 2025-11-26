// SALTUS ARMORIS – MEBI chat frontend

async function sendMessage() {
  const input = document.getElementById('user-input');
  const text = (input.value || '').trim();
  if (!text) return;

  const chat = document.getElementById('chat');
  const typing = document.getElementById('typing');

  // user bubble
  const userBubble = document.createElement('div');
  userBubble.className = 'bubble user';
  userBubble.textContent = text;
  chat.appendChild(userBubble);
  chat.scrollTop = chat.scrollHeight;

  // clear box
  input.value = '';

  // show typing dots (if element exists)
  if (typing) typing.classList.remove('hidden');

  try {
    // call backend
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: text })
    });

    const data = await response.json();
    console.log("AI:", data);

    const replyText = data.reply || "Sorry, I couldn't understand.";

    // hide typing
    if (typing) typing.classList.add('hidden');

    // bot bubble
    const botBubble = document.createElement('div');
    botBubble.className = 'bubble bot';
    botBubble.textContent = replyText;
    chat.appendChild(botBubble);
    chat.scrollTop = chat.scrollHeight;

  } catch (err) {
    console.error(err);

    if (typing) typing.classList.add('hidden');

    const botBubble = document.createElement('div');
    botBubble.className = 'bubble bot';
    botBubble.textContent = 'MEBI: Network error. Please try again.';
    chat.appendChild(botBubble);
    chat.scrollTop = chat.scrollHeight;
  }
}

// optional: send on Enter key
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('user-input');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
});

// ABOUT MEBI POPUP
const aboutBtn = document.getElementById("aboutMebiBtn");
const aboutModal = document.getElementById("aboutMebiModal");

if (aboutBtn && aboutModal) {
  aboutBtn.onclick = () => {
    aboutModal.style.display = "flex";
  };
}

function closeAboutMebi() {
  if (aboutModal) {
    aboutModal.style.display = "none";
  }
}
