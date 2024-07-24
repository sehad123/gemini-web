import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import MarkdownIt from 'markdown-it';
import { maybeShowApiKeyBanner } from './gemini-api-banner';
import './style.css';

let API_KEY = 'AIzaSyCLTOiwEHTJpl_SScdmP2ZckCNX5Ci2TAQ';

let form = document.querySelector('form');
let promptInput = document.querySelector('input[name="prompt"]');
let output = document.querySelector('.output');
let imageUpload = document.getElementById('image-upload');
let imagePreview = document.getElementById('image-preview');
let copyButton = document.getElementById('copy-button');
let historyList = document.getElementById('history-list');
let darkModeToggle = document.getElementById('dark-mode-toggle');
let historyJudul = document.querySelector('.history-judul');
let historyContainer = document.querySelector('.history-container');
let chatContainer = document.querySelector('.chat-container');

let history = [];
let historyIndex = 0;

imageUpload.onchange = () => {
  let file = imageUpload.files[0];
  if (file && file.type.startsWith('image/')) {
    let reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.innerHTML = `<img src="${e.target.result}" alt="Image preview" width="200">`;
    };
    reader.readAsDataURL(file);
  } else {
    imagePreview.innerHTML = '';
  }
};

form.onsubmit = async (ev) => {
  ev.preventDefault();
  output.textContent = 'Generating...';
  copyButton.style.display = 'none'; // Hide the copy button initially

  try {
    let file = imageUpload.files[0];
    let imageBase64 = null;
    let fileContent = '';

    if (file) {
      if (file.type.startsWith('image/')) {
        imageBase64 = await new Promise((resolve, reject) => {
          let reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        fileContent = await new Promise((resolve, reject) => {
          let reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsText(file);
        });
      }
    }

    let contents = [
      {
        role: 'user',
        parts: [
          imageBase64 ? { inline_data: { mime_type: file.type, data: imageBase64, } } : null,
          fileContent ? { text: fileContent } : null,
          { text: promptInput.value }
        ].filter(Boolean)
      }
    ];

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    // Clear the input fields after submission
    let userPrompt = promptInput.value;
    promptInput.value = '';
    imageUpload.value = '';
    imagePreview.innerHTML = '';

    const result = await model.generateContentStream({ contents });

    let buffer = [];
    let md = new MarkdownIt();
    for await (let response of result.stream) {
      buffer.push(response.text());
      output.innerHTML = md.render(buffer.join(''));
    }

    // Show the copy button after output is generated
    copyButton.style.display = 'block';

    // Save history
    let historyItem = {
      id: historyIndex++,
      prompt: userPrompt,
      output: buffer.join('')
    };
    history.push(historyItem);
    updateHistoryList();

  } catch (e) {
    output.innerHTML += '<hr>' + e;
  }
};

function updateHistoryList() {
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
updateHistoryList();

copyButton.onclick = () => {
  let textToCopy = output.innerText;
  navigator.clipboard.writeText(textToCopy)
    .then(() => {
      alert('Output copied to clipboard');
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
    });
};

darkModeToggle.onclick = () => {
  document.body.classList.toggle('dark-mode');
};

maybeShowApiKeyBanner(API_KEY);

window.selectOption = function(option) {
  output.textContent = 'Generating...';
  copyButton.style.display = 'none';
  setTimeout(() => {
    let answer = '';
    switch(option) {
      case 'Dimana Lokasi BPS Boyolali':
        answer = 'Lokasi BPS Boyolali berada di Jl. Pandanaran No.234, Boyolali, Jawa Tengah.';
        break;
      case 'Apa saja tugas dan fungsi BPS Boyolali?':
        answer = 'Tugas dan fungsi BPS Boyolali meliputi penyediaan data statistik untuk pemerintah dan masyarakat, melakukan survei dan sensus, serta analisis data statistik.';
        break;
      case 'Bagaimana cara mendapatkan data statistik dari BPS Boyolali?':
        answer = 'Data statistik dari BPS Boyolali dapat diperoleh melalui situs resmi BPS, datang langsung ke kantor BPS Boyolali, atau melalui permintaan data secara tertulis.';
        break;
      case 'Apa saja program unggulan BPS Boyolali?':
        answer = 'Program unggulan BPS Boyolali termasuk sensus penduduk, survei sosial ekonomi, dan publikasi statistik daerah.';
        break;
      case 'Berapa angka inflasi Boyolali':
        answer = 'Angka inflasi Boyolali saat ini adalah sekitar 3.5% per tahun, berdasarkan data terakhir yang tersedia.';
        break;
      case 'Berapa angka kemiskinan Boyolali':
        answer = 'Angka kemiskinan Boyolali saat ini adalah sekitar 10.2%, menurut survei terbaru dari BPS.';
        break;
      default:
        answer = 'Opsi tidak dikenal.';
    }
    output.textContent = answer;
    copyButton.style.display = 'block';

    // Save to history
    let historyItem = {
      id: historyIndex++,
      prompt: option,
      output: answer
    };
    history.push(historyItem);
    updateHistoryList();
  }, 2000);
}

updateHistoryList();
