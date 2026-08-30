import { isBackendConfigured, resolveApiUrl } from '../../config/backend';
import type { ScoreStore } from '../scoreStore';
import type { ScoreRecord, StoredScore } from '../types';

/**
 * Google Apps Script Web App 實作。
 *
 * 寫入用 text/plain 避開 CORS preflight —— Apps Script 不接受 OPTIONS。
 * 冪等由後端負責：doPost 會比對成績代碼，重複的直接回 duplicate。
 */
export const googleSheetStore: ScoreStore = {
  id: 'google-sheet',
  label: 'Google Sheet',

  isConfigured(): boolean {
    return isBackendConfigured();
  },

  async submit(record: ScoreRecord): Promise<void> {
    const res = await fetch(resolveApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'submit', result: record }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { success?: boolean; error?: string };
    if (!data.success) throw new Error(data.error ?? '後端回報失敗');
  },

  async list(): Promise<StoredScore[]> {
    const res = await fetch(resolveApiUrl(), { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as {
      success?: boolean;
      rows?: StoredScore[];
      error?: string;
    };
    if (!data.success) throw new Error(data.error ?? '後端回報失敗');
    return data.rows ?? [];
  },
};
