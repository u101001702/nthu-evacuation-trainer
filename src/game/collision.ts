import type { Seg, Vec2 } from './types';
import type { SegmentIndex } from './mapBuilder';

/** 點到線段的最近點 */
function closestPointOnSeg(px: number, py: number, s: Seg): Vec2 {
  const dx = s.x2 - s.x1;
  const dy = s.y2 - s.y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-9) return { x: s.x1, y: s.y1 };
  let t = ((px - s.x1) * dx + (py - s.y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return { x: s.x1 + t * dx, y: s.y1 + t * dy };
}

/**
 * 把玩家推出所有與之重疊的牆體。
 * 跑兩輪讓角落也能正確收斂，並自然產生「貼牆滑行」的手感。
 */
export function resolveCollisions(pos: Vec2, radius: number, index: SegmentIndex): Vec2 {
  let { x, y } = pos;
  for (let pass = 0; pass < 3; pass++) {
    const near = index.query(x, y, radius + 8);
    let moved = false;
    for (const s of near) {
      const cp = closestPointOnSeg(x, y, s);
      let dx = x - cp.x;
      let dy = y - cp.y;
      let dist = Math.hypot(dx, dy);
      if (dist >= radius) continue;
      if (dist < 1e-6) {
        // 剛好落在線上：沿線段法線推開
        const sx = s.x2 - s.x1;
        const sy = s.y2 - s.y1;
        const len = Math.hypot(sx, sy) || 1;
        dx = -sy / len;
        dy = sx / len;
        dist = 1e-6;
      } else {
        dx /= dist;
        dy /= dist;
      }
      const push = radius - dist;
      x += dx * push;
      y += dy * push;
      moved = true;
    }
    if (!moved) break;
  }
  return { x, y };
}
