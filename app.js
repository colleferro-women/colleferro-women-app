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
  const el = document.getElementById(`view-${viewKey}`);
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
  return new Date(`${dateStr}T${t}:00`);
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
  // "Giocata" = risultato valorizzato, non Riposo
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
// Modals (global)
// =====================
function ensureGlobalModals(){
  if(!document.getElementById("playerModal")){
    const modal = document.createElement("div");
    modal.id = "playerModal";
    modal.className = "player-modal";
    modal.setAttribute("onclick", "closePlayerModal(event)");
    modal.innerHTML = `<div class="player-modal-content" id="playerModalContent"></div>`;
    document.body.appendChild(modal);
  }

  if(!document.getElementById("newsModal")){
    const modal = document.createElement("div");
    modal.id = "newsModal";
    modal.className = "player-modal";
    modal.setAttribute("onclick", "closeNewsModal(event)");
    modal.innerHTML = `<div class="player-modal-content" id="newsModalContent"></div>`;
    document.body.appendChild(modal);
  }

  if(!document.getElementById("mvpModal")){
    const modal = document.createElement("div");
    modal.id = "mvpModal";
    modal.className = "player-modal";
    modal.setAttribute("onclick", "closeMvpModal(event)");
    modal.innerHTML = `<div class="player-modal-content" id="mvpModalContent"></div>`;
    document.body.appendChild(modal);
  }
}

// =====================
// Player modals
// =====================
function openPlayerModal(numero){
  numero = Number(numero);
  const player = (appData?.rosa || []).find(p => Number(p.numero) === numero);
  if(!player) return;

  const ruolo = (player.ruolo || "").toLowerCase();
  const isPortiere = ruolo === "portiere";

  const extraStats = isPortiere
    ? `
      <div class="stat-box"><div>Reti inviolate</div><strong>${player.reti_inviolate ?? 0}</strong></div>
      <div class="stat-box"><div>Reti subite</div><strong>${player.reti_subite ?? 0}</strong></div>
    `
    : `
      <div class="stat-box"><div>Goal fatti</div><strong>${player.gol ?? 0}</strong></div>
      <div class="stat-box"><div>&nbsp;</div><strong>&nbsp;</strong></div>
    `;

  const foto = (player.foto && String(player.foto).trim())
    ? String(player.foto).trim()
    : "https://via.placeholder.com/400x500/111111/ffffff?text=Colleferro";

  const content = document.getElementById("playerModalContent");
  if(!content) return;

  content.innerHTML = `
    <div class="modal-header">
      <img src="${escapeHtml(foto)}" alt="${escapeHtml(player.nome)} ${escapeHtml(player.cognome)}">
    </div>
    <div class="modal-body">
      <h2>#${escapeHtml(player.numero)} ${escapeHtml(player.nome)} ${escapeHtml(player.cognome)}</h2>
      <div class="modal-meta">${escapeHtml(player.ruolo || "")}</div>
      <div class="modal-meta">Data di nascita: ${escapeHtml(player.data_nascita ?? "-")}</div>

      <div class="stats-grid">
        <div class="stat-box"><div>Presenze</div><strong>${player.presenze ?? 0}</strong></div>
        <div class="stat-box"><div>Minuti</div><strong>${player.minuti ?? 0}</strong></div>
        ${extraStats}
      </div>
    </div>
  `;

  const modal = document.getElementById("playerModal");
  if(modal) modal.style.display = "flex";
}

