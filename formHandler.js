import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import MarkdownIt from 'markdown-it';
import { addHistoryItem, updateHistoryList } from './history';

let output = document.querySelector('.output');
let copyButton = document.getElementById('copy-button');

export async function handleFormSubmit(ev, API_KEY) {
  ev.preventDefault();
  let form = ev.target;
  let promptInput = form.querySelector('input[name="prompt"]');
  let imageUpload = document.getElementById('image-upload');
  let output = document.querySelector('.output');
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

    let userPrompt = promptInput.value;
    promptInput.value = '';
    imageUpload.value = '';
    document.getElementById('image-preview').innerHTML = '';

    const result = await model.generateContentStream({ contents });

    let buffer = [];
    let md = new MarkdownIt();
    for await (let response of result.stream) {
      buffer.push(response.text());
      output.innerHTML = md.render(buffer.join(''));
    }

    copyButton.style.display = 'block';

    let historyItem = {
      prompt: userPrompt,
      output: buffer.join('')
    };
    addHistoryItem(historyItem);
    updateHistoryList();

  } catch (e) {
    output.innerHTML += '<hr>' + e;
  }
}
