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

function toDateTimeISO(dateStr, timeStr){
  if(!dateStr) return null;
  const t = (timeStr && timeStr.trim()) ? timeStr.trim() : "00:00";
  return new Date(`${dateStr}T${t}:00`);
}

function getNextMatch(items){
  const now = new Date();
  const upcoming = (items || [])
    .filter(m => m.data && (!m.risultato || !String(m.risultato).trim()) && m.marcatori !== "Riposo")
    .map(m => ({...m, _dt: toDateTimeISO(m.data, m.ora)}))
    .filter(m => m._dt && m._dt >= now)
    .sort((a,b)=> a._dt - b._dt);
  return upcoming[0] || null;
}

function getLastPlayed(items){
  const played = (items || [])
    .filter(m => m.data && m.risultato && String(m.risultato).trim())
    .map(m => ({...m, _dt: toDateTimeISO(m.data, m.ora)}))
    .filter(m => m._dt)
    .sort((a,b)=> b._dt - a._dt);
  return played[0] || null;
}

function renderNews(){
  const news = appData.news || [];
  const cal = appData.calendario || [];

  const next = getNextMatch(cal);
  const last = getLastPlayed(cal);

  const interviste = news
    .map((n, idx) => ({...n, _id: n.id ?? idx}))
    .filter(n => (n.categoria || "").toLowerCase() === "intervista")
    .slice().sort((a,b)=> (b.data||"").localeCompare(a.data||""));

  const header = `
    <div class="news-header">
      <h2>Colleferro Women</h2>
      <div class="slogan">Passione Rossonera</div>
      <div class="subtitle">Stagione 2025/2026 • Settore Femminile</div>
    </div>
  `;

  const blockNext = `
    <div class="card">
      <h3>Prossima partita</h3>
      ${next ? `
        <div style="font-weight:900; margin-top:6px">${next.casa} <span class="meta">vs</span> ${next.trasferta}</div>
        <div class="meta">${fmtDate(next.data)} • ${next.ora || ""} • ${next.campo || ""}</div>
      ` : `
        <div class="meta" style="margin-top:6px">Da definire</div>
      `}
    </div>
  `;

  const blockLast = `
    <div class="card">
      <h3>Ultimo risultato</h3>
      ${last ? `
        <div style="font-weight:900; margin-top:6px">${last.casa} <span class="meta">vs</span> ${last.trasferta}</div>
        <div class="meta">${fmtDate(last.data)} • <span class="badge">Risultato: ${last.risultato}</span></div>
      ` : `
        <div class="meta" style="margin-top:6px">Nessun risultato disponibile</div>
      `}
    </div>
  `;

  const blockInterviste = `
    <div class="card">
      <h3>Interviste</h3>
      ${interviste.length ? interviste.map(n => {
        const full = (n.testo || "").trim();
        const breve = (n.testo_breve && String(n.testo_breve).trim())
          ? String(n.testo_breve).trim()
          : (full.length > 120 ? full.slice(0, 120) + "…" : full);

        return `
          <article class="news-item" onclick="openNewsModal('${String(n._id).replace(/'/g,"&#39;")}')">
            <div class="badge">${fmtDate(n.data)}</div>
            <div style="font-weight:900; margin-top:6px">${n.titolo || ""}</div>
            ${breve ? `<div class="meta" style="margin-top:6px">${breve}</div>` : ``}
          </article>
        `;
      }).join("") : `<div class="meta" style="margin-top:6px">Nessuna intervista pubblicata</div>`}
    </div>
  `;

  views.news.innerHTML = header + blockNext + blockLast + blockInterviste;
}