function openPlayerModalEx(nome, cognome){
  const player = (appData?.calciatrici_cedute || []).find(p => (p.nome || "") === nome && (p.cognome || "") === cognome);
  if(!player) return;

  const ruolo = (player.ruolo || "").toLowerCase();
  const isPortiere = ruolo === "portiere";

  const extraStats = isPortiere
    ? `
      <div class="stat-box"><div>Reti inviolate</div><strong>${player.reti_inviolate ?? 0}</strong></div>
      <div class="stat-box"><div>Reti subite</div><strong>${player.reti_subite ?? 0}</strong></div>
    `
    : `
      <div class="stat-box"><div>Goal fatti</div><strong>${player.gol ?? 0}</strong></div>
      <div class="stat-box"><div>&nbsp;</div><strong>&nbsp;</strong></div>
    `;

  const foto = (player.foto && String(player.foto).trim())
    ? String(player.foto).trim()
    : "https://via.placeholder.com/400x500/111111/ffffff?text=Colleferro";

  const content = document.getElementById("playerModalContent");
  if(!content) return;

  content.innerHTML = `
    <div class="modal-header">
      <img src="${escapeHtml(foto)}" alt="${escapeHtml(player.nome)} ${escapeHtml(player.cognome)}">
    </div>
    <div class="modal-body">
      <h2>EX • ${escapeHtml(player.nome)} ${escapeHtml(player.cognome)}</h2>
      <div class="modal-meta">${escapeHtml(player.ruolo || "")}</div>
      <div class="modal-meta">Data di nascita: ${escapeHtml(player.data_nascita ?? "-")}</div>

      <div class="stats-grid">
        <div class="stat-box"><div>Presenze</div><strong>${player.presenze ?? 0}</strong></div>
        <div class="stat-box"><div>Minuti</div><strong>${player.minuti ?? 0}</strong></div>
        ${extraStats}
      </div>
    </div>
  `;

  const modal = document.getElementById("playerModal");
  if(modal) modal.style.display = "flex";
}

function closePlayerModal(e){
  if(e && e.target && e.target.id === "playerModal"){
    const modal = document.getElementById("playerModal");
    if(modal) modal.style.display = "none";
  }
}

// =====================
// News modals
// =====================
function openNewsModal(id){
  const list = (appData?.news || []).map((n, idx) => ({...n, _id: n.id ?? idx}));
  const item = list.find(x => String(x._id) === String(id));
  if(!item) return;

  const title = item.titolo || "";
  const date = item.data ? fmtDate(item.data) : "";
  const text = String(item.testo || "").trim();
  const link = String(item.link || "").trim();

  const content = document.getElementById("newsModalContent");
  if(!content) return;

  content.innerHTML = `
    <div class="modal-body">
      ${date ? `<div class="badge">${escapeHtml(date)}</div>` : ``}
      <h2 style="margin-top:10px;">${escapeHtml(title)}</h2>
      ${text ? `<div class="meta" style="margin-top:10px; font-size:14px; line-height:1.55; color:#e6e6e6;">${escapeHtml(text).replace(/\n/g,"<br>")}</div>` : ``}
      ${link ? `<div style="margin-top:14px;"><a href="${escapeHtml(link)}" target="_blank" rel="noopener">Apri link</a></div>` : ``}
    </div>
  `;

  const modal = document.getElementById("newsModal");
  if(modal) modal.style.display = "flex";
}

function closeNewsModal(e){
  if(e && e.target && e.target.id === "newsModal"){
    const modal = document.getElementById("newsModal");
    if(modal) modal.style.display = "none";
  }
}

// =====================
// MVP modal
// =====================
function openMvpModal(idx){
  const cal = appData?.calendario || [];
  const m = cal[idx];
  if(!m || !isPlayedMatch(m) || isRiposoMatch(m)) return;

  const nomeMvp = (m.mvp && String(m.mvp).trim()) ? String(m.mvp).trim() : "";
  const fotoMvp = (m.mvp_foto && String(m.mvp_foto).trim())
    ? String(m.mvp_foto).trim()
    : "https://via.placeholder.com/400x500/111111/ffffff?text=MVP";

  const votaUrl = (m.mvp_vota_url && String(m.mvp_vota_url).trim()) ? String(m.mvp_vota_url).trim() : "";

  const content = document.getElementById("mvpModalContent");
  if(!content) return;

  content.innerHTML = `
    <div class="modal-header">
      <img src="${escapeHtml(fotoMvp)}" alt="MVP">
    </div>
    <div class="modal-body">
      <div class="badge">🏅 MVP</div>
      <h2 style="margin-top:10px;">${nomeMvp ? escapeHtml(nomeMvp) : "Da assegnare"}</h2>
      <div class="modal-meta">
        ${escapeHtml(fmtDate(m.data))} • ${escapeHtml(m.casa || "")} vs ${escapeHtml(m.trasferta || "")}
      </div>
      <div class="modal-meta" style="margin-top:10px;">
        ${nomeMvp ? "MVP inserito manualmente dallo staff." : "MVP non ancora inserito. Puoi aggiungerlo nel data.json quando vuoi."}
      </div>

      ${votaUrl ? `<a class="mvp-btn" href="${escapeHtml(votaUrl)}" target="_blank" rel="noopener">Vota MVP</a>` : ``}
    </div>
  `;

  const modal = document.getElementById("mvpModal");
  if(modal) modal.style.display = "flex";
}

