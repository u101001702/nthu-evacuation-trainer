/**
 * 場次與暱稱。
 *
 * 學生只要填暱稱。場次不用填：
 *   1. 教官在網址加 ?s=場次名稱 → 用那個，欄位鎖定
 *   2. 沒指定 → 自動用當天日期（台北時間），教官看板仍可依日期分組
 *
 * 不收真實姓名。
 */

export interface SessionInfo {
  session: string;
  nickname: string;
  /** 場次由網址指定 */
  locked: boolean;
}

const LS_KEY = 'evac_session_v1';

interface Saved {
  session?: string;
  nickname?: string;
  /** 存檔當天的日期，用來判斷舊場次還能不能沿用 */
  savedOn?: string;
}

/** 台北時間的今天，格式 YYYY-MM-DD */
export function todayTaipei(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function urlSession(): string | null {
  if (typeof window === 'undefined') return null;
  const p = new URLSearchParams(window.location.search);
  const v = p.get('s') ?? p.get('session');
  return v && v.trim() ? v.trim() : null;
}

function readSaved(): Saved {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Saved) : {};
  } catch {
    return {};
  }
}

export function loadSession(): SessionInfo {
  const fromUrl = urlSession();
  const saved = readSaved();
  const today = todayTaipei();

  // 只沿用「今天」存下來的場次，避免上個月的成績被算進這次的班級
  const reusable = saved.savedOn === today && saved.session ? saved.session : null;

  return {
    session: fromUrl ?? reusable ?? today,
    nickname: saved.nickname ?? '',
    locked: fromUrl !== null,
  };
}

export function saveSession(info: { session: string; nickname: string }): void {
  try {
    const payload: Saved = { ...info, savedOn: todayTaipei() };
    window.localStorage.setItem(LS_KEY, JSON.stringify(payload));
  } catch {
    /* 忽略 */
  }
}
