/**
 * 場次與暱稱。
 * 教官可以用網址參數 ?s=場次名稱 預先指定並鎖定，學生就不用自己打。
 * 不收真實姓名。
 */

export interface SessionInfo {
  session: string;
  nickname: string;
  /** 場次由網址指定 → 欄位唯讀 */
  locked: boolean;
}

const LS_KEY = 'evac_session_v1';

export function urlSession(): string | null {
  if (typeof window === 'undefined') return null;
  const p = new URLSearchParams(window.location.search);
  const v = p.get('s') ?? p.get('session');
  return v && v.trim() ? v.trim() : null;
}

export function loadSession(): SessionInfo {
  const fromUrl = urlSession();
  let saved: { session?: string; nickname?: string } = {};
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw) saved = JSON.parse(raw) as { session?: string; nickname?: string };
  } catch {
    /* 忽略 */
  }
  return {
    session: fromUrl ?? saved.session ?? '',
    nickname: saved.nickname ?? '',
    locked: fromUrl !== null,
  };
}

export function saveSession(info: { session: string; nickname: string }): void {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(info));
  } catch {
    /* 忽略 */
  }
}