function closeMvpModal(e){
  if(e && e.target && e.target.id === "mvpModal"){
    const modal = document.getElementById("mvpModal");
    if(modal) modal.style.display = "none";
  }
}

// =====================
// Countdown (News)
// =====================
function formatCountdown(ms){
  if(ms <= 0) return "Si gioca oggi!";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);

  const dd = String(days);
  const hh = String(hours).padStart(2, "0");
  const mm = String(mins).padStart(2, "0");

  return `${dd}g ${hh}h ${mm}m`;
}

function startCountdown(targetDate){
  const el = document.getElementById("countdownNext");
  if(!el || !targetDate) return;

  const tick = () => {
    const now = new Date();
    const ms = targetDate.getTime() - now.getTime();
    el.textContent = formatCountdown(ms);
  };

  tick();
  window.__cwCountdownTimer && clearInterval(window.__cwCountdownTimer);
  window.__cwCountdownTimer = setInterval(tick, 60000);
}

// =====================
// Render: News
// =====================
function renderNews(){
  const news = appData.news || [];
  const cal = appData.calendario || [];

  const next = getNextMatch(cal);
  const last = getLastPlayed(cal);

  const interviste = news
    .map((n, idx) => ({...n, _id: n.id ?? idx}))
    .filter(n => (n.categoria || "").toLowerCase() === "intervista")
    .slice()
    .sort((a,b)=> (b.data||"").localeCompare(a.data||""));

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
        <div style="font-weight:900; margin-top:6px">${escapeHtml(next.casa)} <span class="meta">vs</span> ${escapeHtml(next.trasferta)}</div>
        <div class="meta">${escapeHtml(fmtDate(next.data))} • ${escapeHtml(next.ora || "")} • ${escapeHtml(next.campo || "")}</div>
        <div style="margin-top:10px">
          <span class="badge">⏳ Mancano: <span id="countdownNext">--</span></span>
        </div>
      ` : `
        <div class="meta" style="margin-top:6px">Da definire</div>
      `}
    </div>
  `;

  const blockLast = `
    <div class="card">
      <h3>Ultimo risultato</h3>
      ${last ? `
        <div style="font-weight:900; margin-top:6px">${escapeHtml(last.casa)} <span class="meta">vs</span> ${escapeHtml(last.trasferta)}</div>
        <div class="meta">${escapeHtml(fmtDate(last.data))} • <span class="badge">Risultato: ${escapeHtml(last.risultato)}</span></div>
      ` : `
        <div class="meta" style="margin-top:6px">Nessun risultato disponibile</div>
      `}
    </div>
  `;

  const blockInterviste = `
    <div class="card">
      <h3>Interviste</h3>
      ${interviste.length ? interviste.map(n => {
        const full = String(n.testo || "").trim();
        const breve = (n.testo_breve && String(n.testo_breve).trim())
          ? String(n.testo_breve).trim()
          : (full.length > 120 ? full.slice(0, 120) + "…" : full);

        return `
          <article class="news-item" onclick="openNewsModal('${escapeHtml(String(n._id))}')">
            <div class="badge">${escapeHtml(fmtDate(n.data))}</div>
            <div style="font-weight:900; margin-top:6px">${escapeHtml(n.titolo || "")}</div>
            ${breve ? `<div class="meta" style="margin-top:6px">${escapeHtml(breve)}</div>` : ``}
          </article>
        `;
      }).join("") : `<div class="meta" style="margin-top:6px">Nessuna intervista pubblicata</div>`}
    </div>
  `;

  views.news.innerHTML = header + blockNext + blockLast + blockInterviste;

  if(next){
    const dt = toDateTimeISO(next.data, next.ora);
    startCountdown(dt);
  }
}

