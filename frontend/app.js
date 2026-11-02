let CATEGORIES = [];
let PICTOGRAMS = [];
let BASE_PICTOGRAMS = [];
let currentCategory = "";
let sentence = [];

const CATEGORY_ICONS = {
  "Sentimenti": "😊",
  "Bisogni": "🚨",
  "Azioni": "🏃",
  "Persone": "👥"
};

const CUSTOM_STORAGE_KEY = "aac-custom-pictograms";

function getCustomPictograms() {
  try {
    const stored = localStorage.getItem(CUSTOM_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Error loading custom pictograms:", e);
    return [];
  }
}

function saveCustomPictograms(custom) {
  try {
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(custom));
  } catch (e) {
    console.error("Error saving custom pictograms:", e);
    alert("Impossibile salvare i pittogrammi personalizzati. Spazio insufficiente?");
  }
}

function addCustomPictogram(label, category, imageUrl = null) {
  const custom = getCustomPictograms();
  const newPicto = {
    label: label,
    search: label.toLowerCase(),
    category: category,
    core: false,
    custom: true,
    id: `custom-${Date.now()}`,
    image: imageUrl
  };
  custom.push(newPicto);
  saveCustomPictograms(custom);
  return newPicto;
}

function deleteCustomPictogram(id) {
  const custom = getCustomPictograms();
  const filtered = custom.filter(p => p.id !== id);
  saveCustomPictograms(filtered);
}

async function loadData() {
  const res = await fetch("./pictograms.json");
  BASE_PICTOGRAMS = await res.json();
  const custom = getCustomPictograms();
  PICTOGRAMS = [...BASE_PICTOGRAMS, ...custom];
  CATEGORIES = [...new Set(PICTOGRAMS.map(p => p.category))];
  currentCategory = CATEGORIES[0];
}

function speak(text) {
  if (!text.trim()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "it-IT";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

function renderTabs() {
  const tabsEl = document.getElementById("category-tabs");
  tabsEl.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "tab" + (cat === currentCategory ? " active" : "");
    const icon = CATEGORY_ICONS[cat] || "📂";
    btn.innerHTML = `<span class="tab-icon">${icon}</span><span class="tab-label">${cat}</span>`;
    btn.onclick = () => { currentCategory = cat; renderTabs(); renderGrid(); };
    tabsEl.appendChild(btn);
  });
}

function renderCoreRow() {
  const leftEl = document.getElementById("core-left");
  const rightEl = document.getElementById("core-right");
  if (!leftEl || !rightEl) return;

  leftEl.innerHTML = "";
  rightEl.innerHTML = "";

  const cores = PICTOGRAMS.filter(p => p.core);
  const mid = Math.ceil(cores.length / 2);
  const leftCores = cores.slice(0, mid);
  const rightCores = cores.slice(mid);

  leftCores.forEach(p => leftEl.appendChild(makeButton(p, "core-btn")));
  rightCores.forEach(p => rightEl.appendChild(makeButton(p, "core-btn")));
}

function renderGrid() {
  const gridEl = document.getElementById("grid");
  gridEl.innerHTML = "";
  PICTOGRAMS.filter(p => p.category === currentCategory).forEach(p => gridEl.appendChild(makeButton(p)));
}

function makeButton(p, extraClass = "") {
  const btn = document.createElement("button");
  btn.className = "pictogram-btn " + extraClass;
  const img = p.image
    ? `<img src="${p.image}" alt="${p.label}" class="icon-img">`
    : "";
  btn.innerHTML = `${img}<span>${p.label}</span>`;
  btn.onclick = () => {
    sentence.push(p);
    renderSentence();
    speak(p.label);
  };
  return btn;
}

function renderSentence() {
  const wordsEl = document.getElementById("sentence-words");
  wordsEl.innerHTML = "";
  if (sentence.length === 0) {
    wordsEl.innerHTML = `<span id="placeholder">Tocca un simbolo per iniziare</span>`;
    return;
  }
  sentence.forEach(word => {
    const span = document.createElement("span");
    span.className = "word-token";
    const imgHtml = word.image
      ? `<img src="${word.image}" alt="${word.label}" class="token-img">`
      : "";
    span.innerHTML = `${imgHtml}<span class="token-text">${word.label}</span>`;
    wordsEl.appendChild(span);
  });
}

document.getElementById("clear-btn").onclick = () => { sentence = []; renderSentence(); };
document.getElementById("speak-btn").onclick = () => speak(sentence.map(w => w.label).join(" "));

document.getElementById("add-custom-btn").onclick = openCustomModal;
document.getElementById("manage-custom-btn").onclick = openManageModal;

// Custom pictogram modal
const modal = document.getElementById("custom-modal");
const customForm = document.getElementById("custom-form");

function openCustomModal() {
  modal.classList.add("active");
  document.getElementById("custom-label").focus();
}

function closeCustomModal() {
  modal.classList.remove("active");
  customForm.reset();
}

document.getElementById("close-modal").onclick = closeCustomModal;
document.getElementById("cancel-custom").onclick = closeCustomModal;

customForm.onsubmit = (e) => {
  e.preventDefault();
  const label = document.getElementById("custom-label").value.trim();
  const category = document.getElementById("custom-category").value;
  const imageUrl = document.getElementById("custom-image").value.trim() || null;

  if (!label) return;

  addCustomPictogram(label, category, imageUrl);
  closeCustomModal();

  // Reload data to include new custom pictogram
  loadData().then(() => {
    renderTabs();
    renderCoreRow();
    renderGrid();
  });
};

// Close modal on backdrop click
modal.onclick = (e) => {
  if (e.target === modal) closeCustomModal();
};

// Manage custom pictograms modal
const manageModal = document.getElementById("manage-modal");

function openManageModal() {
  manageModal.classList.add("active");
  renderCustomList();
}

function closeManageModal() {
  manageModal.classList.remove("active");
}

document.getElementById("close-manage-modal").onclick = closeManageModal;
document.getElementById("close-manage-btn").onclick = closeManageModal;

function renderCustomList() {
  const listEl = document.getElementById("custom-list");
  const custom = getCustomPictograms();

  if (custom.length === 0) {
    listEl.innerHTML = `<div class="empty-custom">Nessun pittogramma personalizzato. Tocca "+" per aggiungerne uno.</div>`;
    return;
  }

  listEl.innerHTML = "";
  custom.forEach(p => {
    const item = document.createElement("div");
    item.className = "custom-item";

    const imgHtml = p.image
      ? `<img src="${p.image}" alt="${p.label}" class="custom-item-img">`
      : "";

    item.innerHTML = `
      <div class="custom-item-info">
        ${imgHtml}
        <div class="custom-item-text">
          <span class="custom-item-label">${p.label}</span>
          <span class="custom-item-category">${p.category}</span>
        </div>
      </div>
      <button class="delete-btn" data-id="${p.id}">Elimina</button>
    `;

    item.querySelector(".delete-btn").onclick = () => {
      if (confirm(`Eliminare "${p.label}"?`)) {
        deleteCustomPictogram(p.id);
        renderCustomList();
        // Reload data to reflect deletion
        loadData().then(() => {
          renderTabs();
          renderCoreRow();
          renderGrid();
        });
      }
    };

    listEl.appendChild(item);
  });
}

manageModal.onclick = (e) => {
  if (e.target === manageModal) closeManageModal();
};

loadData().then(() => {
  renderTabs();
  renderCoreRow();
  renderGrid();
  renderSentence();
});