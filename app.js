const views = {
  news: document.getElementById("view-news"),
  calendario: document.getElementById("view-calendario"),
  classifica: document.getElementById("view-classifica"),
  rosa: document.getElementById("view-rosa"),
  info: document.getElementById("view-info"),
};

let appData = null;

function setActive(viewKey){
  document.querySelectorAll(".tab").forEach(b => b.classList.toggle("is-active", b.dataset.view === viewKey));
  document.querySelectorAll(".view").forEach(v => v.classList.remove("is-active"));
  document.getElementById(`view-${viewKey}`).classList.add("is-active");
}

function fmtDate(iso){
  if(!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("it-IT", { weekday:"short", day:"2-digit", month:"2-digit", year:"numeric" });
}

function renderNews(){
  const items = appData.news || [];
  if(!items.length){
    views.news.innerHTML = `<div class="card"><h3>Nessuna news</h3><div class="meta">Aggiungi news in data.json</div></div>`;
    return;
  }
  views.news.innerHTML = items
    .slice().sort((a,b)=> (b.data||"").localeCompare(a.data||""))
    .map(n => `
      <article class="card">
        <div class="badge">${fmtDate(n.data)}</div>
        <h3>${n.titolo || ""}</h3>
        <div class="meta">${n.sottotitolo || ""}</div>
        <p>${n.testo || ""}</p>
      </article>
    `).join("");
}

function renderCalendario(){
  const items = appData.calendario || [];
  if(!items.length){
    views.calendario.innerHTML = `<div class="card"><h3>Nessuna partita</h3><div class="meta">Aggiungi partite in data.json</div></div>`;
    return;
  }
  views.calendario.innerHTML = items
    .slice().sort((a,b)=> (a.data||"").localeCompare(b.data||""))
    .map(m => `
      <div class="card">
        <div class="meta">Giornata ${m.giornata ?? "-"}</div>
        <h3>${m.casa} <span class="meta">vs</span> ${m.trasferta}</h3>
        <div class="meta">${fmtDate(m.data)} • ${m.ora || ""} • ${m.campo || ""}</div>
        <div style="margin-top:10px">
          <span class="badge">${m.risultato ? "Risultato: " + m.risultato : "Da giocare"}</span>
        </div>
      </div>
    `).join("");
}

function renderClassifica(){
  const items = appData.classifica || [];
  if(!items.length){
    views.classifica.innerHTML = `<div class="card"><h3>Classifica non disponibile</h3><div class="meta">Compilala in data.json</div></div>`;
    return;
  }
  const rows = items
    .slice().sort((a,b)=> (a.pos ?? 999) - (b.pos ?? 999))
    .map(r => {
      const strong = (r.squadra || "").toLowerCase().includes("colleferro women");
      return `
        <tr class="${strong ? "row-strong" : ""}">
          <td>${r.pos ?? ""}</td>
          <td>${r.squadra ?? ""}</td>
          <td>${r.g ?? ""}</td>
          <td>${r.pti ?? ""}</td>
        </tr>
      `;
    }).join("");

  views.classifica.innerHTML = `
    <div class="card">
      <h3>Classifica</h3>
      <table class="table">
        <thead>
          <tr><th>Pos</th><th>Squadra</th><th>G</th><th>Pti</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderRosa(){
  const items = appData.rosa || [];
  if(!items.length){
    views.rosa.innerHTML = `<div class="card"><h3>Rosa non disponibile</h3><div class="meta">Aggiungi giocatrici in data.json</div></div>`;
    return;
  }
  views.rosa.innerHTML = `
    <div class="card">
      <h3>Rosa</h3>
      <div class="grid">
        ${items.map(p=>`
          <div class="player">
            <div class="meta">#${p.numero ?? "-"}</div>
            <div class="name">${p.nome ?? ""}</div>
            <div class="role">${p.ruolo ?? ""}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderInfo(){
  const s = appData.social || {};
  const i = appData.info || {};
  views.info.innerHTML = `
    <div class="card">
      <h3>Info</h3>
      <p class="meta">Contatti e link ufficiali</p>
      <p><strong>Email:</strong> ${i.contatto_email || "-"}</p>
      <p><strong>Telefono:</strong> ${i.telefono || "-"}</p>
      <p><strong>Campo:</strong> ${i.campo_nome || "-"}<br>${i.campo_indirizzo || "-"}</p>
      <hr style="border:0;border-top:1px solid var(--line);margin:14px 0">
      <p><strong>Instagram:</strong> <a href="${s.instagram || "#"}" target="_blank" rel="noopener">Apri</a></p>
      <p><strong>Facebook:</strong> <a href="${s.facebook || "#"}" target="_blank" rel="noopener">Apri</a></p>
    </div>
  `;
}

async function init(){
  // tabs
  document.querySelectorAll(".tab").forEach(btn=>{
    btn.addEventListener("click", ()=> setActive(btn.dataset.view));
  });

  // load data
  const res = await fetch("data.json", { cache: "no-store" });
  appData = await res.json();

  renderNews();
  renderCalendario();
  renderClassifica();
  renderRosa();
  renderInfo();

  // service worker
  if ("serviceWorker" in navigator) {
    try { await navigator.serviceWorker.register("sw.js"); } catch(e){}
  }

  // install button
  let deferredPrompt = null;
  const installBtn = document.getElementById("installBtn");

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

init();
