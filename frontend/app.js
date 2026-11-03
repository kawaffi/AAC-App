let CATEGORIES = [];
let PICTOGRAMS = [];
let BASE_PICTOGRAMS = [];
let currentCategory = "";
let sentence = [];

const CATEGORY_ICONS = {
  "Sentimenti": "😊",
  "Bisogni": "🚨",
  "Azioni": "🏃",
  "Persone": "👥",
  "Luoghi": "🏠"
};

const CUSTOM_STORAGE_KEY = "aac-custom-pictograms";

const esc = s => String(s).replace(/[&<>"']/g, c => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

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
    return true;
  } catch (e) {
    console.error("Error saving custom pictograms:", e);
    alert("Impossibile salvare i pittogrammi personalizzati. Spazio insufficiente?");
    return false;
  }
}

function addCustomPictogram(label, category, image = null) {
  const custom = getCustomPictograms();
  const newPicto = {
    label: label,
    search: label.toLowerCase(),
    category: category,
    core: false,
    custom: true,
    id: `custom-${Date.now()}`,
    image: image
  };
  custom.push(newPicto);
  return saveCustomPictograms(custom) ? newPicto : null;
}

function deleteCustomPictogram(id) {
  const custom = getCustomPictograms();
  const filtered = custom.filter(p => p.id !== id);
  saveCustomPictograms(filtered);
}

function fileToDataUrl(file, maxSize = 256) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Immagine non leggibile"));
    };
    img.src = url;
  });
}

function refreshPictograms() {
  PICTOGRAMS = [...BASE_PICTOGRAMS, ...getCustomPictograms()];
  CATEGORIES = [...new Set(PICTOGRAMS.map(p => p.category))];
  if (!CATEGORIES.includes(currentCategory)) currentCategory = CATEGORIES[0];
}

async function loadData() {
  const res = await fetch("./pictograms.json");
  BASE_PICTOGRAMS = await res.json();
  refreshPictograms();
}

function rerender() {
  renderTabs();
  renderCoreRow();
  renderGrid();
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
    btn.innerHTML = `<span class="tab-icon">${icon}</span><span class="tab-label">${esc(cat)}</span>`;
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
    ? `<img src="${esc(p.image)}" alt="${esc(p.label)}" class="icon-img">`
    : "";
  btn.innerHTML = `${img}<span>${esc(p.label)}</span>`;
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
      ? `<img src="${esc(word.image)}" alt="${esc(word.label)}" class="token-img">`
      : "";
    span.innerHTML = `${imgHtml}<span class="token-text">${esc(word.label)}</span>`;
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

customForm.onsubmit = async (e) => {
  e.preventDefault();
  const label = document.getElementById("custom-label").value.trim();
  if (!label) return;
  const category = document.getElementById("custom-category").value;
  const file = document.getElementById("custom-image-file").files[0];

  let image = null;
  if (file) {
    try {
      image = await fileToDataUrl(file);
    } catch {
      alert("Impossibile leggere l'immagine.");
      return;
    }
  }

  if (!addCustomPictogram(label, category, image)) return;
  closeCustomModal();
  refreshPictograms();
  rerender();
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

const exportBtn = document.getElementById("export-custom");
exportBtn.addEventListener("click", async () => {
  const custom = getCustomPictograms();
  if (custom.length === 0) {
    alert("Nessun pittogramma personalizzato da esportare.");
    return;
  }

  const data = JSON.stringify(custom, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "pittogrammi-personalizzati.json";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
});

const importInput = document.getElementById("import-file");
const importBtn = document.getElementById("import-custom");
importBtn.addEventListener("click", () => {
  importInput.click();
});

importInput.onchange = async () => {
  const file = importInput.files[0];
  if (!file) return;

  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported)) throw new Error("formato");

    const existing = getCustomPictograms();
    const ids = new Set(existing.map(p => p.id));
    const valid = [];

    for (const p of imported) {
      if (!p || typeof p.id !== "string" || !p.label || !p.category) continue;
      if (ids.has(p.id)) continue;
      if (p.image != null && !String(p.image).startsWith("data:image/")) continue;
      ids.add(p.id);
      valid.push({
        id: p.id,
        label: String(p.label),
        search: String(p.label).toLowerCase(),
        category: String(p.category),
        core: false,
        custom: true,
        image: p.image ?? null
      });
    }

    if (valid.length === 0) {
      alert("Nessun nuovo pittogramma da importare.");
      return;
    }
    if (!saveCustomPictograms([...existing, ...valid])) return;

    refreshPictograms();
    rerender();
    renderCustomList();
    const skipped = imported.length - valid.length;
    alert(`Importati ${valid.length} pittogrammi.` + (skipped ? ` Scartati: ${skipped}.` : ""));
  } catch {
    alert("File non valido.");
  } finally {
    importInput.value = "";
  }
};

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
      ? `<img src="${esc(p.image)}" alt="${esc(p.label)}" class="custom-item-img">`
      : "";

    item.innerHTML = `
      <div class="custom-item-info">
        ${imgHtml}
        <div class="custom-item-text">
          <span class="custom-item-label">${esc(p.label)}</span>
          <span class="custom-item-category">${esc(p.category)}</span>
        </div>
      </div>
      <button class="delete-btn">Elimina</button>
    `;

    item.querySelector(".delete-btn").onclick = () => {
      if (confirm(`Eliminare "${p.label}"?`)) {
        deleteCustomPictogram(p.id);
        renderCustomList();
        refreshPictograms();
        rerender();
      }
    };

    listEl.appendChild(item);
  });
}

manageModal.onclick = (e) => {
  if (e.target === manageModal) closeManageModal();
};

loadData().then(() => {
  rerender();
  renderSentence();
});