function renderCalendario(){

  function formatMarcatori(text){
    if(!text || text === "Riposo") return text;

    const goals = {};
    const entries = text.split(";");

    entries.forEach(e => {
      const trimmed = e.trim();
      if(!trimmed) return;
      if (trimmed.toLowerCase().includes("autogol")) return;

      const parts = trimmed.split(" ");
      const namePart = (parts[0] || "") + " " + (parts[1] || "");
      const cleanName = namePart.trim();

      const goalsCount = trimmed.includes(",") ? trimmed.split(",").length : 1;

      if(cleanName){
        goals[cleanName] = (goals[cleanName] || 0) + goalsCount;
      }
    });

    return Object.keys(goals).map(name => {
      return `${name} ${"⚽".repeat(goals[name])}`;
    }).join(" • ");
  }

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
          <span class="badge">
            ${m.risultato ? "Risultato: " + m.risultato : "Da giocare"}
          </span>
        </div>

        ${m.marcatori && m.marcatori !== "Riposo" ? `
          <div style="margin-top:8px; font-size:13px; color:#b9b9b9;">
            <strong>Marcatori:</strong> ${formatMarcatori(m.marcatori)}
          </div>
        ` : ""}

        ${m.marcatori === "Riposo" ? `
          <div style="margin-top:8px; font-size:13px; color:#b9b9b9;">
            <strong>Riposo</strong>
          </div>
        ` : ""}
      </div>
    `).join("");
}

function renderClassifica(){
  const items = appData.classifica || [];
  const cal = appData.calendario || [];

  if(!items.length){
    views.classifica.innerHTML = `<div class="card"><h3>Classifica non disponibile</h3></div>`;
    return;
  }

  function buildMarcatori(calItems){
    const goals = {};

    (calItems || []).forEach(m => {
      const text = (m.marcatori || "").trim();
      if(!text || text === "Riposo") return;
      if(!m.risultato || !String(m.risultato).trim()) return;

      const entries = text.split(";");
      entries.forEach(e => {
        const trimmed = e.trim();
        if(!trimmed) return;
        if(trimmed.toLowerCase().includes("autogol")) return;

        const parts = trimmed.split(" ").filter(Boolean);
        const name = ((parts[0] || "") + " " + (parts[1] || "")).trim();
        if(!name) return;

        const goalsCount = trimmed.includes(",") ? trimmed.split(",").length : 1;
        goals[name] = (goals[name] || 0) + goalsCount;
      });
    });

    return Object.keys(goals).map(n => ({ nome: n, gol: goals[n] }))
      .sort((a,b)=> (b.gol - a.gol) || a.nome.localeCompare(b.nome));
  }

  const rows = items
    .slice().sort((a,b)=> (a.pos ?? 999) - (b.pos ?? 999))
    .map((r, _, array) => {

      const isColleferro = (r.squadra || "").toLowerCase().includes("colleferro women");
      const isPlayoff = r.pos === 1 || r.pos === 2;
      const isRetro = r.pos === array.length;

      let rowClass = "";
      if (isPlayoff) rowClass = "row-playoff";
      if (isRetro) rowClass = "row-retrocessione";
      if (isColleferro) rowClass += " row-strong";

      return `
        <tr class="${rowClass}">
          <td>${r.pos}</td>
          <td>${r.squadra}</td>
          <td>${r.pti}</td>
          <td>${r.g}</td>
          <td>${r.v}</td>
          <td>${r.n}</td>
          <td>${r.s}</td>
          <td>${r.gf}</td>
          <td>${r.gs}</td>
        </tr>
      `;
    }).join("");

  const marcatori = buildMarcatori(cal);
  const marcatoriRows = marcatori.length ? marcatori.map((p, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${p.nome}</td>
      <td><strong>${p.gol}</strong></td>
    </tr>
  `).join("") : `
    <tr>
      <td colspan="3" class="meta">Nessun marcatore disponibile</td>
    </tr>
  `;

  views.classifica.innerHTML = `
    <div class="card">
      <div class="subtabs">
        <button class="subtab is-active" data-sub="tabella">Classifica</button>
        <button class="subtab" data-sub="marcatori">Marcatori</button>
      </div>

      <div id="panel-tabella">
        <h3 style="margin-top:8px;">Classifica</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Squadra</th>
              <th>PT</th>
              <th>G</th>
              <th>V</th>
              <th>N</th>
              <th>S</th>
              <th>GF</th>
              <th>GS</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:10px;font-size:12px;color:#b9b9b9;">
          🟦 Playoff &nbsp;&nbsp; 🟥 Retrocessione
        </div>
      </div>

      <div id="panel-marcatori" style="display:none">
        <h3 style="margin-top:8px;">Classifica marcatori</h3>
        <table class="table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Giocatrice</th>
              <th>Gol</th>
            </tr>
          </thead>
          <tbody>${marcatoriRows}</tbody>
        </table>
      </div>
    </div>
  `;

  const btns = views.classifica.querySelectorAll(".subtab");
  const panelTab = document.getElementById("panel-tabella");
  const panelMar = document.getElementById("panel-marcatori");

  btns.forEach(b => {
    b.addEventListener("click", () => {
      btns.forEach(x => x.classList.toggle("is-active", x === b));
      const target = b.dataset.sub;
      panelTab.style.display = target === "tabella" ? "block" : "none";
      panelMar.style.display = target === "marcatori" ? "block" : "none";
    });
  });
}


