# 教育館逃生訓練 | Education Building Evacuation Trainer

🎮 **線上版：https://u101001702.github.io/nthu-evacuation-trainer/**
📊 教官看板：https://u101001702.github.io/nthu-evacuation-trainer/?dashboard

清華大學教育館 2D 俯視災害逃生訓練互動遊戲。
用於校園避難教育與第一線災害應變教學，**不是娛樂遊戲**。

玩家從 **3F 310 視聽教室** 出發，在只有 **5 公尺可視範圍**、**視線不穿牆** 的條件下，
自行判斷路線，經樓梯跨越 3F → 2F → 1F，抵達建築物外。

**310 教室內已經起火**，火就在學生座位與教室上方那扇門之間。
火在第 **1.9 秒**封死上方門（學生腳程 2.4 秒，來不及），接著燒出教室、
切斷西側走廊北段，往北的路完全消失。活路只剩往南：西南室外逃生梯，
或南側走廊繞到東側走主樓梯 —— 那兩條路無論拖多久都不會被火封死。
而那條活路上鋪著**濃煙**（整條西側走廊與西南逃生梯口）：
能見度剩 2 公尺、腳步剩 78% —— 逃生不是找到門就結束，
是要在看不見的狀態下把整條路走完。
情境設定與參數見 **[MAP_NOTES.md §8](./MAP_NOTES.md)**。

---

## 快速開始

```bash
npm install
npm run dev      # http://localhost:5178
```

```bash
npm run build          # 型別檢查 + 產出 dist/
npm run preview        # 預覽 build 結果
npm run verify:hazard  # 驗證火場參數的四條安全界線
```

> ⚠️ 動到火源座標或半徑，**一定要跑 `npm run verify:hazard`**。
> 火勢不做穿牆判定，參數靠的是「火長到最大也咬不到必經動線」這個前提，
> 這支腳本會把那個前提逐條檢查給你看。

## 操作

| 按鍵 | 功能 |
|---|---|
| `W A S D` / `↑ ← ↓ →` | 移動 |
| `E` / `Space` / `Enter` | 互動 · 下樓 |
| `Q` | 上樓 |
| `F2` | Debug Mode 開關 |
| `R` | 重新開始 |
| 平板 | 在畫面上拖曳＝虛擬搖桿，右下角有互動按鈕 |

## Debug Mode（F2）

顯示牆體線段、房間邊界與 ID、玩家座標、樓梯區、出口區、可視半徑圓、可視多邊形、FPS，
以及**火場的實際致命判定圈**（橘色虛線）與**濃煙區邊界**。
畫面上的火焰外形會擺動，判定圈是正圓 —— 校正時看虛線那一圈。
用來對照 `public/reference/` 的原始平面圖校正地圖。

## 地圖校正

所有碰撞由程式資料定義，**不依賴圖片**。要調整空間配置只需改：

```
src/maps/floor1.ts
src/maps/floor2.ts
src/maps/floor3.ts
src/maps/geometry.ts   ← 三層共用的樓梯 / 挑空 / 外牆座標
```

判讀依據、完整座標表與尚待現地確認的項目，見 **[MAP_NOTES.md](./MAP_NOTES.md)**。

> ⚠️ 重要：3F 原始圖面相對 1F / 2F 旋轉 90°，本專案已做旋轉修正，
> 否則三座樓梯無法上下對齊。詳見 MAP_NOTES.md §1。

## 可調參數

`src/game/config.ts`

| 常數 | 預設 | 說明 |
|---|---|---|
| `PX_PER_M` | 45 | 1 公尺 = 幾像素 |
| `VISIBILITY_METRES` | 5 | **可視半徑（公尺）— 調難度改這個就好**，HUD 與開場說明會自動同步 |
| `ZOOM` | 1.3 | 相機縮放。改可視半徑時要一起調，讓亮圈裝得進畫面 |
| `PLAYER_SPEED_MPS` | 3.2 | 移動速度（公尺/秒） |
| `RAY_COUNT` | 220 | 視線射線數 |
| `EXPLORED_DARKNESS` | 0.68 | 已探索區域殘留的黑幕 |
| `DEBUG_MODE` | false | Debug 預設值 |

## 技術

React 18 · TypeScript (strict) · Vite 5 · HTML5 Canvas 2D · WebAudio
無遊戲引擎、無額外執行期相依。

---

## 成績上傳與教官看板

### 網址參數

| 網址 | 用途 |
|---|---|
| `index.html` | 學生玩 |
| `index.html?s=20260915%20醫五` | 指定場次名稱（不加也可以，見下方） |
| `index.html?dashboard` | 教官看板（全班分布，可直接投影） |
| `index.html?api=網址` | 臨時指定成績後端，會存進 localStorage |

### 資料層架構

遊戲與看板只認識 `src/data/scoreStore.ts` 的 `ScoreStore` 介面，
不知道背後是什麼。目前有兩個實作：

```
src/data/
├─ types.ts                    ScoreRecord / StoredScore（＝ Sheet 的 11 欄）
├─ scoreStore.ts               ScoreStore 介面 + getScoreStore()
└─ stores/
   ├─ googleSheetStore.ts      Apps Script（有設定後端時使用）
   └─ localStore.ts            localStorage（沒設定後端時的退路）
```