// =====================
// Render: Calendario (con MVP cliccabile solo se risultato)
// =====================
function renderCalendario(){

  function formatMarcatori(text){
    if(!text || text === "Riposo") return text;

    const goals = {};
    const entries = String(text).split(";");

    entries.forEach(e => {
      const trimmed = String(e).trim();
      if(!trimmed) return;
      if(trimmed.toLowerCase().includes("autogol")) return;

      const parts = trimmed.split(" ").filter(Boolean);
      const name = ((parts[0] || "") + " " + (parts[1] || "")).trim();
      if(!name) return;

      const goalsCount = trimmed.includes(",") ? trimmed.split(",").length : 1;
      goals[name] = (goals[name] || 0) + goalsCount;
    });

    return Object.keys(goals).map(name => `${name} ${"⚽".repeat(goals[name])}`).join(" • ");
  }

  const items = appData.calendario || [];

  if(!items.length){
    views.calendario.innerHTML = `<div class="card"><h3>Nessuna partita</h3><div class="meta">Aggiungi partite in data.json</div></div>`;
    return;
  }

  views.calendario.innerHTML = items
    .slice()
    .sort((a,b)=> (a.data||"").localeCompare(b.data||""))
    .map((m, idx) => {
      const riposo = isRiposoMatch(m);
      const played = isPlayedMatch(m) && !riposo;

      const risultatoLabel = riposo
        ? "Riposo"
        : (m.risultato && String(m.risultato).trim() ? ("Risultato: " + escapeHtml(m.risultato)) : "Da giocare");

      const showMarcatori = (!riposo && m.marcatori && String(m.marcatori).trim());

      // MVP: solo se partita giocata
      let mvpHtml = "";
      if(played){
        const nomeMvp = (m.mvp && String(m.mvp).trim()) ? String(m.mvp).trim() : "";
        mvpHtml = `
          <div class="mvp-row" onclick="openMvpModal(${idx})">
            <div class="mvp-left">
              <span class="badge">🏅 MVP</span>
              <div style="min-width:0;">
                <div class="mvp-name">${nomeMvp ? escapeHtml(nomeMvp) : "Da assegnare"}</div>
                <div class="mvp-hint">${nomeMvp ? "Tocca per vedere" : "Tocca per impostare / votare"}</div>
              </div>
            </div>
            <div class="mvp-chip">Apri</div>
          </div>
        `;
      }

      return `
        <div class="card">
          <div class="meta">Giornata ${escapeHtml(m.giornata ?? "-")}</div>
          <h3>${escapeHtml(m.casa || "")} <span class="meta">vs</span> ${escapeHtml(m.trasferta || "")}</h3>
          <div class="meta">${escapeHtml(fmtDate(m.data))} • ${escapeHtml(m.ora || "")} • ${escapeHtml(m.campo || "")}</div>

          <div style="margin-top:10px">
            <span class="badge">${risultatoLabel}</span>
          </div>

          ${showMarcatori ? `
            <div style="margin-top:8px; font-size:13px; color:#b9b9b9;">
              <strong>Marcatori:</strong> ${escapeHtml(formatMarcatori(m.marcatori))}
            </div>
          ` : ""}

          ${mvpHtml}
        </div>
      `;
    }).join("");
}

// =====================
// Render: Classifica + Marcatori automatici
// =====================
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
      const text = String(m.marcatori || "").trim();
      if(!text || text === "Riposo") return;
      if(!m.risultato || !String(m.risultato).trim() || m.risultato === "Riposo") return;

      const entries = text.split(";");
      entries.forEach(e => {
        const trimmed = String(e).trim();
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
    .slice()
    .sort((a,b)=> (a.pos ?? 999) - (b.pos ?? 999))
    .map((r, _, array) => {
      const squadra = String(r.squadra || "");
      const isColleferro = squadra.toLowerCase().includes("colleferro women");
      const isPlayoff = r.pos === 1 || r.pos === 2;
      const isRetro = r.pos === array.length;

      let rowClass = "";
      if (isPlayoff) rowClass = "row-playoff";
      if (isRetro) rowClass = "row-retrocessione";
      if (isColleferro) rowClass += " row-strong";

      return `
        <tr class="${rowClass.trim()}">
          <td>${escapeHtml(r.pos)}</td>
          <td>${escapeHtml(squadra)}</td>
          <td>${escapeHtml(r.pti)}</td>
          <td>${escapeHtml(r.g)}</td>
          <td>${escapeHtml(r.v)}</td>
          <td>${escapeHtml(r.n)}</td>
          <td>${escapeHtml(r.s)}</td>
          <td>${escapeHtml(r.gf)}</td>
          <td>${escapeHtml(r.gs)}</td>
        </tr>
      `;
    }).join("");

  const marcatori = buildMarcatori(cal);
  const marcatoriRows = marcatori.length ? marcatori.map((p, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${escapeHtml(p.nome)}</td>
      <td><strong>${escapeHtml(p.gol)}</strong></td>
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
      if(panelTab) panelTab.style.display = target === "tabella" ? "block" : "none";
      if(panelMar) panelMar.style.display = target === "marcatori" ? "block" : "none";
    });
  });
}

