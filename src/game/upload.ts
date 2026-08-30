import { getScoreStore } from '../data/scoreStore';
import type { ScoreRecord } from '../data/types';

/** 沿用舊名稱，避免呼叫端大改；實際形狀就是 ScoreRecord */
export type ResultPayload = ScoreRecord;

export type UploadStatus = 'local' | 'idle' | 'sending' | 'ok' | 'queued';

export interface UploadState {
  status: UploadStatus;
  /** 還沒送出去的筆數 */
  pending: number;
  error: string | null;
  /** 目前資料存在哪（Google Sheet / 本機） */
  storeLabel: string;
}

const QUEUE_KEY = 'evac_pending_v1';
const BACKOFF_MS = [2000, 6000, 15000];

/** 產生 EVA-XXXX 形式的成績代碼 */
export function makeScoreCode(): string {
  const t = Date.now().toString(36).slice(-3).toUpperCase();
  const r = Math.floor(Math.random() * 36).toString(36).toUpperCase();
  return `EVA-${t}${r}`;
}

function readQueue(): ResultPayload[] {
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ResultPayload[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: ResultPayload[]): void {
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    /* 忽略 */
  }
}

/**
 * 上傳服務：先入佇列再送，送失敗就留著，下次開遊戲自動再試。
 *
 * 這一層完全不知道資料最後存到哪裡 —— 只認識 ScoreStore 介面。
 * 因為 store 保證以成績代碼做冪等判斷，重複送出不會產生重複資料。
 */
export class UploadService {
  private listeners = new Set<(s: UploadState) => void>();
  private state: UploadState;
  private sending = false;
  private retryIndex = 0;
  private retryTimer: number | null = null;

  constructor() {
    const store = getScoreStore();
    this.state = {
      status: store.id === 'local' ? 'local' : 'idle',
      pending: readQueue().length,
      error: null,
      storeLabel: store.label,
    };
  }

  subscribe(cb: (s: UploadState) => void): () => void {
    this.listeners.add(cb);
    cb(this.state);
    return () => {
      this.listeners.delete(cb);
    };
  }

  getState(): UploadState {
    return this.state;
  }

  private emit(patch: Partial<UploadState>): void {
    this.state = { ...this.state, ...patch };
    for (const cb of this.listeners) cb(this.state);
  }

  /** 記錄一筆成績並嘗試送出（不阻塞畫面） */
  submit(item: ResultPayload): void {
    const q = readQueue();
    if (!q.some((x) => x.code === item.code)) {
      q.push(item);
      writeQueue(q);
    }
    this.retryIndex = 0;
    this.emit({ pending: q.length });
    void this.flush();
  }

  /** 嘗試把佇列清空 */
  async flush(): Promise<void> {
    if (this.sending) return;

    const store = getScoreStore();
    const queue = readQueue();
    if (queue.length === 0) {
      this.emit({
        status: store.id === 'local' ? 'local' : this.state.status === 'ok' ? 'ok' : 'idle',
        pending: 0,
        error: null,
        storeLabel: store.label,
      });
      return;
    }

    this.sending = true;
    this.emit({ status: 'sending', pending: queue.length, error: null, storeLabel: store.label });
    try {
      for (const item of queue) {
        await store.submit(item);
        writeQueue(readQueue().filter((x) => x.code !== item.code));
      }
      this.retryIndex = 0;
      this.emit({
        status: store.id === 'local' ? 'local' : 'ok',
        pending: 0,
        error: null,
      });
    } catch (err) {
      this.emit({
        status: 'queued',
        pending: readQueue().length,
        error: err instanceof Error ? err.message : String(err),
      });
      this.scheduleRetry();
    } finally {
      this.sending = false;
    }
  }

  private scheduleRetry(): void {
    if (this.retryTimer !== null) return;
    const delay = BACKOFF_MS[this.retryIndex];
    if (delay === undefined) return; // 三次都失敗就先放著，下次開遊戲再送
    this.retryIndex += 1;
    this.retryTimer = window.setTimeout(() => {
      this.retryTimer = null;
      void this.flush();
    }, delay);
  }

  dispose(): void {
    if (this.retryTimer !== null) window.clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.listeners.clear();
  }
}