function renderRosa(){
  const items = appData.rosa || [];
  const ex = appData.calciatrici_cedute || [];

  if(!items.length){
    views.rosa.innerHTML = `<div class="card"><h3>Rosa non disponibile</h3></div>`;
    return;
  }

  const cards = items.map(p => `
    <div class="player-card" onclick="openPlayerModal(${Number(p.numero)})">
      <div class="player-img">
        <img src="${p.foto && p.foto.trim() ? p.foto : 'https://via.placeholder.com/300x400/111111/ffffff?text=Colleferro'}" alt="${p.nome} ${p.cognome}">
      </div>
      <div class="player-info">
        <div class="player-number">#${p.numero ?? "-"}</div>
        <div class="player-name">${p.nome} ${p.cognome}</div>
        <div class="player-role">${p.ruolo ?? ""}</div>
      </div>
    </div>
  `).join("");

  const exCards = ex.map(p => `
    <div class="player-card player-ex-card" onclick="openPlayerModalEx('${(p.nome || "").replace(/'/g,"&#39;")}','${(p.cognome || "").replace(/'/g,"&#39;")}')">
      <div class="player-img">
        <img src="${p.foto && p.foto.trim() ? p.foto : 'https://via.placeholder.com/300x400/111111/ffffff?text=Colleferro'}" alt="${p.nome} ${p.cognome}">
      </div>
      <div class="player-info">
        <div class="player-number">EX</div>
        <div class="player-name">${p.nome} ${p.cognome}</div>
        <div class="player-role">${p.ruolo ?? ""}</div>
      </div>
    </div>
  `).join("");

  views.rosa.innerHTML = `
    <div class="card">
      <h3>Rosa</h3>
      <div class="toggle-row">
        <div class="meta">Mostra ex (Calciatrici cedute)</div>
        <label class="switch">
          <input id="toggleEx" type="checkbox" ${ex.length ? "" : "disabled"}>
          <span class="slider"></span>
        </label>
      </div>
      ${!ex.length ? `<div class="meta" style="margin-top:8px">Nessuna calciatrice ceduta inserita</div>` : ``}
    </div>

    <div class="grid-rosa">
      ${cards}
    </div>

    <div id="exSection" style="display:none">
      <div class="card">
        <h3>Calciatrici cedute</h3>
      </div>
      <div class="grid-rosa">
        ${exCards}
      </div>
    </div>

    <div id="playerModal" class="player-modal" onclick="closePlayerModal(event)">
      <div class="player-modal-content" id="playerModalContent"></div>
    </div>
  `;

  const toggle = document.getElementById("toggleEx");
  if(toggle){
    toggle.addEventListener("change", () => {
      const section = document.getElementById("exSection");
      if(section) section.style.display = toggle.checked ? "block" : "none";
    });
  }
}

function openPlayerModal(numero){
  numero = Number(numero);
  const player = (appData.rosa || []).find(p => Number(p.numero) === numero);
  if(!player) return;

  const stats = (player.ruolo || "").toLowerCase() === "portiere" ? `
      <div class="stat-box"><div>Reti inviolate</div><strong>${player.reti_inviolate ?? 0}</strong></div>
      <div class="stat-box"><div>Reti subite</div><strong>${player.reti_subite ?? 0}</strong></div>
  ` : `
      <div class="stat-box"><div>Goal fatti</div><strong>${player.gol ?? 0}</strong></div>
  `;

  document.getElementById("playerModalContent").innerHTML = `
    <div class="modal-header">
      <img src="${player.foto && player.foto.trim() ? player.foto : 'https://via.placeholder.com/400x500/111111/ffffff?text=Colleferro'}">
    </div>
    <div class="modal-body">
      <h2>#${player.numero} ${player.nome} ${player.cognome}</h2>
      <div class="modal-meta">${player.ruolo || ""}</div>
      <div class="modal-meta">Data di nascita: ${player.data_nascita ?? "-"}</div>

      <div class="player-stats-grid">
        <div class="stat-box"><div>Presenze</div><strong>${player.presenze ?? 0}</strong></div>
        <div class="stat-box"><div>Minuti</div><strong>${player.minuti ?? 0}</strong></div>
        ${stats}
      </div>
    </div>
  `;

  document.getElementById("playerModal").style.display = "flex";
}