// =====================
// Render: Rosa (ordinata per ruolo + toggle ex)
// =====================
function renderRosa(){
  const items = appData.rosa || [];
  const ex = appData.calciatrici_cedute || [];

  if(!items.length){
    views.rosa.innerHTML = `<div class="card"><h3>Rosa non disponibile</h3></div>`;
    return;
  }

  const roleOrder = {
    "portiere": 1,
    "difensore": 2,
    "centrocampista": 3,
    "attaccante": 4
  };

  const sorted = items.slice().sort((a,b) => {
    const ra = roleOrder[String(a.ruolo || "").toLowerCase()] ?? 99;
    const rb = roleOrder[String(b.ruolo || "").toLowerCase()] ?? 99;
    if(ra !== rb) return ra - rb;
    return (Number(a.numero) || 999) - (Number(b.numero) || 999);
  });

  const cards = sorted.map(p => `
    <div class="player-card" onclick="openPlayerModal(${Number(p.numero)})">
      <div class="player-img">
        <img src="${escapeHtml((p.foto && String(p.foto).trim()) ? String(p.foto).trim() : 'https://via.placeholder.com/300x400/111111/ffffff?text=Colleferro')}" alt="${escapeHtml(p.nome)} ${escapeHtml(p.cognome)}">
      </div>
      <div class="player-info">
        <div class="player-number">#${escapeHtml(p.numero ?? "-")}</div>
        <div class="player-name">${escapeHtml(p.nome || "")} ${escapeHtml(p.cognome || "")}</div>
        <div class="player-role">${escapeHtml(p.ruolo || "")}</div>
      </div>
    </div>
  `).join("");

  const exCards = (ex || []).map(p => `
    <div class="player-card player-ex-card" onclick="openPlayerModalEx('${escapeHtml(p.nome || "")}','${escapeHtml(p.cognome || "")}')">
      <div class="player-img">
        <img src="${escapeHtml((p.foto && String(p.foto).trim()) ? String(p.foto).trim() : 'https://via.placeholder.com/300x400/111111/ffffff?text=Colleferro')}" alt="${escapeHtml(p.nome)} ${escapeHtml(p.cognome)}">
      </div>
      <div class="player-info">
        <div class="player-number">EX</div>
        <div class="player-name">${escapeHtml(p.nome || "")} ${escapeHtml(p.cognome || "")}</div>
        <div class="player-role">${escapeHtml(p.ruolo || "")}</div>
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
  `;

  const toggle = document.getElementById("toggleEx");
  if(toggle){
    toggle.addEventListener("change", () => {
      const section = document.getElementById("exSection");
      if(section) section.style.display = toggle.checked ? "block" : "none";
    });
  }
}

// =====================
// Render: Info
// =====================
function renderInfo(){
  const s = appData.social || {};
  const i = appData.info || {};
  views.info.innerHTML = `
    <div class="card">
      <h3>Info</h3>
      <p class="meta">Contatti e link ufficiali</p>
      <p><strong>Email:</strong> ${escapeHtml(i.contatto_email || "-")}</p>
      <p><strong>Telefono:</strong> ${escapeHtml(i.telefono || "-")}</p>
      <p><strong>Campo:</strong> ${escapeHtml(i.campo_nome || "-")}<br>${escapeHtml(i.campo_indirizzo || "-")}</p>
      <hr style="border:0;border-top:1px solid var(--line);margin:14px 0">
      <p><strong>Instagram:</strong> <a href="${escapeHtml(s.instagram || "#")}" target="_blank" rel="noopener">Apri</a></p>
      <p><strong>Facebook:</strong> <a href="${escapeHtml(s.facebook || "#")}" target="_blank" rel="noopener">Apri</a></p>
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

  const res = await fetch("data.json", { cache: "no-store" });
  appData = await res.json();

  ensureGlobalModals();

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

window.openPlayerModal = openPlayerModal;
window.openPlayerModalEx = openPlayerModalEx;
window.closePlayerModal = closePlayerModal;

window.openNewsModal = openNewsModal;
window.closeNewsModal = closeNewsModal;

window.openMvpModal = openMvpModal;
window.closeMvpModal = closeMvpModal;

init();
