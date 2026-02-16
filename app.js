const views = {
  news: document.getElementById("view-news"),
  calendario: document.getElementById("view-calendario"),
  classifica: document.getElementById("view-classifica"),
  rosa: document.getElementById("view-rosa"),
  info: document.getElementById("view-info"),
};

let appData = null;

function setActive(viewKey){
  document.querySelectorAll(".tab").forEach(b =>
    b.classList.toggle("is-active", b.dataset.view === viewKey)
  );
  document.querySelectorAll(".view").forEach(v =>
    v.classList.remove("is-active")
  );
  document.getElementById(`view-${viewKey}`).classList.add("is-active");
}

function fmtDate(iso){
  if(!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("it-IT", {
    weekday:"short",
    day:"2-digit",
    month:"2-digit",
    year:"numeric"
  });
}

function toDateTimeISO(dateStr, timeStr){
  if(!dateStr) return null;
  const t = (timeStr && timeStr.trim()) ? timeStr.trim() : "00:00";
  return new Date(`${dateStr}T${t}:00`);
}

function getNextMatch(items){
  const now = new Date();
  return (items || [])
    .filter(m => m.data && (!m.risultato || !String(m.risultato).trim()))
    .map(m => ({...m, _dt: toDateTimeISO(m.data, m.ora)}))
    .filter(m => m._dt && m._dt >= now)
    .sort((a,b)=> a._dt - b._dt)[0] || null;
}

function getLastPlayed(items){
  return (items || [])
    .filter(m => m.data && m.risultato && String(m.risultato).trim())
    .map(m => ({...m, _dt: toDateTimeISO(m.data, m.ora)}))
    .filter(m => m._dt)
    .sort((a,b)=> b._dt - a._dt)[0] || null;
}

function renderNews(){
  const news = appData.news || [];
  const cal = appData.calendario || [];

  const next = getNextMatch(cal);
  const last = getLastPlayed(cal);

  const interviste = news
    .map((n, idx) => ({...n, _id: n.id ?? idx}))
    .filter(n => (n.categoria || "").toLowerCase() === "intervista")
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
        <div style="font-weight:900; margin-top:6px">
          ${next.casa} <span class="meta">vs</span> ${next.trasferta}
        </div>
        <div class="meta">
          ${fmtDate(next.data)} • ${next.ora || ""} • ${next.campo || ""}
        </div>
      ` : `<div class="meta" style="margin-top:6px">Da definire</div>`}
    </div>
  `;

  const blockLast = `
    <div class="card">
      <h3>Ultimo risultato</h3>
      ${last ? `
        <div style="font-weight:900; margin-top:6px">
          ${last.casa} <span class="meta">vs</span> ${last.trasferta}
        </div>
        <div class="meta">
          ${fmtDate(last.data)} •
          <span class="badge">Risultato: ${last.risultato}</span>
        </div>
      ` : `<div class="meta" style="margin-top:6px">Nessun risultato disponibile</div>`}
    </div>
  `;

  const blockInterviste = `
    <div class="card">
      <h3>Interviste</h3>
      ${interviste.length ? interviste.map(n => `
        <article class="news-item"
          onclick="openNewsModal('${String(n._id).replace(/'/g,"&#39;")}')">
          <div class="badge">${fmtDate(n.data)}</div>
          <div style="font-weight:900; margin-top:6px">${n.titolo || ""}</div>
        </article>
      `).join("") :
      `<div class="meta" style="margin-top:6px">Nessuna intervista pubblicata</div>`}
    </div>
  `;

  views.news.innerHTML = header + blockNext + blockLast + blockInterviste;
}

function renderCalendario(){

  function formatMarcatori(text){
    if(!text) return "";
    const goals = {};
    text.split(";").forEach(e=>{
      const trimmed = e.trim();
      if(!trimmed || trimmed.toLowerCase().includes("autogol")) return;
      const parts = trimmed.split(" ").filter(Boolean);
      const name = ((parts[0]||"") + " " + (parts[1]||"")).trim();
      const count = trimmed.includes(",") ? trimmed.split(",").length : 1;
      if(name) goals[name] = (goals[name]||0)+count;
    });
    return Object.keys(goals)
      .map(n => `${n} ${"⚽".repeat(goals[n])}`)
      .join(" • ");
  }

  const items = appData.calendario || [];

  views.calendario.innerHTML = items
    .sort((a,b)=> (a.data||"").localeCompare(b.data||""))
    .map(m=>`
      <div class="card">
        <div class="meta">Giornata ${m.giornata ?? "-"}</div>
        <h3>${m.casa} <span class="meta">vs</span> ${m.trasferta}</h3>
        <div class="meta">
          ${fmtDate(m.data)} • ${m.ora||""} • ${m.campo||""}
        </div>
        <div style="margin-top:10px">
          <span class="badge">
            ${m.risultato ? "Risultato: "+m.risultato : "Da giocare"}
          </span>
        </div>
        ${m.marcatori ?
          `<div style="margin-top:8px;font-size:13px;color:#b9b9b9;">
            <strong>Marcatori:</strong> ${formatMarcatori(m.marcatori)}
           </div>` : ""}
      </div>
    `).join("");
}

function renderClassifica(){
  const items = appData.classifica || [];
  const cal = appData.calendario || [];

  function buildMarcatori(){
    const goals = {};
    cal.forEach(m=>{
      if(!m.marcatori) return;
      m.marcatori.split(";").forEach(e=>{
        const trimmed = e.trim();
        if(!trimmed || trimmed.toLowerCase().includes("autogol")) return;
        const parts = trimmed.split(" ").filter(Boolean);
        const name = ((parts[0]||"")+" "+(parts[1]||"")).trim();
        const count = trimmed.includes(",") ? trimmed.split(",").length : 1;
        if(name) goals[name]=(goals[name]||0)+count;
      });
    });
    return Object.keys(goals)
      .map(n=>({nome:n,gol:goals[n]}))
      .sort((a,b)=>b.gol-a.gol);
  }

  const rows = items.map(r=>`
    <tr>
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
  `).join("");

  const marcatori = buildMarcatori().map((p,i)=>`
    <tr>
      <td>${i+1}</td>
      <td>${p.nome}</td>
      <td><strong>${p.gol}</strong></td>
    </tr>
  `).join("");

  views.classifica.innerHTML = `
    <div class="card">
      <div class="subtabs">
        <button class="subtab is-active" data-sub="tabella">Classifica</button>
        <button class="subtab" data-sub="marcatori">Marcatori</button>
      </div>

      <div id="panel-tabella">
        <table class="table">
          <thead>
            <tr>
              <th>Pos</th><th>Squadra</th><th>PT</th>
              <th>G</th><th>V</th><th>N</th><th>S</th>
              <th>GF</th><th>GS</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <div id="panel-marcatori" style="display:none">
        <table class="table">
          <thead>
            <tr><th>Pos</th><th>Giocatrice</th><th>Gol</th></tr>
          </thead>
          <tbody>${marcatori}</tbody>
        </table>
      </div>
    </div>
  `;

  const btns = views.classifica.querySelectorAll(".subtab");
  btns.forEach(b=>{
    b.addEventListener("click",()=>{
      btns.forEach(x=>x.classList.toggle("is-active",x===b));
      document.getElementById("panel-tabella").style.display =
        b.dataset.sub==="tabella"?"block":"none";
      document.getElementById("panel-marcatori").style.display =
        b.dataset.sub==="marcatori"?"block":"none";
    });
  });
}

function renderRosa(){
  const items = appData.rosa || [];
  const ex = appData.calciatrici_cedute || [];

  const cards = items.map(p=>`
    <div class="player-card"
      onclick="openPlayerModal(${p.numero})">
      <div class="player-img">
        <img src="${p.foto || 'https://via.placeholder.com/300x400/111111/ffffff?text=Colleferro'}">
      </div>
      <div class="player-info">
        <div class="player-number">#${p.numero}</div>
        <div class="player-name">${p.nome} ${p.cognome}</div>
        <div class="player-role">${p.ruolo}</div>
      </div>
    </div>
  `).join("");

  views.rosa.innerHTML = `
    <div class="card"><h3>Rosa</h3></div>
    <div class="grid-rosa">${cards}</div>
  `;
}

function renderInfo(){
  const s = appData.social || {};
  const i = appData.info || {};
  views.info.innerHTML = `
    <div class="card">
      <h3>Info</h3>
      <p><strong>Email:</strong> ${i.contatto_email||"-"}</p>
      <p><strong>Campo:</strong> ${i.campo_nome||"-"}</p>
      <p><strong>Instagram:</strong>
        <a href="${s.instagram||"#"}" target="_blank">Apri</a>
      </p>
    </div>
  `;
}

async function init(){
  document.querySelectorAll(".tab").forEach(btn=>{
    btn.addEventListener("click",()=>setActive(btn.dataset.view));
  });

  const res = await fetch("data.json",{cache:"no-store"});
  appData = await res.json();

  renderNews();
  renderCalendario();
  renderClassifica();
  renderRosa();
  renderInfo();
}

window.openNewsModal = function(){};
window.openPlayerModal = function(){};

init();
