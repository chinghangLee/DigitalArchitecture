# 數位建築脈絡網站 — 開發交接文件 (HANDOFF)

> 最後更新:2026-06-14。這份文件讓**新的 session 不靠前次對話記憶**就能接手。
> 專案目錄:`/Users/visionbase_lu/digitalArchitecture`,純靜態 HTML/CSS/JS。

---

## 1. 這是什麼專案

把**數位建築(1963–至今)的脈絡**整理成可互動閱讀的網站,受眾是**建築/設計科系學生 + 一般大眾**。
- 純靜態,可直接 `file://` 開或丟 GitHub Pages。
- **一份資料 `data/entities.js`(`window.DATA = {...}`),五個視圖共用**。
- 設計取向(用戶 2026-06-14 拍板):**Obsidian / Notion 式「tool for thought」介面**(不是貼特效),深色 app 殼、中文用 **PingFang 蘋方系統字**、冷色 indigo accent `#7c83ff`。

---

## 2. 檔案結構與職責

```
index.html / timeline.html / network.html / cards.html / chapters.html   五個頁面
css/style.css        所有樣式:tokens、側邊欄、⌘K、hover預覽、章節、網絡、響應式
js/nav.js            ★App 殼:左側邊欄(檔案總管樹)+ ⌘K 指令面板 + 連結 hover 預覽 + 主題切換 + 行動版抽屜。每頁掛 <div id="nav"></div> 由它接管
js/modal.js          ★詞條詳細彈窗:屬性區 + 「關聯→/連入←(反向連結)」。若頁面無 modal DOM 會自動建立(故每頁都能開詞條)
js/wiki.js           維基連結 helper + OVERRIDES map(撞名指定搜尋詞 / 無條目設 null 不連)
js/cards.js timeline.js chapters.js network.js   各視圖渲染
data/entities.js     ★全部資料:periods / entities / relations / chapters
.claude/launch.json  preview 伺服器(name "static", python3 -m http.server 4173)
```

每頁 `<script>` 載入順序:`entities.js → wiki.js → modal.js → nav.js → <view>.js`(network 另加 d3)。

---

## 3. 資料模型(data/entities.js)

```js
window.DATA = {
  periods:  [ { id:"P1", name, subtitle, years, color } … 七期 P1–P7 ],
  entities: [ { id, type, name, nameEn, year, periodId, summary,
                body: 字串或字串陣列(多段),
                sources?: [{title,url}], refs?, img? } … ],
  relations:[ { from, to, label } … ],      // from/to 都是 entity id
  chapters: [ { id:"C1"…"C7", periodId, title, lead,
                paragraphs: [章前 intro 數段],
                sections: [ { id:"C1-s1", heading, paragraphs:[…] } … 6 節 ],
                sources:  [ {title,url} … ] } ]
}
```
- `type`:`person | tool | concept | project | lab`(公司/組織歸 lab)。
- 七期:P1 萌芽 / P2 形式探索 / P3 參數化崛起 / P4 演算法生成 / P5 數位製造 / P6 BIM 整合 / P7 AI 世代。
- entities 在檔案中**依時期分組**,每組有 `// ─── PX … 補充 ───` 註解;新增詞條請放對應時期區塊。

---

## 4. 目前狀態(2026-06-14)

- ✅ **UI 改造完成**(Obsidian/Notion 殼:側邊欄樹、⌘K、hover 預覽、反向連結、屬性區、PingFang 中文、冷色 accent、網絡圖曲線連結+點陣底+去雜亂標籤)。
- ✅ **「章節閱讀」七章全部擴寫完成**:每章 6 小節、共 **42 節**,**全書 ~93,600 字**、84 個查證來源、320 個內文 autolink。
- **entities 229 筆、relations 304 條**(這次從 175/227 長到 229/304,+54 詞條/+77 關聯)。
- 零 console 錯誤、零斷裂關聯、零重複 id。五視圖(桌機/淺色/手機)+ 兩層大綱捲動高亮,皆 preview 實測過。
- 七章字數:C1 14.3k / C2 13.4k / C3 12.9k / C4 13.2k / C5 13.2k / C6 12.9k / C7 13.7k。

### 章節敘事主軸(接手前先讀,維持一致)
- 跨章伏線**刻意收束**:Sketchpad/Eastman→BIM;Gaudí 懸鏈→Block 找形;Price/Pask 控制論→智慧建築/NOX 水館;Negroponte 1967「協作者」+ SEEK 沙鼠→C7 收尾。
- 母題:**形式線 vs 資訊線**、**人步步後退/機器步步前進**、**思想早於工具**、**形式 vs 意義的落差**、**每波工具:解放→氾濫成套路→逼出意義追問**。
- 補了**台灣/亞洲脈絡**(袁烽、台灣建築教育、用在地資料對抗 AI 同質化)。
- C7 結尾**直接對設計科系學生喊話**:工具會過時,判斷與「為什麼」不會。

---

## 5. 章節寫作規格(若要再擴寫/新增,照這個)

