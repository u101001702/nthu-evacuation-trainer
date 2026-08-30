/**
 * Google Apps Script 後端網址設定。
 *
 * 解析順序：
 *   1. 網址參數 ?api=...   （會自動存進 localStorage，方便臨時換後端測試）
 *   2. localStorage 的 evac_api
 *   3. 下面的 BUILT_IN_API_URL
 *
 * 沒設定時上傳功能會自動停用，遊戲照常可玩，不會報錯。
 */

/** ⬇️ Apps Script 部署後的「網頁應用程式」網址 */
export const BUILT_IN_API_URL =
  'https://script.google.com/macros/s/AKfycbzjr6nbZeUEnKMoX45H__oD8WxOUXN7FBp3Om0Jz0ag9wR-DhOL0Fg-V4ctTO-1yDY/exec';

const LS_KEY = 'evac_api';

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* 無痕模式可能停用 localStorage，忽略 */
  }
}

export function resolveApiUrl(): string {
  if (typeof window === 'undefined') return BUILT_IN_API_URL;
  const fromUrl = new URLSearchParams(window.location.search).get('api');
  if (fromUrl && fromUrl.trim()) {
    safeSet(LS_KEY, fromUrl.trim());
    return fromUrl.trim();
  }
  const saved = safeGet(LS_KEY);
  if (saved && saved.trim()) return saved.trim();
  return BUILT_IN_API_URL;
}

export function isBackendConfigured(): boolean {
  return resolveApiUrl().length > 0;
}
