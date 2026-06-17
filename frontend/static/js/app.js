const state = {
  personFile: null,
  garmentFile: null,
  garmentType: 'top',
};

const personDrop = document.getElementById('person-drop');
const garmentDrop = document.getElementById('garment-drop');
const personInput = document.getElementById('person-input');
const garmentInput = document.getElementById('garment-input');
const btnRun = document.getElementById('btn-run');
const statusBar = document.getElementById('status-bar');
const statusMsg = document.getElementById('status-msg');
const statusSpinner = document.getElementById('status-spinner');
const resultSection = document.getElementById('result-section');
const resultImg = document.getElementById('result-img');
const btnDownload = document.getElementById('btn-download');

// Selector tipo de prenda
document.querySelectorAll('.garment-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.garment-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.garmentType = btn.dataset.type;
  });
});

// Drag & Drop
function setupDropZone(dropZone, input, key) {
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, dropZone, key);
  });
  input.addEventListener('change', () => {
    if (input.files[0]) handleFile(input.files[0], dropZone, key);
  });
}

function handleFile(file, dropZone, key) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    showStatus('Formato no compatible. Usa JPG, PNG o WEBP.', 'error');
    return;
  }
  state[key] = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    let img = dropZone.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      dropZone.appendChild(img);
      dropZone.querySelector('.placeholder').style.display = 'none';
    }
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  updateRunButton();
}

function updateRunButton() {
  btnRun.disabled = !(state.personFile && state.garmentFile);
}

// Llamada a la API
btnRun.addEventListener('click', async () => {
  if (!state.personFile || !state.garmentFile) return;

  btnRun.disabled = true;
  resultSection.classList.remove('visible');
  showStatus('Analizando pose con MediaPipe y generando imagen... esto puede tardar 1-2 minutos.', 'loading');

  const formData = new FormData();
  formData.append('person_image', state.personFile);
  formData.append('garment_image', state.garmentFile);
  formData.append('garment_type', state.garmentType);

  try {
    const response = await fetch('/api/tryon', {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(300000),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Error desconocido.');

    showStatus('¡Imagen generada correctamente!', 'success');
    resultImg.src = data.result_url;
    btnDownload.href = data.result_url;
    btnDownload.download = 'virtual-tryon-result.jpg';
    resultSection.classList.add('visible');

  } catch (err) {
    showStatus(`Error: ${err.message}`, 'error');
  } finally {
    btnRun.disabled = false;
  }
});

function showStatus(message, type = 'loading') {
  statusBar.className = 'status-bar visible';
  statusMsg.textContent = message;
  if (type === 'loading') {
    statusSpinner.style.display = 'block';
    statusBar.classList.remove('error', 'success');
  } else if (type === 'error') {
    statusSpinner.style.display = 'none';
    statusBar.classList.add('error');
  } else {
    statusSpinner.style.display = 'none';
    statusBar.classList.add('success');
  }
}

setupDropZone(personDrop, personInput, 'personFile');
setupDropZone(garmentDrop, garmentInput, 'garmentFile');
updateRunButton();
