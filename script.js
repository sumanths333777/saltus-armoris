async function sendMessage() {
  const input = document.getElementById('user-input');
  const text = input.value.trim();
  if (!text) return;

  const chat = document.getElementById('chat');
  const typing = document.getElementById('typing');

  // user bubble
  const userBubble = document.createElement('div');
  userBubble.className = 'bubble user';
  userBubble.textContent = text;
  chat.appendChild(userBubble);
  chat.scrollTop = chat.scrollHeight;

  input.value = '';

  // show typing dots
  typing.classList.remove('hidden');

  try {
  const response = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: text })
  });
const data = await response.json();
console.log("AI:", data);

const replyText = data.reply || "Sorry, I couldn't understand.";

const botBubble = document.createElement('div');
botBubble.className = 'bubble bot';
botBubble.textContent = replyText;
chat.appendChild(botBubble);
chat.scrollTop = chat.scrollHeight;

} catch (err) {
  console.error(err);

  const botBubble = document.createElement('div');
  botBubble.className = 'bubble bot';
  botBubble.textContent = 'MEBI: Network error. Please try again.';
  chat.appendChild(botBubble);
  chat.scrollTop = chat.scrollHeight;
}