1. **每個小節 ~2,500 字**。⚠️ **7–8 段只會到 ~1,700 字,要寫到 ~13 段才接近 2,500**(目前各節多落在 2,000–2,400,略低於整數,是已知可再加厚處)。
2. **做法:查證 + 附來源**。關鍵事實(年份、人名、主張)上網查證,章末列真實來源 URL。
3. **順手建詞條**:內文提到、資料庫還沒有的新詞 → 建成 entity(會自動進網絡/卡片/時間軸 + hover 預覽)。
   - **判斷準則**:只把「對脈絡是真節點」的新詞立成 entity;周邊人名(如 Minsky、Ward Cunningham、Frei Otto、Bruno de Finetti)留在內文不另立,免得網絡被邊緣節點灌爆。
4. 語氣:**夾敘夾議、給學生讀**,每節抓一個主題、開頭承上、結尾啟下(下一節 teaser)。

---

## 6. ★關鍵地雷(踩過,務必避開)

1. **autolink 比對的是 entity 的 `name` 完整字串**(在 chapters.js,長詞優先)。
   - 詞條 `name` **不要帶括號或後綴**,否則內文寫簡稱會對不上、不會變連結。
   - 實例:`"水館 (H2O eXPO)"` 內文寫「水館」→ 不連 → 已改名 `"水館"`。`"群集智能"` 內文寫「群集」→ 不連(首次出現要寫「群集智能」)。`"整合專案交付 IPD"` 同理。
2. **preview 快取雷**:python `http.server` 不送 `Cache-Control`,瀏覽器啟發式快取會讓改完 `entities.js`/`js`/`css` 後 **preview 仍顯示舊版**。
   - **驗證前一定先**:`Promise.all([fetch('data/entities.js',{cache:'reload'}), fetch('js/wiki.js',{cache:'reload'})]).then(()=>location.reload())` 再截圖/檢查。
3. **跨時代先驅的年份**:像 Gaudí(1882,放 P3)、Moretti(1960,P1)、Craig Reynolds(1986)、Karl Sims(1994)— 放在「故事被講到的那一期」,`year` 用真實年份,接受 timeline 排在該期最前(body 裡註明是先驅)。
4. **wiki.js OVERRIDES**:新詞條若撞名(Wesley Clark 將軍、John Walker、Craig Reynolds、Hugh Whitehead)→ 指定精確搜尋詞;若無乾淨維基條目(SEEK、巴塞隆納魚、DFAB House、ArchiGAN)→ 設 `null`(不顯示維基鈕,靠 sources)。
5. **C7 是 chapters 陣列最後一個**,物件結尾無逗號(`] }` 後直接 `]` `}`);改它時別多加逗號。

---

## 7. 驗證流程(每次改完都跑)

**A. node 檢查語法 + 字數 + 完整性**(在專案目錄):
```bash
node -e '
global.window={}; require("./data/entities.js"); const D=window.DATA;
console.log("解析 ✓ entities:",D.entities.length," relations:",D.relations.length);
const ids=new Set(D.entities.map(e=>e.id));
console.log("斷裂關聯:",D.relations.filter(r=>!ids.has(r.from)||!ids.has(r.to)).length,
            " 重複id:",D.entities.map(e=>e.id).filter((v,i,a)=>a.indexOf(v)!==i));
const c=D.chapters.find(x=>x.id==="C1");
c.sections.forEach(s=>{let n=s.heading.length;s.paragraphs.forEach(p=>n+=p.length);console.log(s.id,n,"字");});
'
```
**B. preview**:`preview_start name="static"` → 開 `localhost:4173/chapters.html` →(清快取,見地雷2)→ 檢查 `.ch-sub` 數、`.ch-inline` 連結、`preview_console_logs level=error` 應為空。

---

## 8. 下一步候選(待用戶選)

1. **配圖系統 + 放圖**(之前討論到一半):版面系統(caption/credit/響應式)**尚未建**,且要先定圖源 —— ① 我找免費授權圖(維基共享/公眾領域,附出處)+ 自製 SVG 示意圖 ② 全自製向量示意圖 ③ 用戶自己提供圖。**這些歷史題材多有版權,不能隨便抓圖**。
2. **逐章專業複核**:內容是 Claude 依知識 + 上網查證寫成,**部分年份取常見引用值、立場/用詞待用戶以建築專業核對**。
3. **字數補足**:把各節從 ~2,000–2,400 加厚到足 2,500(每節再補 1–3 段)。
4. **視覺再調**:若還要動字體/網絡圖節點/配色等。

---

## 9. 其他注意

- 另有一份**自動記憶**在 `~/.claude/projects/-Users-visionbase-lu-digitalArchitecture/memory/project_digital_architecture_site.md`,有更細的逐章時序記錄(同一台機器、同一專案會自動載入)。本檔是可隨 repo 攜帶的精華版。
- 內容語言:全站繁體中文 + 英文專有名詞;書名用《》、引號用「」(JS 字串以 `"` 為界,**內文別用半形 `"`** 以免破壞語法)。
- README.md 是更早期的專案說明,可能未反映最新狀態,以本檔為準。
