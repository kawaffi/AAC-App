let CATEGORIES = [];
let PICTOGRAMS = [];
let currentCategory = "";
let sentence = [];

const CATEGORY_ICONS = {
  "Sentimenti": "😊",
  "Bisogni": "🚨",
  "Azioni": "🏃",
  "Persone": "👥"
};

async function loadData() {
  const res = await fetch("./pictograms.json");
  PICTOGRAMS = await res.json();
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
    : `<span class="icon">🔲</span>`;
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
      : `<span class="token-icon">🔲</span>`;
    span.innerHTML = `${imgHtml}<span class="token-text">${word.label}</span>`;
    wordsEl.appendChild(span);
  });
}

document.getElementById("clear-btn").onclick = () => { sentence = []; renderSentence(); };
document.getElementById("speak-btn").onclick = () => speak(sentence.map(w => w.label).join(" "));

loadData().then(() => {
  renderTabs();
  renderCoreRow();
  renderGrid();
  renderSentence();
});