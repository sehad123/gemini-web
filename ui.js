let output = document.querySelector('.output');
let copyButton = document.getElementById('copy-button');

export function setupUIInteractions() {
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

  document.getElementById('dark-mode-toggle').onclick = () => {
    document.body.classList.toggle('dark-mode');
  };
}
