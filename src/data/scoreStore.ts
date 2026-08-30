import { isBackendConfigured } from '../config/backend';
import { googleSheetStore } from './stores/googleSheetStore';
import { localStore } from './stores/localStore';
import type { ScoreRecord, StoredScore } from './types';

export type StoreId = 'google-sheet' | 'local';

/**
 * 成績資料的存取介面。
 *
 * 遊戲與教官看板只認識這個介面，不知道背後是 Google Sheet 還是別的東西。
 * 日後要換成 Supabase / Postgres，只要新增一個實作並在 getScoreStore()
 * 加一個分支，upload.ts、Dashboard.tsx、遊戲引擎都不用改。
 */
export interface ScoreStore {
  readonly id: StoreId;
  /** 顯示在看板上，讓教官知道資料現在存在哪 */
  readonly label: string;
  /** 這個 store 是否已完成設定 */
  isConfigured(): boolean;
  /**
   * 寫入一筆成績。
   * 必須是冪等的 —— 以 code 為鍵，重複送出不得產生重複資料。
   * 失敗時要 throw，呼叫端才知道要排進離線佇列。
   */
  submit(record: ScoreRecord): Promise<void>;
  /** 讀出全部成績，新舊順序不拘，由呼叫端自行排序 */
  list(): Promise<StoredScore[]>;
}

/** 有設定後端就用 Google Sheet，否則退回本機儲存（成績不會遺失） */
export function getScoreStore(): ScoreStore {
  return isBackendConfigured() ? googleSheetStore : localStore;
}

export type { ScoreRecord, StoredScore };
