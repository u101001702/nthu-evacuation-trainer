/**
 * 成績資料的形狀。
 * 這 11 個欄位就是 Google Sheet「逃生成績」分頁的 A–K 欄。
 * 任何 ScoreStore 實作都必須能存取這個形狀，換資料庫時不會動到它。
 */

/** 寫入時提供的欄位（時間戳由後端補） */
export interface ScoreRecord {
  /** 成績代碼，同時是冪等鍵。重複送出同一組代碼只會留下一筆 */
  code: string;
  session: string;
  nickname: string;
  exit: string;
  seconds: number;
  distanceM: number;
  floorChanges: number;
  areasVisited: number;
  wrongTurns: number;
  route: string;
}

/** 讀回來的成績，多一個時間戳 */
export interface StoredScore extends ScoreRecord {
  /** yyyy-MM-dd HH:mm:ss（台北時間） */
  time: string;
}

/** 台北時間的現在，格式與 Apps Script 寫入的一致 */
export function nowTaipei(): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Taipei',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).format(new Date());
  return parts.replace('T', ' ');
}
