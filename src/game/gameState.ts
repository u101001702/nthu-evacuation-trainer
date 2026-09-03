import { PX_PER_M } from './config';
import type { FloorId } from './types';

export type Phase = 'briefing' | 'playing' | 'escaped' | 'failed';

export interface GameStats {
  startedAt: number;
  endedAt: number | null;
  floorChanges: number;
  distancePx: number;
  visitedAreas: string[];
  wrongTurns: number;
  /** 逃生決策路徑（連續相同的區域會合併） */
  path: string[];
  exitUsed: string | null;
  exitFloor: FloorId | null;
  /** 訓練失敗時：被火困住的地點與樓層 */
  failedAt: { floor: string; area: string; fire: string } | null;
}

export function newStats(now: number): GameStats {
  return {
    startedAt: now,
    endedAt: null,
    floorChanges: 0,
    distancePx: 0,
    visitedAreas: [],
    wrongTurns: 0,
    path: [],
    exitUsed: null,
    exitFloor: null,
    failedAt: null,
  };
}

export function elapsedMs(stats: GameStats, now: number): number {
  return (stats.endedAt ?? now) - stats.startedAt;
}

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function metres(px: number): number {
  return px / PX_PER_M;
}

export interface StairPrompt {
  down: string | null;
  up: string | null;
  /** 這座樓梯已被火勢封閉 */
  blocked: boolean;
}

export interface HudSnapshot {
  floorName: string;
  locationLabel: string;
  locationShort: string;
  elapsedMs: number;
  prompt: StairPrompt | null;
  debug: boolean;
  phase: Phase;
  distanceM: number;
  floorChanges: number;
  playerX: number;
  playerY: number;
  fps: number;
  /** 0 = 安全，1 = 已經站在火裡。介於中間 = 逼近火場 */
  fireProximity: number;
  /** 火場耐受度已用掉的比例，0–1。滿了就失敗 */
  fireExposure: number;
  /** 目前是否身處濃煙 */
  inSmoke: boolean;
  /** 目前實際可視半徑（像素）—— 進了濃煙會變短 */
  sightRadius: number;
}
