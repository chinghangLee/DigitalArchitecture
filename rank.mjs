// 依關聯圖的連結數(degree)排序詞條 — 當作「分層深度」的客觀依據
import { readFileSync } from "node:fs";
const src = readFileSync(new URL("./data/entities.js", import.meta.url), "utf8");
const g = {}; new Function("window", src)(g);
const D = g.DATA;

const typeLabel = { person: "人物", tool: "工具", concept: "概念", project: "案例", lab: "實驗室" };
const periodMap = Object.fromEntries(D.periods.map(p => [p.id, p.name]));

const deg = {};
D.entities.forEach(e => deg[e.id] = 0);
D.relations.forEach(r => { if (deg[r.from] != null) deg[r.from]++; if (deg[r.to] != null) deg[r.to]++; });

const ranked = D.entities
  .map(e => ({ ...e, deg: deg[e.id] }))
  .sort((a, b) => b.deg - a.deg);

console.log("【連結數最高的 20 個 — 明顯的「核心」】");
ranked.slice(0, 20).forEach((e, i) =>
  console.log(`  ${String(i + 1).padStart(2)}. ${String(e.deg).padStart(2)} 連結  ${e.name}  (${typeLabel[e.type]}/${periodMap[e.periodId]})`));

console.log("\n【若以 degree 門檻切「核心 / 次要」,各層數量】");
[3, 4, 5].forEach(t => {
  const core = ranked.filter(e => e.deg >= t).length;
  console.log(`  門檻 ≥${t}:核心 ${core} 篇 / 次要 ${D.entities.length - core} 篇`);
});

console.log("\n【degree 分布】");
const dist = {};
ranked.forEach(e => dist[e.deg] = (dist[e.deg] || 0) + 1);
Object.keys(dist).map(Number).sort((a, b) => b - a).forEach(d =>
  console.log(`  ${String(d).padStart(2)} 連結: ${"█".repeat(dist[d])} ${dist[d]}`));

console.log("\n【各類型平均連結數(看哪種類型通常較樞紐)】");
["concept", "tool", "person", "project", "lab"].forEach(t => {
  const arr = ranked.filter(e => e.type === t);
  const avg = (arr.reduce((s, e) => s + e.deg, 0) / arr.length).toFixed(1);
  console.log(`  ${typeLabel[t]}: 平均 ${avg} 連結 (${arr.length} 篇)`);
});
