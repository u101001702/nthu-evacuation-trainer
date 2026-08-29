import { DOOR_WIDTH } from './config';
import type { AreaDef, FloorMap, Rect, Seg, Vec2 } from './types';
import { hWall, vWall } from '../maps/geometry';

/** 一段門洞，用於繪製門檻 */
export interface Doorway {
  x1: number; y1: number; x2: number; y2: number;
}

/** 空間分割格，避免每幀掃描全部牆體 */
export class SegmentIndex {
  private readonly cell = 220;
  private readonly buckets = new Map<string, Seg[]>();

  constructor(segments: Seg[]) {
    for (const s of segments) this.insert(s);
  }

  private key(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  private insert(s: Seg): void {
    const minX = Math.min(s.x1, s.x2);
    const maxX = Math.max(s.x1, s.x2);
    const minY = Math.min(s.y1, s.y2);
    const maxY = Math.max(s.y1, s.y2);
    const cx0 = Math.floor(minX / this.cell);
    const cx1 = Math.floor(maxX / this.cell);
    const cy0 = Math.floor(minY / this.cell);
    const cy1 = Math.floor(maxY / this.cell);
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cy = cy0; cy <= cy1; cy++) {
        const k = this.key(cx, cy);
        const list = this.buckets.get(k);
        if (list) list.push(s);
        else this.buckets.set(k, [s]);
      }
    }
  }

  /** 取出與指定方框可能相交的線段（去重） */
  query(x: number, y: number, r: number): Seg[] {
    const cx0 = Math.floor((x - r) / this.cell);
    const cx1 = Math.floor((x + r) / this.cell);
    const cy0 = Math.floor((y - r) / this.cell);
    const cy1 = Math.floor((y + r) / this.cell);
    const seen = new Set<Seg>();
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cy = cy0; cy <= cy1; cy++) {
        const list = this.buckets.get(this.key(cx, cy));
        if (!list) continue;
        for (const s of list) seen.add(s);
      }
    }
    return [...seen];
  }
}

export interface CompiledFloor {
  map: FloorMap;
  walls: Seg[];
  index: SegmentIndex;
  doorways: Doorway[];
  /** 面積由小到大排序，供「玩家在哪個區域」查詢 */
  areasByArea: AreaDef[];
}

function doorSpans(a: AreaDef): Record<'N' | 'S' | 'E' | 'W', [number, number][]> {
  const g: Record<'N' | 'S' | 'E' | 'W', [number, number][]> = { N: [], S: [], E: [], W: [] };
  for (const d of a.doors ?? []) {
    const w = d.width ?? DOOR_WIDTH;
    g[d.side].push([d.at - w / 2, d.at + w / 2]);
  }
  return g;
}

function areaWalls(a: AreaDef): Seg[] {
  if (a.openArea) return [];
  const { x, y, w, h } = a.rect;
  const g = doorSpans(a);
  return [
    ...hWall(x, x + w, y, g.N),
    ...hWall(x, x + w, y + h, g.S),
    ...vWall(y, y + h, x, g.W),
    ...vWall(y, y + h, x + w, g.E),
  ];
}

function areaDoorways(a: AreaDef): Doorway[] {
  if (a.openArea) return [];
  const { x, y, w, h } = a.rect;
  const out: Doorway[] = [];
  for (const d of a.doors ?? []) {
    const dw = d.width ?? DOOR_WIDTH;
    const a0 = d.at - dw / 2;
    const a1 = d.at + dw / 2;
    if (d.side === 'N') out.push({ x1: a0, y1: y, x2: a1, y2: y });
    else if (d.side === 'S') out.push({ x1: a0, y1: y + h, x2: a1, y2: y + h });
    else if (d.side === 'W') out.push({ x1: x, y1: a0, x2: x, y2: a1 });
    else out.push({ x1: x + w, y1: a0, x2: x + w, y2: a1 });
  }
  return out;
}

/** 柱子以正方形近似，同時作為碰撞與遮蔽 */
function columnWalls(c: { x: number; y: number; r: number }): Seg[] {
  const { x, y, r } = c;
  return [
    { x1: x - r, y1: y - r, x2: x + r, y2: y - r },
    { x1: x - r, y1: y + r, x2: x + r, y2: y + r },
    { x1: x - r, y1: y - r, x2: x - r, y2: y + r },
    { x1: x + r, y1: y - r, x2: x + r, y2: y + r },
  ];
}

const cache = new Map<string, CompiledFloor>();

export function compileFloor(map: FloorMap): CompiledFloor {
  const cached = cache.get(map.id);
  if (cached) return cached;

  const walls: Seg[] = [];
  const doorways: Doorway[] = [];
  for (const a of map.areas) {
    walls.push(...areaWalls(a));
    doorways.push(...areaDoorways(a));
  }
  walls.push(...map.extraWalls);
  for (const c of map.columns) walls.push(...columnWalls(c));

  const areasByArea = [...map.areas].sort(
    (p, q) => p.rect.w * p.rect.h - q.rect.w * q.rect.h,
  );

  const compiled: CompiledFloor = {
    map,
    walls,
    index: new SegmentIndex(walls),
    doorways,
    areasByArea,
  };
  cache.set(map.id, compiled);
  return compiled;
}

export function rectContains(r: Rect, p: Vec2): boolean {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

/** 玩家目前所在區域（取包含點且面積最小者） */
export function areaAt(floor: CompiledFloor, p: Vec2): AreaDef | null {
  for (const a of floor.areasByArea) {
    if (a.kind === 'well') continue;
    if (rectContains(a.rect, p)) return a;
  }
  return null;
}
