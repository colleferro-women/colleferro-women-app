const views = {
  news: document.getElementById("view-news"),
  calendario: document.getElementById("view-calendario"),
  classifica: document.getElementById("view-classifica"),
  rosa: document.getElementById("view-rosa"),
  info: document.getElementById("view-info"),
};

let appData = null;

// =====================
// Utils
// =====================
function setActive(viewKey){
  document.querySelectorAll(".tab").forEach(b =>
    b.classList.toggle("is-active", b.dataset.view === viewKey)
  );
  document.querySelectorAll(".view").forEach(v => v.classList.remove("is-active"));
  const el = document.getElementById(view-${viewKey});
  if(el) el.classList.add("is-active");
}

function fmtDate(iso){
  if(!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("it-IT", { weekday:"short", day:"2-digit", month:"2-digit", year:"numeric" });
}

function toDateTimeISO(dateStr, timeStr){
  if(!dateStr) return null;
  const t = (timeStr && String(timeStr).trim()) ? String(timeStr).trim() : "00:00";
  return new Date(${dateStr}T${t}:00);
}

function escapeHtml(s){
  return String(s ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#39;");
}

function isRiposoMatch(m){
  return (m?.risultato === "Riposo") || (m?.marcatori === "Riposo");
}

function isPlayedMatch(m){
  return !!(m?.risultato && String(m.risultato).trim() && String(m.risultato).trim() !== "Riposo");
}

function getNextMatch(items){
  const now = new Date();
  const upcoming = (items || [])
    .filter(m => m.data && !isRiposoMatch(m) && (!m.risultato || !String(m.risultato).trim()))
    .map(m => ({...m, _dt: toDateTimeISO(m.data, m.ora)}))
    .filter(m => m._dt && m._dt >= now)
    .sort((a,b)=> a._dt - b._dt);
  return upcoming[0] || null;
}

function getLastPlayed(items){
  const played = (items || [])
    .filter(m => m.data && isPlayedMatch(m))
    .map(m => ({...m, _dt: toDateTimeISO(m.data, m.ora)}))
    .filter(m => m._dt)
    .sort((a,b)=> b._dt - a._dt);
  return played[0] || null;
}

// =====================
// Modals
// =====================
function ensureGlobalModals(){

  const modals = [
    {id:"playerModal", close:"closePlayerModal"},
    {id:"newsModal", close:"closeNewsModal"},
    {id:"mvpModal", close:"closeMvpModal"},
    {id:"intervisteModal", close:"closeIntervisteModal"}
  ];

  modals.forEach(m=>{
    if(!document.getElementById(m.id)){
      const modal = document.createElement("div");
      modal.id = m.id;
      modal.className = "player-modal";
      modal.setAttribute("onclick", ${m.close}(event));
      modal.innerHTML = <div class="player-modal-content" id="${m.id}Content"></div>;
      document.body.appendChild(modal);
    }
  });
}

// =====================
// News Modal (con foto)
// =====================
function openNewsModal(id){
  const list = (appData?.news || []).map((n, idx) => ({...n, _id: n.id ?? idx}));
  const item = list.find(x => String(x._id) === String(id));
  if(!item) return;

  const content = document.getElementById("newsModalContent");
  if(!content) return;

  const img = item.immagine && String(item.immagine).trim()
    ? <div class="modal-header"><img src="${escapeHtml(item.immagine)}"></div>
    : "";

  content.innerHTML = `
    ${img}
    <div class="modal-body">
      <div class="badge">${escapeHtml(fmtDate(item.data))}</div>
      <h2 style="margin-top:10px;">${escapeHtml(item.titolo)}</h2>
      <div class="modal-meta" style="margin-top:10px; line-height:1.6;">
        ${escapeHtml(item.testo || "").replace(/\n/g,"<br>")}
      </div>
      ${item.link ? <a class="mvp-btn" href="${escapeHtml(item.link)}" target="_blank">Vai su Instagram</a> : ""}
    </div>
  `;

  document.getElementById("newsModal").style.display="flex";
}

function closeNewsModal(e){
  if(e && e.target.id==="newsModal"){
    document.getElementById("newsModal").style.display="none";
  }
}

// =====================
// Archivio Interviste
// =====================
function openIntervisteModal(){
  const interviste = (appData?.news || [])
    .filter(n => (n.categoria || "").toLowerCase() === "intervista")
    .sort((a,b)=> (b.data||"").localeCompare(a.data||""));

  const content = document.getElementById("intervisteModalContent");

  content.innerHTML = `
    <div class="modal-body">
      <h2>Archivio Interviste</h2>
      ${interviste.map((n, idx)=>`
        <div class="news-item" onclick="openNewsModal('${idx}')">
          <div class="badge">${escapeHtml(fmtDate(n.data))}</div>
          <div style="font-weight:900;margin-top:6px">${escapeHtml(n.titolo)}</div>
        </div>
      `).join("")}
    </div>
  `;

  document.getElementById("intervisteModal").style.display="flex";
}

function closeIntervisteModal(e){
  if(e && e.target.id==="intervisteModal"){
    document.getElementById("intervisteModal").style.display="none";
  }
}

// =====================
// Render News (con Vedi tutte)
// =====================
function renderNews(){

  const news = appData.news || [];
  const cal = appData.calendario || [];
  const next = getNextMatch(cal);
  const last = getLastPlayed(cal);

  const interviste = news
    .filter(n => (n.categoria || "").toLowerCase() === "intervista")
    .sort((a,b)=> (b.data||"").localeCompare(a.data||""))
    .slice(0,3);

  views.news.innerHTML = `
    <div class="news-header">
      <h2>Colleferro Women</h2>
      <div class="slogan">Passione Rossonera</div>
      <div class="subtitle">Stagione 2025/2026</div>
    </div>

    <div class="card">
      <h3>Interviste</h3>
      ${interviste.map((n,idx)=>`
        <div class="news-item" onclick="openNewsModal('${idx}')">
          <div class="badge">${escapeHtml(fmtDate(n.data))}</div>
          <div style="font-weight:900;margin-top:6px">${escapeHtml(n.titolo)}</div>
        </div>
      `).join("")}
      <div style="margin-top:10px;text-align:center;">
        <button class="subtab" onclick="openIntervisteModal()">Vedi tutte</button>
      </div>
    </div>
  `;
}

// =====================
// Init
// =====================
async function init(){

  document.querySelectorAll(".tab").forEach(btn=>{
    btn.addEventListener("click", ()=> setActive(btn.dataset.view));
  });

  const res = await fetch("data.json", { cache:"no-store" });
  appData = await res.json();

  ensureGlobalModals();

  renderNews();

  if ("serviceWorker" in navigator) {
    try { await navigator.serviceWorker.register("sw.js"); } catch(e){}
  }

  let deferredPrompt = null;
  const installBtn = document.getElementById("installBtn");

  if(installBtn){
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      installBtn.hidden = false;
    });

    installBtn.addEventListener("click", async () => {
      if(!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBtn.hidden = true;
    });
  }
}

window.openNewsModal = openNewsModal;
window.closeNewsModal = closeNewsModal;
window.openIntervisteModal = openIntervisteModal;
window.closeIntervisteModal = closeIntervisteModal;

init();
