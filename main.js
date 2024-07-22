import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import Base64 from 'base64-js';
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

imageUpload.onchange = () => {
  let file = imageUpload.files[0];
  if (file) {
    let reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.innerHTML = `<img src="${e.target.result}" alt="Image preview" width="200">`;
    };
    reader.readAsDataURL(file);
  }
};

form.onsubmit = async (ev) => {
  ev.preventDefault();
  output.textContent = 'Generating...';
  copyButton.style.display = 'none'; // Hide the copy button initially

  try {
    let file = imageUpload.files[0];
    let imageBase64 = null;

    if (file) {
      imageBase64 = await new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    let contents = [
      {
        role: 'user',
        parts: [
          imageBase64 ? { inline_data: { mime_type: file.type, data: imageBase64, } } : null,
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
  } catch (e) {
    output.innerHTML += '<hr>' + e;
  }
};

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

maybeShowApiKeyBanner(API_KEY);
