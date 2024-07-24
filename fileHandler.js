export function handleFileUpload() {
    let imageUpload = document.getElementById('image-upload');
    let imagePreview = document.getElementById('image-preview');
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
  }
  