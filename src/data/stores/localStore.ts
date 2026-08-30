import type { ScoreStore } from '../scoreStore';
import { nowTaipei, type ScoreRecord, type StoredScore } from '../types';

const KEY = 'evac_local_scores_v1';

/**
 * 本機儲存實作，用在還沒設定 Google Sheet 的時候。
 *
 * 兩個用途：
 *   1. 成績不會因為沒設後端就消失
 *   2. 讓教官在部署前就能打開看板確認長什麼樣
 *
 * 同時也是 ScoreStore 介面的第二個實作 —— 只有一個實作的介面等於沒驗證過。
 */
function read(): StoredScore[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredScore[]) : [];
  } catch {
    return [];
  }
}

function write(rows: StoredScore[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(rows));
  } catch {
    /* 無痕模式可能停用 localStorage */
  }
}

export const localStore: ScoreStore = {
  id: 'local',
  label: '本機（未連後端）',

  isConfigured(): boolean {
    return true; // 永遠可用
  },

  async submit(record: ScoreRecord): Promise<void> {
    const rows = read();
    if (rows.some((r) => r.code === record.code)) return; // 冪等
    rows.push({ time: nowTaipei(), ...record });
    write(rows);
  },

  async list(): Promise<StoredScore[]> {
    return read();
  },
};
