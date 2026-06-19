// 資料完整性檢查 — 一次性,跑完可刪
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./data/entities.js", import.meta.url), "utf8");
const g = {};
new Function("window", src)(g);
const D = g.DATA;

const ids = new Set(D.entities.map(e => e.id));
const periodIds = new Set(D.periods.map(p => p.id));
let problems = 0;
const warn = m => { problems++; console.log("  ✗ " + m); };

console.log(`時期 ${D.periods.length} · 實體 ${D.entities.length} · 關聯 ${D.relations.length} · 章節 ${D.chapters.length}\n`);

// 1. 實體 id 唯一 + periodId 有效 + 必要欄位
console.log("檢查 entities…");
const seen = new Set();
const validTypes = new Set(["person", "tool", "concept", "project", "lab"]);
D.entities.forEach(e => {
  if (seen.has(e.id)) warn(`重複 id: ${e.id}`);
  seen.add(e.id);
  if (!periodIds.has(e.periodId)) warn(`${e.id} 的 periodId 無效: ${e.periodId}`);
  if (!validTypes.has(e.type)) warn(`${e.id} 的 type 無效: ${e.type}`);
  ["name", "summary", "body", "year"].forEach(f => { if (e[f] === undefined || e[f] === "") warn(`${e.id} 缺欄位: ${f}`); });
});

// 2. 關聯 from/to 都要存在
console.log("檢查 relations…");
D.relations.forEach((r, i) => {
  if (!ids.has(r.from)) warn(`relation #${i} from 不存在: ${r.from} (label: ${r.label})`);
  if (!ids.has(r.to))   warn(`relation #${i} to 不存在: ${r.to} (label: ${r.label})`);
  if (r.from === r.to)  warn(`relation #${i} 自連: ${r.from}`);
});

// 3. 章節 periodId 有效
console.log("檢查 chapters…");
D.chapters.forEach(c => {
  if (!periodIds.has(c.periodId)) warn(`章節 ${c.id} 的 periodId 無效: ${c.periodId}`);
  if (!c.paragraphs || !c.paragraphs.length) warn(`章節 ${c.id} 沒有段落`);
});

// 4. 提示:沒有任何關聯的孤兒實體(不是錯,只是提醒)
const connected = new Set();
D.relations.forEach(r => { connected.add(r.from); connected.add(r.to); });
const orphans = D.entities.filter(e => !connected.has(e.id));
if (orphans.length) console.log(`\n  ⓘ 孤兒實體(無任何關聯,網絡圖會漂浮):${orphans.map(e => e.id).join(", ")}`);

// 5. 提示:每個時期的實體數
console.log("\n各時期實體數:");
D.periods.forEach(p => {
  const n = D.entities.filter(e => e.periodId === p.id).length;
  console.log(`  ${p.id} ${p.name}: ${n}`);
});

console.log("\n" + (problems === 0 ? "✅ 完整性檢查通過,沒有破損的參照。" : `⚠️ 發現 ${problems} 個問題。`));
