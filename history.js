let history = [];
let historyIndex = 0;
let historyList = document.getElementById('history-list');
let historyJudul = document.querySelector('.history-judul');
let historyContainer = document.querySelector('.history-container');
let chatContainer = document.querySelector('.chat-container');
let output = document.querySelector('.output');
let copyButton = document.getElementById('copy-button');

export function addHistoryItem(item) {
  history.push({ id: historyIndex++, ...item });
}

export function updateHistoryList() {
  historyList.innerHTML = '';
  history.forEach(item => {
    let listItem = document.createElement('li');
    listItem.textContent = item.prompt;
    listItem.onclick = () => {
      output.innerHTML = new MarkdownIt().render(item.output);
      copyButton.style.display = 'block';
    };
    historyList.appendChild(listItem);
  });

  historyContainer.style.display = history.length > 0 ? 'block' : 'none';
  historyJudul.style.display = history.length > 0 ? 'block' : 'none';

  if (history.length === 0) {
    historyContainer.classList.add('hidden');
    chatContainer.classList.add('expanded');
  } else {
    historyContainer.classList.remove('hidden');
    chatContainer.classList.remove('expanded');
  }
}

export function initializeHistory() {
  updateHistoryList();
}
