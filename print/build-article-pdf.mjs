// 把「章節閱讀」文章輸出成適合列印 / 閱讀的 HTML（再交給 Chrome 轉 PDF）
// 資料來源:../data/entities.js(window.DATA),只取文章本體:lead + 段落 + 小節 + 來源
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// ── 載入 window.DATA(entities.js 是瀏覽器腳本,用 shim 取出資料)──
const src = readFileSync(join(root, "data/entities.js"), "utf8");
const window = {};
eval(src); // 設定 window.DATA
const DATA = window.DATA;
const periodMap = Object.fromEntries(DATA.periods.map((p) => [p.id, p]));

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const para = (t) => `<p>${esc(t)}</p>`;

// ── 目錄 ──
const toc = DATA.chapters
  .map((c, i) => {
    const p = periodMap[c.periodId];
    return `<li>
      <span class="toc-no" style="color:${p.color}">${String(i + 1).padStart(2, "0")}</span>
      <span class="toc-title">${esc(c.title)}</span>
      <span class="toc-years">${esc(p.years)}</span>
    </li>`;
  })
  .join("");

// ── 各章 ──
const chapters = DATA.chapters
  .map((c, idx) => {
    const p = periodMap[c.periodId];
    const intro = (c.paragraphs || []).map(para).join("");
    const sections = (c.sections || [])
      .map(
        (s) => `
      <section class="ch-sub">
        <h3 class="ch-subhead">${esc(s.heading)}</h3>
        ${s.paragraphs.map(para).join("")}
      </section>`
      )
      .join("");
    const sources =
      c.sources && c.sources.length
        ? `<div class="ch-sources"><h4>來源</h4><ol>${c.sources
            .map((s) => `<li>${esc(s.title)}<br><span class="src-url">${esc(s.url)}</span></li>`)
            .join("")}</ol></div>`
        : "";
    return `
    <section class="chapter">
      <div class="ch-num" style="color:${p.color}">Chapter ${String(idx + 1).padStart(2, "0")} · ${esc(p.subtitle)}</div>
      <h2>${esc(c.title)}</h2>
      <div class="ch-years">${esc(p.years)}</div>
      <p class="lead" style="border-color:${p.color}">${esc(c.lead)}</p>
      ${intro}
      ${sections}
      ${sources}
    </section>`;
  })
  .join("");

const html = `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8">
<title>數位建築脈絡 · 章節閱讀</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{
    --ink:#1d1d20; --ink-2:#55555c; --ink-3:#8a8a90; --line:#e3e3e6;
    --sans:"Noto Sans TC","PingFang TC",-apple-system,"Helvetica Neue",sans-serif;
    --mono:"JetBrains Mono","SF Mono",Menlo,monospace;
  }
  @page{ size:A4; margin:20mm 18mm; }
  *{ box-sizing:border-box; }
  html,body{ margin:0; padding:0; }
  body{
    font-family:var(--sans); color:var(--ink); background:#fff;
    font-size:10.8pt; line-height:1.85;
    -webkit-print-color-adjust:exact; print-color-adjust:exact;
    text-rendering:optimizeLegibility;
  }
  p{ margin:0 0 1.15em; text-align:justify; }

  /* 封面 */
  .cover{ height:247mm; display:flex; flex-direction:column; justify-content:center;
          page-break-after:always; }
  .cover .kick{ font-family:var(--mono); font-size:11pt; letter-spacing:.22em;
                color:var(--ink-3); text-transform:uppercase; margin-bottom:22px; }
  .cover h1{ font-size:40pt; font-weight:700; letter-spacing:-.01em; margin:0 0 14px; line-height:1.1; }
  .cover .sub{ font-size:16pt; font-weight:500; color:var(--ink-2); margin:0 0 28px; }
  .cover .desc{ font-size:11.5pt; color:var(--ink-2); max-width:34em; margin:0 0 40px; line-height:1.7; }
  .cover .swatches{ display:flex; gap:8px; margin-bottom:34px; }
  .cover .swatches i{ width:42px; height:6px; border-radius:3px; display:block; }
  .cover .meta{ font-family:var(--mono); font-size:9.5pt; color:var(--ink-3); letter-spacing:.05em; }

  /* 目錄 */
  .toc{ page-break-after:always; padding-top:6mm; }
  .toc h2{ font-family:var(--mono); font-size:11pt; letter-spacing:.2em; text-transform:uppercase;
           color:var(--ink-3); font-weight:500; margin:0 0 26px; }
  .toc ol{ list-style:none; margin:0; padding:0; }
  .toc li{ display:flex; align-items:baseline; gap:16px; padding:13px 0; border-bottom:1px solid var(--line); }
  .toc-no{ font-family:var(--mono); font-size:13pt; font-weight:500; min-width:2.2em; }
  .toc-title{ font-size:14pt; font-weight:500; flex:1; }
  .toc-years{ font-family:var(--mono); font-size:9.5pt; color:var(--ink-3); }

  /* 章節 */
  .chapter{ page-break-before:always; }
  .ch-num{ font-family:var(--mono); font-size:9pt; letter-spacing:.14em; margin-bottom:12px; }
  .chapter h2{ font-size:25pt; font-weight:700; line-height:1.18; letter-spacing:-.02em; margin:0 0 8px; }
  .ch-years{ font-family:var(--mono); font-size:9.5pt; color:var(--ink-3); margin-bottom:24px; }
  .lead{ font-size:12.5pt; line-height:1.6; font-weight:500; color:var(--ink);
         padding-left:16px; border-left:3px solid; margin:0 0 26px; text-align:left; }

  .ch-sub{ margin-top:30px; }
  .ch-subhead{ font-size:15pt; font-weight:700; line-height:1.35; letter-spacing:-.01em;
               margin:0 0 14px; padding-top:22px; border-top:1px solid var(--line);
               break-after:avoid; page-break-after:avoid; }
  .ch-sub p:first-of-type{ break-before:avoid; }

  /* 來源 */
  .ch-sources{ margin-top:34px; padding-top:18px; border-top:1px solid var(--line); break-inside:avoid; }
  .ch-sources h4{ font-family:var(--mono); font-size:8.5pt; letter-spacing:.14em; text-transform:uppercase;
                  color:var(--ink-3); margin:0 0 12px; font-weight:500; }
  .ch-sources ol{ margin:0; padding-left:1.4em; }
  .ch-sources li{ font-size:9pt; line-height:1.5; color:var(--ink-2); margin-bottom:9px; }
  .src-url{ font-family:var(--mono); font-size:8pt; color:var(--ink-3); word-break:break-all; }
</style></head>
<body>
  <header class="cover">
    <div class="kick">Digital Architecture Lineage</div>
    <h1>數位建築脈絡</h1>
    <div class="sub">章節閱讀 · 七章敘事</div>
    <div class="desc">從 1963 年的 Sketchpad 一路讀到 2022 之後的擴散模型 — 電腦如何從一塊更快的製圖板,一步步成為設計的協作者。</div>
    <div class="swatches">${DATA.periods.map((p) => `<i style="background:${p.color}"></i>`).join("")}</div>
    <div class="meta">起手骨架 v0.1 · 共 ${DATA.chapters.length} 章</div>
  </header>

  <nav class="toc">
    <h2>目錄 · Contents</h2>
    <ol>${toc}</ol>
  </nav>

  ${chapters}
</body></html>`;

const outHtml = join(__dirname, "chapters-article.html");
writeFileSync(outHtml, html, "utf8");
console.log("HTML 已輸出:", outHtml);
console.log("章節數:", DATA.chapters.length);
