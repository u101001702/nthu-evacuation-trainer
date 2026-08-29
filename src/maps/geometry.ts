import type { AreaDef, AreaKind, DoorSpec, Rect, Seg, Vec2 } from '../game/types';

/* ── 建築物共用幾何（三層共用，見 MAP_NOTES.md §2、§3） ───────────────── */

/** 建築外牆 */
export const SHELL: Rect = { x: 200, y: 200, w: 2200, h: 1900 };

/** 挑空（2F / 3F），1F 對應位置為開放大廳 */
export const WELL: Rect = { x: 1010, y: 900, w: 830, h: 520 };

/** 主樓梯（三層對齊，門一律開東側 x = 2130） */
export const ST_MAIN_RECT: Rect = { x: 1840, y: 900, w: 290, h: 240 };
export const ST_MAIN_DOOR_Y = 1020;

/** 西北室外逃生梯塔（建築物北側外） */
export const ST_NW_RECT: Rect = { x: 740, y: 20, w: 260, h: 180 };
/** 西南室外逃生梯塔（建築物南側外） */
export const ST_SW_RECT: Rect = { x: 740, y: 2100, w: 260, h: 180 };

/** 南北外牆上通往室外逃生梯 / 建築外的開口 */
export const NS_GATE = { from: 780, to: 980 };

/** 樓層切換後的落點 */
export const SPAWN_MAIN: Vec2 = { x: 1985, y: 1020 };
export const SPAWN_NW: Vec2 = { x: 870, y: 110 };
export const SPAWN_SW: Vec2 = { x: 870, y: 2190 };

/* ── 建構輔助函式 ─────────────────────────────────────────────────── */

/** 以左上 / 右下座標建立矩形 */
export function box(x0: number, y0: number, x1: number, y1: number): Rect {
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/**
 * 建立一個區域。座標一律用「左上 → 右下」四個數字，跟 MAP_NOTES.md 的表格一致。
 */
export function area(
  id: string,
  label: string,
  kind: AreaKind,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  doors: DoorSpec[] = [],
  short?: string,
  logName?: string,
): AreaDef {
  const def: AreaDef = { id, label, kind, rect: box(x0, y0, x1, y1), doors };
  if (short) def.short = short;
  if (logName) def.logName = logName;
  return def;
}

/** 走廊 / 大廳 / 室外：只畫地板，不長牆 */
export function open(
  id: string,
  label: string,
  kind: AreaKind,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  short?: string,
): AreaDef {
  const def: AreaDef = { id, label, kind, rect: box(x0, y0, x1, y1), openArea: true };
  if (short) def.short = short;
  return def;
}

/** 水平牆，可挖多個開口。gaps 為 [起, 迄] 的 x 區間 */
export function hWall(x0: number, x1: number, y: number, gaps: [number, number][] = []): Seg[] {
  return cut(x0, x1, gaps).map(([a, b]) => ({ x1: a, y1: y, x2: b, y2: y }));
}

/** 垂直牆，可挖多個開口。gaps 為 [起, 迄] 的 y 區間 */
export function vWall(y0: number, y1: number, x: number, gaps: [number, number][] = []): Seg[] {
  return cut(y0, y1, gaps).map(([a, b]) => ({ x1: x, y1: a, x2: x, y2: b }));
}

/** 把 [from, to] 區間依 gaps 切成數段 */
function cut(from: number, to: number, gaps: [number, number][]): [number, number][] {
  const sorted = gaps
    .map((g) => [Math.max(from, g[0]), Math.min(to, g[1])] as [number, number])
    .filter((g) => g[1] > g[0])
    .sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  let cursor = from;
  for (const g of sorted) {
    if (g[0] > cursor) out.push([cursor, g[0]]);
    cursor = Math.max(cursor, g[1]);
  }
  if (cursor < to) out.push([cursor, to]);
  return out;
}

/** 主樓梯區域定義（三層共用） */
export function mainStairArea(): AreaDef {
  const r = ST_MAIN_RECT;
  return area(
    'st_main',
    '樓梯',
    'stair',
    r.x,
    r.y,
    r.x + r.w,
    r.y + r.h,
    [{ side: 'E', at: ST_MAIN_DOOR_Y }],
    'Main Stairwell',
    '主樓梯',
  );
}
