import { handleFormSubmit } from './formHandler';
import { handleFileUpload } from './fileHandler';
import { initializeHistory } from './history';
import { setupUIInteractions } from './ui';
import { maybeShowApiKeyBanner } from './gemini-api-banner';
import './style.css';

let API_KEY = 'AIzaSyCLTOiwEHTJpl_SScdpmP2ZckCNX5Ci2TAQ';

document.addEventListener('DOMContentLoaded', () => {
  let form = document.querySelector('form');
  let imageUpload = document.getElementById('image-upload');
  let darkModeToggle = document.getElementById('dark-mode-toggle');

  form.onsubmit = (ev) => handleFormSubmit(ev, API_KEY);
  imageUpload.onchange = handleFileUpload;
  darkModeToggle.onclick = setupUIInteractions.toggleDarkMode;

  maybeShowApiKeyBanner(API_KEY);
  initializeHistory();
});
