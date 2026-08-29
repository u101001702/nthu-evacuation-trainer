/**
 * 教育館逃生訓練 — 成績後端（Google Apps Script）
 *
 * ── 安裝步驟（只要做一次）────────────────────────────────
 * 1. 開一個新的 Google Sheet，命名隨意（例如「教育館逃生訓練成績」）
 * 2. 在下方新增一個分頁，名稱一定要叫  逃生成績
 * 3. 上方選單：擴充功能 → Apps Script
 * 4. 把這整份檔案的內容貼上（覆蓋原本的 myFunction）
 * 5. 儲存（Cmd+S）
 * 6. 左側「編輯器」上方選 setupHeaders 這個函式 → 按「執行」→ 授權
 *    （會跳出「這個應用程式未經驗證」→ 進階 → 前往…（不安全）→ 允許）
 * 7. 右上「部署」→「新增部署作業」
 *      類型：網頁應用程式
 *      執行身分：我（你的 Google 帳號）
 *      具有存取權的使用者：所有人
 * 8. 點「部署」→ 複製「網頁應用程式」的網址
 * 9. 把網址填進遊戲的 src/config/backend.ts
 *
 * ⚠️ 之後每次改這份程式碼，都要「部署 → 管理部署作業 → 編輯(鉛筆) →
 *    版本選『新版本』→ 部署」，網址才會更新。
 */

const SHEET_NAME = '逃生成績';

/** A 時間戳記 B 場次 C 暱稱 D 出口 E 逃生秒數 F 移動距離 G 樓層切換 H 造訪區域 I 誤入房間 J 路線摘要 K 成績代碼 */
const HEADERS = [
  '時間戳記', '場次', '暱稱', '出口', '逃生秒數',
  '移動距離(m)', '樓層切換', '造訪區域', '誤入房間', '路線摘要', '成績代碼',
];

const COL_CODE = 11; // K

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 第一次安裝時執行一次，建立表頭 */
function setupHeaders() {
  const sheet = getSheet_();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#1f2937')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
}

/**
 * 讀成績。看板用這支。
 * 可選參數：?session=場次名稱  只回傳該場次
 */
function doGet(e) {
  try {
    const sheet = getSheet_();
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return jsonOut_({ success: true, rows: [] });

    const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
    const wanted = e && e.parameter ? e.parameter.session : '';

    const rows = [];
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      if (!v[10]) continue;                      // 沒有成績代碼視為無效列
      if (wanted && String(v[1]) !== wanted) continue;
      rows.push({
        time: formatCell_(v[0]),
        session: String(v[1] || ''),
        nickname: String(v[2] || ''),
        exit: String(v[3] || ''),
        seconds: Number(v[4]) || 0,
        distanceM: Number(v[5]) || 0,
        floorChanges: Number(v[6]) || 0,
        areasVisited: Number(v[7]) || 0,
        wrongTurns: Number(v[8]) || 0,
        route: String(v[9] || ''),
        code: String(v[10] || ''),
      });
    }
    return jsonOut_({ success: true, rows: rows });
  } catch (err) {
    return jsonOut_({ success: false, error: String(err) });
  }
}

function formatCell_(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
  }
  return String(v || '');
}

/**
 * 寫入一筆成績。
 * 以「成績代碼」做冪等判斷 —— 同一組代碼重複送出只會寫入一次，
 * 所以前端的離線佇列可以放心重傳。
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const data = JSON.parse(e.postData.contents);

    if (data.action !== 'submit') {
      return jsonOut_({ success: false, error: 'Unknown action: ' + data.action });
    }
    const r = data.result || {};
    if (!r.code) return jsonOut_({ success: false, error: 'missing code' });

    const sheet = getSheet_();
    if (sheet.getLastRow() === 0) setupHeaders();

    if (findCodeRow_(sheet, String(r.code)) > 0) {
      return jsonOut_({ success: true, duplicate: true });
    }

    const timestamp = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
    sheet.appendRow([
      timestamp,
      String(r.session || '未指定'),
      String(r.nickname || '匿名'),
      String(r.exit || ''),
      Number(r.seconds) || 0,
      Number(r.distanceM) || 0,
      Number(r.floorChanges) || 0,
      Number(r.areasVisited) || 0,
      Number(r.wrongTurns) || 0,
      String(r.route || ''),
      String(r.code),
    ]);

    return jsonOut_({ success: true });
  } catch (err) {
    return jsonOut_({ success: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/** 只掃最後 800 列，避免資料一多就變慢 */
function findCodeRow_(sheet, code) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const start = Math.max(2, lastRow - 799);
  const count = lastRow - start + 1;
  const codes = sheet.getRange(start, COL_CODE, count, 1).getValues();
  for (let i = 0; i < codes.length; i++) {
    if (String(codes[i][0]) === code) return start + i;
  }
  return 0;
}
