// 共用 App 殼 — 側邊欄(檔案總管式)+ ⌘K 指令面板 + 連結 hover 預覽 + 主題切換
// 各頁掛上 <div id="nav"></div> 即可。需要 window.DATA(entities.js)。
// 開詞條一律呼叫 window.__openEntity(id)(由 modal.js 提供,已在每頁載入)。
(function () {
  // ── 盡早套用主題,降低閃爍 ──
  if (localStorage.getItem("daTheme") === "light") document.documentElement.dataset.theme = "light";

  const DATA = window.DATA;
  if (!DATA) return;

  const typeLabel = { person: "人物", tool: "工具", concept: "概念", project: "案例", lab: "實驗室" };
  const typeShort = { person: "人", tool: "工", concept: "概", project: "案", lab: "室" };
  const periodMap = Object.fromEntries(DATA.periods.map(p => [p.id, p]));
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const kLabel = isMac ? "⌘K" : "Ctrl K";

  const views = [
    { href: "index.html",    label: "首頁",     id: "home",     ico: "⌂" },
    { href: "timeline.html", label: "時間軸",   id: "timeline", ico: "◷" },
    { href: "network.html",  label: "關聯網絡", id: "network",  ico: "⬡" },
    { href: "cards.html",    label: "分類索引", id: "cards",    ico: "▦" },
    { href: "chapters.html", label: "章節閱讀", id: "chapters", ico: "❡" }
  ];
  const active = document.body.dataset.page || "home";

  function openEntity(id) {
    if (typeof window.__openEntity === "function") window.__openEntity(id);
    else window.location.href = "cards.html"; // 後備:沒有 modal 的頁面
  }

  // ─────────────────────────────────────────────────────────
  // 側邊欄
  // ─────────────────────────────────────────────────────────
  const byPeriod = DATA.periods.map(p => ({
    p,
    items: DATA.entities.filter(e => e.periodId === p.id).sort((a, b) => (a.year - b.year) || a.name.localeCompare(b.name))
  }));

  const treeHtml = byPeriod.map(({ p, items }) => `
    <div class="tree-group" data-period="${p.id}">
      <button class="tree-head">
        <span class="tree-chevron">▶</span>
        <span class="tree-dot" style="background:${p.color}"></span>
        <span class="tree-name">${p.name}</span>
        <span class="tree-count">${items.length}</span>
      </button>
      <div class="tree-items">
        ${items.map(e => `
          <button class="tree-item" data-id="${e.id}">
            <span class="tt">${typeShort[e.type] || ""}</span>
            <span class="tn">${e.name}</span>
          </button>`).join("")}
      </div>
    </div>`).join("");

  const sidebar = document.createElement("aside");
  sidebar.className = "sidebar";
  sidebar.innerHTML = `
    <a href="index.html" class="side-brand">
      <span class="bk">數位建築 脈絡</span>
      <span class="bs">Digital Architecture Lineage</span>
    </a>
    <button class="side-search" id="side-search">
      <span>🔍</span><span>搜尋詞條…</span><span class="kbd">${kLabel}</span>
    </button>
    <div class="side-scroll">
      <div class="side-section-label">視圖</div>
      ${views.map(v => `
        <a href="${v.href}" class="side-view ${v.id === active ? "active" : ""}">
          <span class="ico">${v.ico}</span><span>${v.label}</span>
        </a>`).join("")}
      <div class="side-section-label">時期 · 詞條</div>
      ${treeHtml}
    </div>
    <div class="side-foot">
      <div class="side-stats">${DATA.entities.length} 詞條 · ${DATA.relations.length} 關聯<br>${DATA.periods.length} 時期 · 1675–2026</div>
      <button class="theme-toggle" id="theme-toggle"></button>
    </div>`;

  const mount = document.getElementById("nav");
  if (mount) mount.replaceWith(sidebar);
  else document.body.prepend(sidebar);

  // 行動版開關 + 遮罩
  const toggle = document.createElement("button");
  toggle.className = "side-toggle";
  toggle.id = "side-toggle";
  toggle.textContent = "☰";
  toggle.setAttribute("aria-label", "選單");
  document.body.appendChild(toggle);

  const scrim = document.createElement("div");
  scrim.className = "side-scrim";
  document.body.appendChild(scrim);

  toggle.addEventListener("click", () => document.body.classList.toggle("side-open"));
  scrim.addEventListener("click", () => document.body.classList.remove("side-open"));

  // 樹狀展開/收合
  sidebar.querySelectorAll(".tree-head").forEach(h => {
    h.addEventListener("click", () => h.parentElement.classList.toggle("open"));
  });
  // 點詞條
  sidebar.querySelectorAll(".tree-item").forEach(b => {
    b.addEventListener("click", () => { openEntity(b.dataset.id); document.body.classList.remove("side-open"); });
  });

  // 主題切換
  const themeBtn = document.getElementById("theme-toggle");
  function syncTheme() {
    const light = document.documentElement.dataset.theme === "light";
    themeBtn.textContent = light ? "☾ 深色" : "☀ 淺色";
  }
  syncTheme();
  themeBtn.addEventListener("click", () => {
    const light = document.documentElement.dataset.theme === "light";
    if (light) { delete document.documentElement.dataset.theme; localStorage.setItem("daTheme", "dark"); }
    else { document.documentElement.dataset.theme = "light"; localStorage.setItem("daTheme", "light"); }
    syncTheme();
  });

  // ─────────────────────────────────────────────────────────
  // ⌘K 指令面板
  // ─────────────────────────────────────────────────────────
  const palette = document.createElement("div");
  palette.className = "cmdk";
  palette.innerHTML = `
    <div class="cmdk-box" role="dialog" aria-label="搜尋">
      <input class="cmdk-input" id="cmdk-input" placeholder="跳到詞條、視圖…" autocomplete="off" spellcheck="false" />
      <div class="cmdk-list" id="cmdk-list"></div>
      <div class="cmdk-foot"><span><span class="kbd">↑↓</span>移動</span><span><span class="kbd">↵</span>開啟</span><span><span class="kbd">esc</span>關閉</span></div>
    </div>`;
  document.body.appendChild(palette);

  const cInput = palette.querySelector("#cmdk-input");
  const cList = palette.querySelector("#cmdk-list");

  // 可搜尋項目:視圖 + 詞條
  const viewItems = views.map(v => ({ kind: "view", ico: v.ico, name: v.label, href: v.href, hay: (v.label + " " + v.id).toLowerCase() }));
  const entItems = DATA.entities.map(e => ({
    kind: "entity", id: e.id, name: e.name,
    color: periodMap[e.periodId].color, meta: typeLabel[e.type] + " · " + e.year,
    hay: (e.name + " " + (e.nameEn || "") + " " + (e.summary || "")).toLowerCase()
  }));

  let results = [], sel = 0;

  function buildResults(q) {
    q = q.trim().toLowerCase();
    if (!q) {
      const vh = viewItems.map(v => ({ ...v, group: "視圖" }));
      const some = entItems.slice(0, 6).map(e => ({ ...e, group: "詞條" }));
      return vh.concat(some);
    }
    const vmatch = viewItems.filter(v => v.hay.includes(q)).map(v => ({ ...v, group: "視圖" }));
    const ematch = entItems.filter(e => e.hay.includes(q))
      .sort((a, b) => a.name.toLowerCase().indexOf(q) - b.name.toLowerCase().indexOf(q))
      .slice(0, 40).map(e => ({ ...e, group: "詞條" }));
    return vmatch.concat(ematch);
  }

  function renderResults() {
    if (!results.length) { cList.innerHTML = `<div class="cmdk-empty">沒有符合的結果</div>`; return; }
    let html = "", lastGroup = null;
    results.forEach((r, i) => {
      if (r.group !== lastGroup) { html += `<div class="cmdk-group-label">${r.group}</div>`; lastGroup = r.group; }
      const lead = r.kind === "view"
        ? `<span class="ci-ico">${r.ico}</span>`
        : `<span class="ci-dot" style="background:${r.color}"></span>`;
      const meta = r.kind === "entity" ? `<span class="ci-meta">${r.meta}</span>` : "";
      html += `<div class="cmdk-item ${i === sel ? "sel" : ""}" data-i="${i}" ${r.kind === "entity" ? `data-id="${r.id}"` : ""}>${lead}<span class="ci-name">${r.name}</span>${meta}</div>`;
    });
    cList.innerHTML = html;
    const selEl = cList.querySelector(".cmdk-item.sel");
    if (selEl) selEl.scrollIntoView({ block: "nearest" });
    cList.querySelectorAll(".cmdk-item").forEach(el => {
      el.addEventListener("click", () => activate(results[+el.dataset.i]));
      el.addEventListener("mousemove", () => { sel = +el.dataset.i; markSel(); });
    });
  }
  function markSel() {
    cList.querySelectorAll(".cmdk-item").forEach((el, i) => el.classList.toggle("sel", i === sel));
    const selEl = cList.querySelector(".cmdk-item.sel");
    if (selEl) selEl.scrollIntoView({ block: "nearest" });
  }
  function activate(r) {
    if (!r) return;
    closePalette();
    if (r.kind === "view") window.location.href = r.href;
    else openEntity(r.id);
  }
  function refresh() { results = buildResults(cInput.value); sel = 0; renderResults(); }

  function openPalette() {
    palette.classList.add("show");
    cInput.value = ""; refresh();
    setTimeout(() => cInput.focus(), 20);
  }
  function closePalette() { palette.classList.remove("show"); }

  cInput.addEventListener("input", refresh);
  cInput.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, results.length - 1); markSel(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); markSel(); }
    else if (e.key === "Enter") { e.preventDefault(); activate(results[sel]); }
    else if (e.key === "Escape") { closePalette(); }
  });
  palette.addEventListener("click", e => { if (e.target === palette) closePalette(); });
  document.getElementById("side-search").addEventListener("click", openPalette);
  document.addEventListener("keydown", e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); palette.classList.contains("show") ? closePalette() : openPalette(); }
  });

  // ─────────────────────────────────────────────────────────
  // 連結 hover 預覽
  // ─────────────────────────────────────────────────────────
  const hp = document.createElement("div");
  hp.className = "hover-preview";
  document.body.appendChild(hp);
  const entityMap = Object.fromEntries(DATA.entities.map(e => [e.id, e]));
  let hpTimer = null, hpTarget = null;

  function showPreview(el) {
    const e = entityMap[el.dataset.id];
    if (!e) return;
    const p = periodMap[e.periodId];
    hp.style.borderTopColor = p.color;
    hp.innerHTML = `
      <div class="hp-type">${typeLabel[e.type] || e.type}</div>
      <div class="hp-title">${e.name}</div>
      <div class="hp-meta">${e.nameEn ? e.nameEn + " · " : ""}${e.year} · ${p.name}</div>
      <p class="hp-summary">${e.summary || ""}</p>`;
    // 量測後定位
    hp.style.visibility = "hidden"; hp.classList.add("show");
    requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const w = hp.offsetWidth, h = hp.offsetHeight, gap = 10, vw = innerWidth, vh = innerHeight;
      let x = r.right + gap;
      if (x + w > vw - 8) x = r.left - w - gap;        // 右側放不下 → 放左側
      if (x < 8) x = Math.min(Math.max(8, r.left), vw - w - 8);
      let y = r.top;
      if (y + h > vh - 8) y = vh - h - 8;
      if (y < 8) y = 8;
      hp.style.left = x + "px"; hp.style.top = y + "px";
      hp.style.visibility = "";
    });
  }
  function hidePreview() { clearTimeout(hpTimer); hpTimer = null; hpTarget = null; hp.classList.remove("show"); }

  document.addEventListener("mouseover", e => {
    if (palette.classList.contains("show")) return;
    const el = e.target.closest("[data-id]");
    if (!el || el === hpTarget) return;
    if (!entityMap[el.dataset.id]) return;
    clearTimeout(hpTimer);
    hpTarget = el;
    hpTimer = setTimeout(() => showPreview(el), 240);
  });
  document.addEventListener("mouseout", e => {
    const el = e.target.closest("[data-id]");
    if (el && el === hpTarget && !el.contains(e.relatedTarget)) hidePreview();
  });
  document.addEventListener("click", hidePreview, true);
  window.addEventListener("scroll", hidePreview, true);
})();
