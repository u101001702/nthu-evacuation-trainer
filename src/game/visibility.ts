import { RAY_COUNT } from './config';
import type { Seg, Vec2 } from './types';
import type { SegmentIndex } from './mapBuilder';

/**
 * 以均勻射線計算可視多邊形。
 * 射線遇到牆就停 → 視野不會穿牆，這是本遊戲的核心訓練條件。
 */
export function computeVisibility(
  px: number,
  py: number,
  radius: number,
  index: SegmentIndex,
): Vec2[] {
  const near: Seg[] = index.query(px, py, radius + 4);
  const poly: Vec2[] = new Array<Vec2>(RAY_COUNT);

  for (let i = 0; i < RAY_COUNT; i++) {
    const ang = (i / RAY_COUNT) * Math.PI * 2;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    let best = radius;

    for (const s of near) {
      const sx = s.x2 - s.x1;
      const sy = s.y2 - s.y1;
      const denom = dx * sy - dy * sx;
      if (Math.abs(denom) < 1e-9) continue;
      const qx = s.x1 - px;
      const qy = s.y1 - py;
      const t = (qx * sy - qy * sx) / denom;
      if (t < 0 || t >= best) continue;
      const u = (qx * dy - qy * dx) / denom;
      if (u < 0 || u > 1) continue;
      best = t;
    }
    poly[i] = { x: px + dx * best, y: py + dy * best };
  }
  return poly;
}
