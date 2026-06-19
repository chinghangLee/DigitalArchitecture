// 共用詳細資料 modal — 屬性區 + 連出 / 連入(反向連結)
// 若頁面沒有 modal DOM 會自動建立,故首頁 / 網絡頁也能開詞條。
(function () {
  const data = window.DATA;
  if (!data) return;

  // 若頁面沒有 modal 結構就動態建立
  let backdrop = document.getElementById("modal-backdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.id = "modal-backdrop";
    backdrop.innerHTML = `
      <div class="modal" id="modal">
        <button class="modal-close" id="modal-close">×</button>
        <div id="modal-body"></div>
      </div>`;
    document.body.appendChild(backdrop);
  }
  const modal = document.getElementById("modal");
  const body  = document.getElementById("modal-body");
  const close = document.getElementById("modal-close");

  const typeLabel = { person: "人物", tool: "工具", concept: "概念", project: "案例", lab: "實驗室" };
  const periodMap = Object.fromEntries(data.periods.map(p => [p.id, p]));
  const entityMap = Object.fromEntries(data.entities.map(e => [e.id, e]));

  function relationsFor(id) {
    const out = [], inc = [];
    data.relations.forEach(r => {
      if (r.from === id) { const t = entityMap[r.to];   if (t) out.push({ label: r.label, other: t }); }
      else if (r.to === id) { const f = entityMap[r.from]; if (f) inc.push({ label: r.label, other: f }); }
    });
    return { out, inc };
  }

  function relGroup(title, arr) {
    if (!arr.length) return "";
    return `
      <div class="rel-group">
        <h4>${title}<span class="rg-count">(${arr.length})</span></h4>
        ${arr.map(r => `
          <div class="rel">
            <span class="rel-label">${r.label}</span>
            <a href="#" data-id="${r.other.id}">${r.other.name}</a>
          </div>`).join("")}
      </div>`;
  }

  window.__openEntity = function (id) {
    const e = entityMap[id];
    if (!e) return;
    const p = periodMap[e.periodId];
    const { out, inc } = relationsFor(id);
    const wiki = window.WIKI ? window.WIKI.url(e) : null;

    modal.style.borderTopColor = p.color;
    body.innerHTML = `
      <div class="ec-type">${typeLabel[e.type] || e.type}</div>
      <h2>${e.name}</h2>
      ${e.nameEn && e.nameEn !== e.name ? `<div class="ec-en" style="color:var(--text-3); margin-bottom:4px;">${e.nameEn}</div>` : ""}
      ${wiki ? `<a class="wiki-link" href="${wiki}" target="_blank" rel="noopener noreferrer">維基百科 ↗</a>` : ""}
      <div class="modal-props">
        <span class="pk">類別</span><span class="pv">${typeLabel[e.type] || e.type}</span>
        <span class="pk">年份</span><span class="pv">${e.year}</span>
        <span class="pk">時期</span><span class="pv"><span class="pdot" style="background:${p.color}"></span>${p.name} · ${p.years}</span>
      </div>
      ${e.img ? `<img class="ent-img" src="${e.img}" alt="${e.name}">` : ""}
      <p class="body"><strong>${e.summary}</strong></p>
      ${(Array.isArray(e.body) ? e.body : [e.body]).map(par => `<p class="body" style="color: var(--text-2);">${par}</p>`).join("")}
      ${(out.length || inc.length) ? `
        <div class="modal-relations">
          ${relGroup("關聯 →", out)}
          ${relGroup("連入 ← (被提及)", inc)}
        </div>` : ""}
      ${e.sources && e.sources.length ? `
        <div class="modal-refs">
          <h4>來源</h4>
          <ol>${e.sources.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title} ↗</a></li>`).join("")}</ol>
        </div>` : ""}
      ${e.refs && e.refs.length ? `
        <div class="modal-refs">
          <h4>延伸閱讀</h4>
          <ul>${e.refs.map(r => typeof r === "string" ? `<li>${r}</li>` : `<li><a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.title} ↗</a></li>`).join("")}</ul>
        </div>` : ""}
    `;
    backdrop.classList.add("show");
    modal.scrollTop = 0;

    body.querySelectorAll("a[data-id]").forEach(a => {
      a.addEventListener("click", ev => { ev.preventDefault(); window.__openEntity(a.dataset.id); });
    });
  };

  function closeModal() { backdrop.classList.remove("show"); }
  close.addEventListener("click", closeModal);
  backdrop.addEventListener("click", e => { if (e.target === backdrop) closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && backdrop.classList.contains("show")) closeModal(); });
})();
