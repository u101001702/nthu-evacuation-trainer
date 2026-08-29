import { COLORS, EXPLORED_DARKNESS, EXPLORED_SCALE } from './config';
import type { FloorId, Rect, Vec2 } from './types';

export interface CameraView {
  /** 相機中心（世界座標） */
  cx: number;
  cy: number;
  zoom: number;
  /** 畫布 CSS 尺寸 */
  cssW: number;
  cssH: number;
  dpr: number;
}

/** 把世界座標的相機轉換套用到任一 context */
export function applyCamera(ctx: CanvasRenderingContext2D, view: CameraView): void {
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.translate(view.cssW / 2, view.cssH / 2);
  ctx.scale(view.zoom, view.zoom);
  ctx.translate(-view.cx, -view.cy);
}

/**
 * 三層黑幕：
 *   未探索 → 純黑
 *   已探索 → 非常暗（保留 EXPLORED_DARKNESS 的黑）
 *   目前視野 → 完全正常
 */
export class FogSystem {
  private explored = new Map<FloorId, HTMLCanvasElement>();
  private fog: HTMLCanvasElement | null = null;
  private enabled = true;

  setEnabled(v: boolean): void {
    this.enabled = v;
  }

  reset(): void {
    this.explored.clear();
    this.enabled = true;
  }

  private exploredCanvas(floorId: FloorId, bounds: Rect): HTMLCanvasElement {
    let c = this.explored.get(floorId);
    if (!c) {
      c = document.createElement('canvas');
      c.width = Math.ceil(bounds.w * EXPLORED_SCALE);
      c.height = Math.ceil(bounds.h * EXPLORED_SCALE);
      this.explored.set(floorId, c);
    }
    return c;
  }

  /** 把目前視野寫進「已探索」累積圖層 */
  markExplored(floorId: FloorId, bounds: Rect, poly: Vec2[]): void {
    if (poly.length < 3) return;
    const c = this.exploredCanvas(floorId, bounds);
    const g = c.getContext('2d');
    if (!g) return;
    g.setTransform(EXPLORED_SCALE, 0, 0, EXPLORED_SCALE, 0, 0);
    g.translate(-bounds.x, -bounds.y);
    g.fillStyle = '#ffffff';
    g.beginPath();
    const p0 = poly[0]!;
    g.moveTo(p0.x, p0.y);
    for (let i = 1; i < poly.length; i++) {
      const p = poly[i]!;
      g.lineTo(p.x, p.y);
    }
    g.closePath();
    g.fill();
  }

  /** 把黑幕疊到主畫布上 */
  render(
    target: CanvasRenderingContext2D,
    view: CameraView,
    floorId: FloorId,
    bounds: Rect,
    poly: Vec2[],
  ): void {
    if (!this.enabled) return;

    const devW = Math.max(1, Math.round(view.cssW * view.dpr));
    const devH = Math.max(1, Math.round(view.cssH * view.dpr));
    if (!this.fog) this.fog = document.createElement('canvas');
    if (this.fog.width !== devW || this.fog.height !== devH) {
      this.fog.width = devW;
      this.fog.height = devH;
    }
    const g = this.fog.getContext('2d');
    if (!g) return;

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.clearRect(0, 0, devW, devH);
    g.fillStyle = COLORS.fog;
    g.fillRect(0, 0, devW, devH);

    applyCamera(g, view);
    g.globalCompositeOperation = 'destination-out';

    // 已探索區域：挖掉一部分黑幕
    const ec = this.explored.get(floorId);
    if (ec) {
      g.globalAlpha = 1 - EXPLORED_DARKNESS;
      g.drawImage(ec, bounds.x, bounds.y, bounds.w, bounds.h);
    }

    // 目前視野：完全挖空
    if (poly.length >= 3) {
      g.globalAlpha = 1;
      g.beginPath();
      const p0 = poly[0]!;
      g.moveTo(p0.x, p0.y);
      for (let i = 1; i < poly.length; i++) {
        const p = poly[i]!;
        g.lineTo(p.x, p.y);
      }
      g.closePath();
      g.fill();
    }

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;

    target.save();
    target.setTransform(1, 0, 0, 1, 0, 0);
    target.globalAlpha = 1;
    target.drawImage(this.fog, 0, 0);
    target.restore();
  }
}