function closePlayerModal(e){
  if(e.target.id === "playerModal"){
    document.getElementById("playerModal").style.display = "none";
  }
}

function openPlayerModalEx(nome, cognome){
  const player = (appData.calciatrici_cedute || []).find(p => (p.nome || "") === nome && (p.cognome || "") === cognome);
  if(!player) return;

  const stats = (player.ruolo || "").toLowerCase() === "portiere" ? `
      <div class="stat-box"><div>Reti inviolate</div><strong>${player.reti_inviolate ?? 0}</strong></div>
      <div class="stat-box"><div>Reti subite</div><strong>${player.reti_subite ?? 0}</strong></div>
  ` : `
      <div class="stat-box"><div>Goal fatti</div><strong>${player.gol ?? 0}</strong></div>
  `;

  document.getElementById("playerModalContent").innerHTML = `
    <div class="modal-header">
      <img src="${player.foto && player.foto.trim() ? player.foto : 'https://via.placeholder.com/400x500/111111/ffffff?text=Colleferro'}">
    </div>
    <div class="modal-body">
      <h2>EX • ${player.nome} ${player.cognome}</h2>
      <div class="modal-meta">${player.ruolo || ""}</div>
      <div class="modal-meta">Data di nascita: ${player.data_nascita ?? "-"}</div>

      <div class="player-stats-grid">
        <div class="stat-box"><div>Presenze</div><strong>${player.presenze ?? 0}</strong></div>
        <div class="stat-box"><div>Minuti</div><strong>${player.minuti ?? 0}</strong></div>
        ${stats}
      </div>
    </div>
  `;

  document.getElementById("playerModal").style.display = "flex";
}
function openNewsModal(id){
  const list = (appData.news || []).map((n, idx) => ({...n, _id: n.id ?? idx}));
  const item = list.find(x => String(x._id) === String(id));
  if(!item) return;

  const title = item.titolo || "";
  const date = item.data ? fmtDate(item.data) : "";
  const text = (item.testo || "").trim();
  const link = (item.link || "").trim();

  document.getElementById("newsModalContent").innerHTML = `
    <div class="modal-body">
      <div class="badge">${date}</div>
      <h2 style="margin-top:10px;">${title}</h2>
      ${text ? `<div class="meta" style="margin-top:10px; font-size:14px; line-height:1.55; color:#e6e6e6;">${text.replace(/\n/g,"<br>")}</div>` : ``}
      ${link ? `<div style="margin-top:14px;"><a href="${link}" target="_blank" rel="noopener">Apri link</a></div>` : ``}
    </div>
  `;

  document.getElementById("newsModal").style.display = "flex";
}

function closeNewsModal(e){
  if(e.target.id === "newsModal"){
    document.getElementById("newsModal").style.display = "none";
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
  document.querySelectorAll(".tab").forEach(btn=>{
    btn.addEventListener("click", ()=> setActive(btn.dataset.view));
  });

  const res = await fetch("data.json", { cache: "no-store" });
  appData = await res.json();

  if(!document.getElementById("newsModal")){
    const modal = document.createElement("div");
    modal.id = "newsModal";
    modal.className = "player-modal";
    modal.setAttribute("onclick", "closeNewsModal(event)");
    modal.innerHTML = `<div class="player-modal-content" id="newsModalContent"></div>`;
    document.body.appendChild(modal);
  }

  renderNews();
  renderCalendario();
  renderClassifica();
  renderRosa();
  renderInfo();

  if ("serviceWorker" in navigator) {
    try { await navigator.serviceWorker.register("sw.js"); } catch(e){}
  }

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
  window.openNewsModal = openNewsModal;
window.closeNewsModal = closeNewsModal;
}

