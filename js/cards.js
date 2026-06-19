// 分類索引卡片視圖
(function () {
  const data = window.DATA;
  const periodMap = Object.fromEntries(data.periods.map(p => [p.id, p]));
  const typeLabel = { person: "人物", tool: "工具", concept: "概念", project: "案例", lab: "實驗室" };

  const state = { type: "all", period: "all", q: "" };

  // 時期 filter chips
  const pf = document.getElementById("period-filters");
  pf.innerHTML = data.periods.map(p => `
    <button class="filter-chip" data-filter="period" data-value="${p.id}" style="border-left: 3px solid ${p.color}">${p.name}</button>
  `).join("");

  // 綁定 filter
  document.querySelectorAll(".filter-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      const v = btn.dataset.value;
      state[f] = v;
      document.querySelectorAll(`.filter-chip[data-filter="${f}"]`).forEach(b => b.classList.toggle("active", b.dataset.value === v));
      render();
    });
  });

  const search = document.getElementById("search");
  search.addEventListener("input", e => { state.q = e.target.value.trim().toLowerCase(); render(); });

  const grid = document.getElementById("grid");
  const count = document.getElementById("count");

  function render() {
    const filtered = data.entities.filter(e => {
      if (state.type !== "all" && e.type !== state.type) return false;
      if (state.period !== "all" && e.periodId !== state.period) return false;
      if (state.q) {
        const hay = (e.name + " " + (e.nameEn || "") + " " + e.summary + " " + e.body).toLowerCase();
        if (!hay.includes(state.q)) return false;
      }
      return true;
    }).sort((a, b) => a.year - b.year);

    count.textContent = `${filtered.length} / ${data.entities.length} 條目`;

    grid.innerHTML = filtered.map(e => {
      const p = periodMap[e.periodId];
      return `
        <article class="entity-card" data-id="${e.id}" style="border-top-color: ${p.color}">
          <div class="ec-head">
            <span class="ec-type">${typeLabel[e.type]}</span>
            <span class="ec-year">${e.year}</span>
          </div>
          <h3>${e.name}</h3>
          ${e.nameEn ? `<div class="ec-en">${e.nameEn}</div>` : ""}
          <p class="ec-summary">${e.summary}</p>
        </article>
      `;
    }).join("");

    grid.querySelectorAll(".entity-card").forEach(card => {
      card.addEventListener("click", () => window.__openEntity(card.dataset.id));
    });
  }

  render();
})();
