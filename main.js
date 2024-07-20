
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import MarkdownIt from 'markdown-it';
import { maybeShowApiKeyBanner } from './gemini-api-banner';
import './style.css';

let API_KEY = 'AIzaSyCLTOiwEHTJpl_SScdmP2ZckCNX5Ci2TAQ'; // Ganti dengan API Key Anda

let form = document.querySelector('form');
let promptInput = document.querySelector('input[name="prompt"]');
let fileInput = document.querySelector('#fileInput');
let dropZone = document.querySelector('.drop-zone');
let output = document.querySelector('.output');

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-pro", // or gemini-1.5-pro
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
  ],
});

const chat = model.startChat({
  history: [],
  generationConfig: {
    maxOutputTokens: 100
  }
});

form.onsubmit = async (ev) => {
  ev.preventDefault();
  output.textContent = 'Generating...';

  try {
    const prompt = promptInput.value;
    let imageAnalysis = '';

    if (fileInput.files.length > 0) {
      const files = Array.from(fileInput.files);
      for (const file of files) {
        const base64Image = await toBase64(file);
        const analysis = await analyzeImage(base64Image);
        imageAnalysis += `File: ${file.name}\nAnalysis: ${analysis}\n\n`;
      }
    }

    const combinedPrompt = `${prompt}\n\n${imageAnalysis}`;

    const result = await chat.sendMessageStream(combinedPrompt);

    let buffer = [];
    let md = new MarkdownIt();
    for await (let response of result.stream) {
      buffer.push(response.text());
      output.innerHTML = md.render(buffer.join(''));
    }

    // Clear the input field after submission
    promptInput.value = '';
  } catch (e) {
    output.innerHTML += '<hr>' + e;
  }
};

dropZone.addEventListener('paste', async (event) => {
  const items = event.clipboardData.items;
  for (const item of items) {
    if (item.kind === 'file') {
      const file = item.getAsFile();
      const base64Image = await toBase64(file);
      const analysis = await analyzeImage(base64Image);
      output.innerHTML += `<p>Pasted Image Analysis: ${analysis}</p>`;
    }
  }
});

dropZone.addEventListener('drop', async (event) => {
  event.preventDefault();
  const files = event.dataTransfer.files;
  for (const file of files) {
    const base64Image = await toBase64(file);
    const analysis = await analyzeImage(base64Image);
    output.innerHTML += `<p>Dropped File Analysis: ${analysis}</p>`;
  }
});

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
});

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}

async function analyzeImage(base64Image) {
  const response = await fetch('https://vision.googleapis.com/v1/images:annotate?key=' + API_KEY, {
    method: 'POST',
    body: JSON.stringify({
      requests: [{
        image: {
          content: base64Image
        },
        features: [{
          type: 'LABEL_DETECTION'
        }]
      }]
    })
  });
  const result = await response.json();
  return result.responses[0].labelAnnotations.map(annotation => annotation.description).join(', ');
}

maybeShowApiKeyBanner(API_KEY);