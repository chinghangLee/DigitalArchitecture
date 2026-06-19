// 關聯網絡視圖 — d3-force 力導向圖
(function () {
  const data = window.DATA;
  if (!data || typeof d3 === "undefined") return;

  const periodMap = Object.fromEntries(data.periods.map(p => [p.id, p]));
  const typeLabel = { person: "人物", tool: "工具", concept: "概念", project: "案例", lab: "實驗室" };

  // 時期色票 legend
  const legend = document.getElementById("net-period-legend");
  legend.innerHTML = data.periods.map(p => `
    <div class="legend-item"><span class="legend-dot" style="background: ${p.color}"></span> ${p.name} <span style="color: var(--text-3); font-family: var(--font-mono); font-size: 0.72rem; margin-left: 4px;">${p.years}</span></div>
  `).join("");

  // 準備 nodes / links
  const nodes = data.entities.map(e => ({
    id: e.id,
    name: e.name,
    type: e.type,
    color: periodMap[e.periodId].color,
    raw: e
  }));
  const links = data.relations
    .filter(r => nodes.find(n => n.id === r.from) && nodes.find(n => n.id === r.to))
    .map(r => ({ source: r.from, target: r.to, label: r.label }));

  // 鄰接表(供 hover/selection 高亮用)
  const adjacency = {};
  nodes.forEach(n => adjacency[n.id] = new Set());
  links.forEach(l => {
    adjacency[l.source].add(l.target);
    adjacency[l.target].add(l.source);
  });

  // SVG 尺寸
  const canvas = document.getElementById("net-canvas");
  const svg = d3.select("#net-svg");
  let width = canvas.clientWidth;
  let height = canvas.clientHeight;
  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const g = svg.append("g");

  // 縮放
  svg.call(d3.zoom().scaleExtent([0.3, 4]).on("zoom", ev => g.attr("transform", ev.transform)));

  // 力場
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(80).strength(0.3))
    .force("charge", d3.forceManyBody().strength(-260))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(28));

  // links(曲線 path)
  const link = g.append("g")
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("class", "net-link");

  // nodes
  const node = g.append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", "net-node")
    .call(d3.drag()
      .on("start", (ev, d) => { if (!ev.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag", (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
      .on("end", (ev, d) => { if (!ev.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
    );

  // 各類型用不同形狀(圓/方/菱/三角/半圓)
  node.each(function (d) {
    const sel = d3.select(this);
    const r = 9;
    if (d.type === "person") {
      sel.append("circle").attr("class", "net-node-bg").attr("r", r).attr("fill", d.color).attr("stroke", "#0f0f10");
    } else if (d.type === "tool") {
      sel.append("rect").attr("class", "net-node-bg").attr("x", -r).attr("y", -r).attr("width", r * 2).attr("height", r * 2).attr("fill", d.color).attr("stroke", "#0f0f10");
    } else if (d.type === "concept") {
      sel.append("rect").attr("class", "net-node-bg").attr("x", -r).attr("y", -r).attr("width", r * 2).attr("height", r * 2).attr("transform", "rotate(45)").attr("fill", d.color).attr("stroke", "#0f0f10");
    } else if (d.type === "project") {
      sel.append("path").attr("class", "net-node-bg").attr("d", `M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0 L ${r} ${r} L ${-r} ${r} Z`).attr("fill", d.color).attr("stroke", "#0f0f10");
    } else if (d.type === "lab") {
      sel.append("path").attr("class", "net-node-bg").attr("d", `M 0 ${-r * 1.1} L ${r * 1.1} ${r * 0.9} L ${-r * 1.1} ${r * 0.9} Z`).attr("fill", d.color).attr("stroke", "#0f0f10");
    }
    sel.append("text").attr("class", "net-node-label").attr("y", r + 14).text(d.name);
  });

  // 選取/高亮 + 搜尋
  let selectedId = null;
  let searchIds = null; // null = 未搜尋
  function nodeDim(id) {
    if (searchIds && !searchIds.has(id)) return true;
    if (selectedId !== null && id !== selectedId && !adjacency[selectedId].has(id)) return true;
    return false;
  }
  function applyHighlight() {
    node.selectAll(".net-node-bg")
      .classed("selected", d => d.id === selectedId)
      .classed("dim", d => nodeDim(d.id));
    node.selectAll(".net-node-label")
      .style("opacity", d => {
        if (nodeDim(d.id)) return 0.1;
        if (selectedId && (d.id === selectedId || adjacency[selectedId].has(d.id))) return 1;
        if (searchIds && searchIds.has(d.id)) return 1;
        return 0.5;                       // 預設半透明,避免 175 個標籤全擠在一起
      });
    link
      .classed("highlight", l => selectedId !== null && (l.source.id === selectedId || l.target.id === selectedId))
      .classed("dim", l => {
        if (searchIds) return !searchIds.has(l.source.id) || !searchIds.has(l.target.id);
        return selectedId !== null && l.source.id !== selectedId && l.target.id !== selectedId;
      });
  }
  // 搜尋框:符合的節點高亮,其餘淡出
  const searchInput = document.getElementById("net-search");
  if (searchInput) {
    searchInput.addEventListener("input", e => {
      const q = e.target.value.trim().toLowerCase();
      searchIds = q
        ? new Set(nodes.filter(n => (n.name + " " + (n.raw.nameEn || "")).toLowerCase().includes(q)).map(n => n.id))
        : null;
      applyHighlight();
    });
  }

  node.on("click", (ev, d) => {
    selectedId = (selectedId === d.id) ? null : d.id;
    applyHighlight();
    renderDetail(selectedId);
  });

  // hover:浮到最上層、亮標籤、加光暈
  node.on("mouseenter", function (ev, d) {
    if (nodeDim(d.id)) return;
    const sel = d3.select(this);
    sel.raise();
    sel.select(".net-node-bg").classed("hov", true);
    sel.select(".net-node-label").style("opacity", 1);
  }).on("mouseleave", function () {
    d3.select(this).select(".net-node-bg").classed("hov", false);
    applyHighlight();
  });

  // tick
  simulation.on("tick", () => {
    link.attr("d", d => {
      const sx = d.source.x, sy = d.source.y, tx = d.target.x, ty = d.target.y;
      const dx = tx - sx, dy = ty - sy, norm = Math.hypot(dx, dy) || 1;
      const off = Math.min(norm * 0.12, 26);          // 垂直偏移 → 柔和弧度
      const cx = (sx + tx) / 2 - dy / norm * off;
      const cy = (sy + ty) / 2 + dx / norm * off;
      return `M${sx},${sy} Q${cx},${cy} ${tx},${ty}`;
    });
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  });

  applyHighlight();   // 初始即套用「半透明標籤」去雜亂

  // 詳細面板
  const detail = document.getElementById("net-detail");
  function renderDetail(id) {
    if (!id) {
      detail.innerHTML = `<p class="net-empty">點擊節點看細節,拖曳節點調整位置,滾輪縮放。</p>`;
      return;
    }
    const e = data.entities.find(x => x.id === id);
    const p = periodMap[e.periodId];
    const wiki = window.WIKI ? window.WIKI.url(e) : null;
    const rels = data.relations
      .filter(r => r.from === id || r.to === id)
      .map(r => {
        const other = data.entities.find(x => x.id === (r.from === id ? r.to : r.from));
        const dir = r.from === id ? "→" : "←";
        return { dir, label: r.label, other };
      })
      .filter(r => r.other);

    detail.innerHTML = `
      <div class="ec-type" style="font-family: var(--font-mono); font-size: 0.72rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-3);">${typeLabel[e.type]}</div>
      <h3>${e.name}</h3>
      <div class="meta">${e.nameEn ? e.nameEn + " · " : ""}${e.year} · <span style="color: ${p.color}">${p.name}</span></div>
      ${wiki ? `<a class="wiki-link" href="${wiki}" target="_blank" rel="noopener noreferrer">維基百科 ↗</a>` : ""}
      ${e.img ? `<img class="ent-img" src="${e.img}" alt="${e.name}">` : ""}
      <p class="summary"><strong>${e.summary}</strong></p>
      ${(Array.isArray(e.body) ? e.body : [e.body]).map(par => `<p class="body">${par}</p>`).join("")}
      ${rels.length ? `
        <div class="relations">
          <h4 style="font-family: var(--font-mono); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--text-3); margin-bottom: 10px;">關聯 (${rels.length})</h4>
          ${rels.map(r => `
            <div class="rel">
              <span class="rel-label">${r.dir} ${r.label}</span>
              <a href="#" data-id="${r.other.id}">${r.other.name}</a>
            </div>
          `).join("")}
        </div>` : ""}
      ${e.sources && e.sources.length ? `
        <div class="net-refs">
          <h4>來源</h4>
          <ol>${e.sources.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title} ↗</a></li>`).join("")}</ol>
        </div>` : ""}
      ${e.refs && e.refs.length ? `
        <div class="net-refs">
          <h4>延伸閱讀</h4>
          <ul>${e.refs.map(r => typeof r === "string" ? `<li>${r}</li>` : `<li><a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.title} ↗</a></li>`).join("")}</ul>
        </div>` : ""}
    `;

    detail.querySelectorAll("a[data-id]").forEach(a => {
      a.addEventListener("click", ev => {
        ev.preventDefault();
        selectedId = a.dataset.id;
        applyHighlight();
        renderDetail(selectedId);
      });
    });
  }

  // 重新調整尺寸
  window.addEventListener("resize", () => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    simulation.force("center", d3.forceCenter(width / 2, height / 2));
    simulation.alpha(0.3).restart();
  });
})();
