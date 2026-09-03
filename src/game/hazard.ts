/**
 * 火場危害系統 —— Death Zone 與濃煙區
 *
 * 設計原則（見 MAP_NOTES.md §8）：
 *   1. 火只是「會長大的圓」，不做流體模擬。教學上要的是「路被封了怎麼辦」，
 *      不是火場物理。圓形好懂、好調、好在 Debug Mode 裡驗證。
 *   2. 火不穿牆判定會讓參數變得極難調校，所以改用另一種保證：
 *      火源座標刻意選在「長大到最大半徑也咬不到玩家必經動線」的位置。
 *      任何改動火源座標的人，請回頭跑一次 config.ts 裡的檢查清單。
 *   3. 濃煙不會致命，只讓人看不見、走不快 —— 這才是真實火場裡多數人的處境。
 */
import type { Rect, Vec2 } from './types';

export interface FireSpec {
  id: string;
  /** 失敗畫面與教官檢討用的位置說明 */
  label: string;
  x: number;
  y: number;
  /** 開場當下的半徑（像素） */
  startRadius: number;
  /** 初期每秒擴張多少像素（封住樓梯的那一段，要快） */
  growthPxPerSec: number;
  /** 初期成長上限 */
  maxRadius: number;
  /**
   * 到達 maxRadius 之後的延燒速率（像素/秒）。
   * 真實火場不會燒到一半就定住 —— 這一段讓火持續逼近，
   * 學生每次回頭都會發現火又近了一點。留空 = 停在 maxRadius。
   */
  creepPxPerSec?: number;
  /**
   * 延燒的最終上限。這個數字是安全閥：只要它小於「火源到替代路線的距離」，
   * 火就永遠吃不掉學生的退路，不管這一局拖多久。
   */
  creepMaxRadius?: number;
}

export interface SmokeSpec {
  id: string;
  label: string;
  rect: Rect;
}

export interface HazardSet {
  fires: FireSpec[];
  smoke: SmokeSpec[];
}

/**
 * 某個火源在開場後 elapsedMs 毫秒時的半徑。
 *
 * 兩段式：先快速長到 maxRadius（封樓梯用），之後轉為慢速延燒直到 creepMaxRadius。
 * 分兩段而不是一路等速，是因為這兩段的目的完全不同 ——
 * 第一段要造成「最近的樓梯不能走」這個決策點，第二段只是要讓火別停下來。
 */
export function fireRadius(f: FireSpec, elapsedMs: number): number {
  const t = Math.max(0, elapsedMs) / 1000;
  const fast = f.startRadius + f.growthPxPerSec * t;
  if (fast < f.maxRadius) return fast;

  const creep = f.creepPxPerSec ?? 0;
  if (creep <= 0) return f.maxRadius;
  const tFull = (f.maxRadius - f.startRadius) / f.growthPxPerSec;
  const cap = f.creepMaxRadius ?? f.maxRadius;
  return Math.min(cap, f.maxRadius + creep * (t - tFull));
}

export interface ActiveFire extends FireSpec {
  r: number;
}

/** 取得目前所有火源的即時半徑 */
export function activeFires(hazards: HazardSet | undefined, elapsedMs: number): ActiveFire[] {
  if (!hazards) return [];
  return hazards.fires.map((f) => ({ ...f, r: fireRadius(f, elapsedMs) }));
}

/** 點是否落在任一火圈內 */
export function fireAt(fires: ActiveFire[], p: Vec2): ActiveFire | null {
  for (const f of fires) {
    if (Math.hypot(p.x - f.x, p.y - f.y) <= f.r) return f;
  }
  return null;
}

/**
 * 離最近火源還有多近，0 = 還很遠，1 = 已經在火裡。
 * 用來讓 HUD 在玩家逼近時先變色示警。
 */
export function fireProximity(fires: ActiveFire[], p: Vec2, warnRange: number): number {
  let worst = 0;
  for (const f of fires) {
    const gap = Math.hypot(p.x - f.x, p.y - f.y) - f.r;
    if (gap <= 0) return 1;
    worst = Math.max(worst, 1 - gap / warnRange);
  }
  return Math.max(0, Math.min(1, worst));
}

/** 矩形（樓梯間、出口）是否已被火勢覆蓋 —— 用來封鎖樓梯 */
export function rectHitByFire(fires: ActiveFire[], r: Rect): boolean {
  for (const f of fires) {
    const nx = Math.max(r.x, Math.min(f.x, r.x + r.w));
    const ny = Math.max(r.y, Math.min(f.y, r.y + r.h));
    if (Math.hypot(f.x - nx, f.y - ny) <= f.r) return true;
  }
  return false;
}

/** 點是否落在濃煙區內 */
export function smokeAt(hazards: HazardSet | undefined, p: Vec2): SmokeSpec | null {
  if (!hazards) return null;
  for (const s of hazards.smoke) {
    const { x, y, w, h } = s.rect;
    if (p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h) return s;
  }
  return null;
}
