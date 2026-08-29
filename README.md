# 教育館逃生訓練 | Education Building Evacuation Trainer

🎮 **線上版：https://u101001702.github.io/nthu-evacuation-trainer/**
📊 教官看板：https://u101001702.github.io/nthu-evacuation-trainer/?dashboard

清華大學教育館 2D 俯視災害逃生訓練互動遊戲。
用於校園避難教育與第一線災害應變教學，**不是娛樂遊戲**。

玩家從 **3F 310 視聽教室** 出發，在只有 **5 公尺可視範圍**、**視線不穿牆** 的條件下，
自行判斷路線，經樓梯跨越 3F → 2F → 1F，抵達建築物外。

---

## 快速開始

```bash
npm install
npm run dev      # http://localhost:5178
```

```bash
npm run build    # 型別檢查 + 產出 dist/
npm run preview  # 預覽 build 結果
```

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

顯示牆體線段、房間邊界與 ID、玩家座標、樓梯區、出口區、可視半徑圓、可視多邊形、FPS。
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
| `index.html?s=20260915%20醫五` | 教官預先鎖定場次，學生只要填暱稱 |
| `index.html?dashboard` | 教官看板（全班分布，可直接投影） |
| `index.html?api=網址` | 臨時指定成績後端，會存進 localStorage |

### 一次性設定（焜哥做）

1. 開一個 Google Sheet，新增分頁 **`逃生成績`**
2. 擴充功能 → Apps Script → 貼上 `apps-script/Code.gs`
3. 選 `setupHeaders` 執行一次並授權（會跳「未經驗證」→ 進階 → 前往 → 允許）
4. 右上「部署」→「新增部署作業」→ 網頁應用程式
   · 執行身分：**我** · 存取權：**所有人**
5. 複製網址，填進 `src/config/backend.ts` 的 `BUILT_IN_API_URL`

> ⚠️ 之後每次改 `Code.gs`，要「部署 → 管理部署作業 → 編輯 → 版本選新版本 → 部署」

### Sheet 欄位

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| 時間戳記 | 場次 | 暱稱 | 出口 | 逃生秒數 | 移動距離(m) | 樓層切換 | 造訪區域 | 誤入房間 | 路線摘要 | 成績代碼 |

不收真實姓名，只收暱稱。

### Wi-Fi 掛掉時會怎樣

成績先寫進瀏覽器 `localStorage`，背景自動重傳（2s / 6s / 15s 三次退避）。
還是送不出去就留在佇列裡，**下次打開遊戲會自動補送**。
成功畫面同時顯示一組 **成績代碼**（例 `EVA-7K3Q`），最壞情況學生抄給教官人工補登。

後端以成績代碼做冪等判斷，所以重傳再多次都不會產生重複資料。

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
