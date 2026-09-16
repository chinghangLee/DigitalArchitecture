# 編輯指南

想新增或修改網站內容,看這一份就夠。

## 核心:一份資料,四個視圖

**所有內容都在 [`data/entities.js`](data/entities.js)。** 改這一支,四個視圖會自動同步。結構:

```js
window.DATA = {
  periods:   [ { id, name, subtitle, years, color } ],          // 七個時期
  entities:  [ { id, type, name, nameEn, year, periodId,
                 summary, body } ],                              // 條目
  relations: [ { from, to, label } ],                           // 關聯(from/to 是 entity id)
  chapters:  [ { id, periodId, title, lead, paragraphs[] } ]    // 章節敘事
};
```

`type` 限五種:`person` / `tool` / `concept` / `project` / `lab`

## 新增一個條目

在 `entities` 陣列加一筆,`id` 不可重複,`periodId` 要對應到某個時期:

```js
{ id: "myId", type: "person", name: "中文名", nameEn: "English Name",
  year: 2015, periodId: "P5",
  summary: "一句話摘要(卡片與詳細視窗上方顯示)。",
  body: "完整段落說明。",
  img: "https://…/photo.jpg",       // 選用:詳細視窗會顯示這張圖
  refs: ["《某某著作》(2015)"] }     // 選用:詳細視窗顯示「延伸閱讀」清單
```

`img` 與 `refs` 都是選用欄位 — 沒有就不顯示。`refs` 也可放 `{ title, url }` 物件做成外連。

**長文與來源(逐條複核用):**
- `body` 可以是字串,也可以是**字串陣列**(多段落)— 寫深的詞條用陣列分段,詳細視窗會逐段呈現。
- `sources: [{ title, url }]` — 查證來源,詳細視窗會顯示「來源」編號清單(與「延伸閱讀」`refs` 分開)。

```js
{ id: "sutherland", type: "person", name: "Ivan Sutherland", … ,
  body: [ "第一段…", "第二段…", "第三段…" ],
  sources: [ { title: "Ivan Sutherland — Wikipedia", url: "https://en.wikipedia.org/wiki/Ivan_Sutherland" } ] }
```

## 新增一條關聯

```js
{ from: "lynn", to: "maya", label: "挪用" }   // Greg Lynn → 挪用 → Maya
```

label 沒有固定字典,中文動詞即可(創造/啟發/推動/使用/主持/影響/演化自…)。

## 新增/修改章節

改 `chapters` 裡對應那一章的 `lead`(導言)與 `paragraphs`(段落陣列)。內文裡只要打到某個 entity 的 `name` 或 `nameEn`,**該章第一次提到時會自動變成連結** — 不用手動加標記。

## 維基百科連結

詳細視窗的「維基百科 ↗」由 [`js/wiki.js`](js/wiki.js) 產生。

- 預設連**英文**維基(數位建築冷門詞條在中文維基覆蓋少)。要改成中文:把 `js/wiki.js` 的 `LANG` 改成 `"zh"`。
- 用 Wikipedia Special:Search 的 go 行為 — 精確標題直接跳轉,找不到退化成搜尋頁,**不會 404**。
- 名稱會撞名(Maya→馬雅文明、Rhino→犀牛)或無對應條目的,在 `wiki.js` 的 `OVERRIDES` map 指定搜尋詞,或設 `null` 不顯示連結。

## 改外觀

色彩、字型、間距都在 [`css/style.css`](css/style.css) 最上方的 `:root` 變數。時期色票 `--P1`…`--P7` 要與 `entities.js` 裡各時期的 `color` 對應。

## 改完後檢查

每次編輯 `entities.js` 後,跑一次完整性檢查(確認沒有打錯 id、沒有指向不存在的條目):

```
node check.mjs
```

## 檔案結構

```
digitalArchitecture/
├── index.html              首頁
├── timeline.html           時間軸視圖
├── network.html            關聯網絡視圖
├── cards.html              分類索引視圖
├── chapters.html           章節閱讀視圖
├── data/
│   └── entities.js         ← 全部內容在這
├── css/
│   └── style.css           共用樣式 + 設計變數
├── js/
│   ├── nav.js              共用導覽列
│   ├── wiki.js             維基百科連結 helper
│   ├── modal.js            共用詳細視窗(timeline/cards/chapters)
│   ├── timeline.js
│   ├── network.js
│   ├── cards.js
│   └── chapters.js
├── check.mjs               資料完整性檢查(node check.mjs)
├── EDITING.md              本檔
└── README.md
```

## 本機預覽(選用)

除了直接開檔,也可用簡單的靜態伺服器:

```
python3 -m http.server 4173
```
