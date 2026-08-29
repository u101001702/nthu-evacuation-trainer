import { isBackendConfigured, resolveApiUrl } from '../config/backend';

export interface ResultPayload {
  /** 成績代碼，同時是後端的冪等鍵 */
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

export type UploadStatus = 'disabled' | 'idle' | 'sending' | 'ok' | 'queued';

export interface UploadState {
  status: UploadStatus;
  /** 還沒送出去的筆數 */
  pending: number;
  error: string | null;
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
 * 送出一筆成績。
 * 用 text/plain 避開 CORS preflight —— Apps Script 不接受 OPTIONS。
 */
async function postResult(item: ResultPayload): Promise<void> {
  const url = resolveApiUrl();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'submit', result: item }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { success?: boolean; error?: string };
  if (!data.success) throw new Error(data.error ?? '後端回報失敗');
}

/**
 * 上傳服務：先入佇列再送，送失敗就留著，下次開遊戲自動再試。
 * 因為後端以成績代碼做冪等判斷，重複送出不會產生重複資料。
 */
export class UploadService {
  private listeners = new Set<(s: UploadState) => void>();
  private state: UploadState = { status: 'idle', pending: 0, error: null };
  private sending = false;
  private retryIndex = 0;
  private retryTimer: number | null = null;

  constructor() {
    this.state = {
      status: isBackendConfigured() ? 'idle' : 'disabled',
      pending: readQueue().length,
      error: null,
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
    if (!isBackendConfigured()) {
      this.emit({ status: 'disabled', pending: readQueue().length, error: null });
      return;
    }
    const queue = readQueue();
    if (queue.length === 0) {
      this.emit({ status: this.state.status === 'ok' ? 'ok' : 'idle', pending: 0, error: null });
      return;
    }

    this.sending = true;
    this.emit({ status: 'sending', pending: queue.length, error: null });
    try {
      for (const item of queue) {
        await postResult(item);
        writeQueue(readQueue().filter((x) => x.code !== item.code));
      }
      this.retryIndex = 0;
      this.emit({ status: 'ok', pending: 0, error: null });
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