**要換成別的資料庫**（Supabase / Postgres / Firebase）時：
新增一個 `stores/xxxStore.ts` 實作同一個介面，在 `getScoreStore()` 加一個分支即可。
`upload.ts`、`Dashboard.tsx`、遊戲引擎、離線佇列、成績代碼機制**一行都不用改**。

沒設定後端時成績會存在瀏覽器本機，看板也讀得到 —— 部署前就能先確認看板長什麼樣。

### 一次性設定（焜哥做）

1. 開一個 Google Sheet，新增分頁 **`逃生成績`**
2. 擴充功能 → Apps Script → 貼上 `apps-script/Code.gs`
3. 選 `setupHeaders` 執行一次並授權（會跳「未經驗證」→ 進階 → 前往 → 允許）
4. 右上「部署」→「新增部署作業」→ 網頁應用程式
   · 執行身分：**我** · 存取權：**所有人**
5. 複製網址，填進 `src/config/backend.ts` 的 `BUILT_IN_API_URL`

### ⚠️ 已知限制：端點是公開的

Web App 的存取權必須設為「所有人」，學生才能不登入就上傳。
網站是純前端靜態頁，網址一定會出現在瀏覽器抓得到的地方 —— 這是無法避免的。

`Code.gs` 的 `validate_()` 會擋掉格式錯誤的垃圾資料（欄位長度、秒數與距離範圍），
但擋不了刻意搗亂。真的被灌水時，在 Apps Script 編輯器執行 `clearAllScores()`
即可清空重來（執行前先「檔案 → 建立副本」備份）。

### ⚠️ 試算表時區

建檔時 Google 會依連線位置推斷時區。請確認
**檔案 → 設定 → 時區** 設為 `(GMT+08:00) 台北`，否則 Sheet 裡看到的時間會偏移。

> ⚠️ 之後每次改 `Code.gs`，要「部署 → 管理部署作業 → 編輯 → 版本選新版本 → 部署」

### Sheet 欄位

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| 時間戳記 | 場次 | 暱稱 | 出口 | 逃生秒數 | 移動距離(m) | 樓層切換 | 造訪區域 | 誤入房間 | 路線摘要 | 成績代碼 |

### 場次怎麼決定

**學生只要填暱稱，不用填場次。** 場次由系統決定：

1. 網址有 `?s=場次名稱` → 用它，畫面上標「教官指定」
2. 沒有 → **自動用當天日期**（台北時間，例如 `2026-08-30`）

同一天內重新整理會沿用剛才的場次；**隔天自動換成新日期**，
避免上一梯次的成績被算進這次的班級。暱稱則一律記住。

不收真實姓名，只收暱稱。

### Wi-Fi 掛掉時會怎樣

成績先寫進瀏覽器 `localStorage`，背景自動重傳（2s / 6s / 15s 三次退避）。
還是送不出去就留在佇列裡，**下次打開遊戲會自動補送**。
成功畫面同時顯示一組 **成績代碼**（例 `EVA-7K3Q`），最壞情況學生抄給教官人工補登。

後端以成績代碼做冪等判斷，所以重傳再多次都不會產生重複資料。

### 學生端：成功畫面的本場次排行榜

逃生成功後，成績下方會顯示**同場次**的前 10 名（依逃生時間排序），
自己那一列會高亮並標示「你」。名次掉出前 10 名時，清單下方會以「⋯」
接上自己的實際名次。

上傳完成前會先用本機成績墊上去，所以名次立刻看得到；上傳成功後再抓一次
拿到權威名次。離線時也照樣顯示（只是清單只有本機資料）。

### 看板內容

摘要卡（完成人數 / 中位數 / 最快 / 最慢 / 平均距離）、
**撤離路徑選擇**（最重要的教學圖）、逃生時間分布、
移動距離 vs 逃生時間散布、樓層切換次數、最快前 10 名。
每 15 秒自動更新，可用場次篩選。

---

## 部署（GitHub Pages）

線上版放在 `gh-pages` 分支（build 產物），原始碼在 `main`。

改完程式要重新上線：

```bash
npm run build
touch dist/.nojekyll
cd dist
git add -A
git commit -m "Deploy: 說明這次改了什麼"
git push https://github.com/u101001702/nthu-evacuation-trainer.git gh-pages:gh-pages
```

`dist/` 內有一個獨立的 git repo 專門對應 `gh-pages` 分支，`dist` 本身在主 repo 是被忽略的。
推上去約 1 分鐘後線上版就會更新。

> 目前 `src/config/backend.ts` 的 `BUILT_IN_API_URL` 還是空的，
> 所以線上版暫時不會上傳成績。填好 Apps Script 網址後重新 build 部署即可；
> 在那之前可以用 `?api=你的網址` 臨時測試。

---

## 逃生路線（不會告訴學生）

有多條有效路線：
1. **主樓梯**：3F → 2F → 1F → 北 / 南 / 東側建築外
2. **西北室外逃生梯**：3F → 2F → 直接落地撤離
3. **西南室外逃生梯**：3F → 2F → 直接落地撤離

遊戲刻意不畫箭頭、不指路。
