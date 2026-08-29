import { COLORS, DOOR_WIDTH, LANDMARK_RANGE, VISIBILITY_RADIUS, WALL_THICKNESS } from './config';
import type { AreaDef, Vec2 } from './types';
import type { CompiledFloor } from './mapBuilder';

const FONT = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif';

function fillRect(ctx: CanvasRenderingContext2D, a: AreaDef, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(a.rect.x, a.rect.y, a.rect.w, a.rect.h);
}

function areaColor(a: AreaDef): string {
  switch (a.kind) {
    case 'corridor': return COLORS.corridor;
    case 'service': return COLORS.service;
    case 'stair': return COLORS.stair;
    case 'well': return COLORS.wellFill;
    case 'outside': return COLORS.outsideSafe;
    default: return COLORS.room;
  }
}

function drawWellHatch(ctx: CanvasRenderingContext2D, a: AreaDef): void {
  const { x, y, w, h } = a.rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = COLORS.wellHatch;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = -h; i < w; i += 44) {
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i + h, y + h);
  }
  ctx.stroke();
  // 對角線（呼應原圖挑空的 X 標記）
  ctx.strokeStyle = COLORS.wellHatch;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + w, y + h);
  ctx.moveTo(x + w, y); ctx.lineTo(x, y + h);
  ctx.stroke();
  ctx.restore();
}

function drawStairTreads(ctx: CanvasRenderingContext2D, a: AreaDef): void {
  const { x, y, w, h } = a.rect;
  ctx.save();
  ctx.strokeStyle = COLORS.stairLine;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const vertical = h >= w;
  const step = 34;
  if (vertical) {
    for (let ty = y + step; ty < y + h - 4; ty += step) {
      ctx.moveTo(x + 10, ty);
      ctx.lineTo(x + w - 10, ty);
    }
  } else {
    for (let tx = x + step; tx < x + w - 4; tx += step) {
      ctx.moveTo(tx, y + 10);
      ctx.lineTo(tx, y + h - 10);
    }
  }
  ctx.stroke();
  ctx.restore();
}

/** 房號牌：畫在門的內側，模擬真實門牌 */
function drawDoorPlates(ctx: CanvasRenderingContext2D, a: AreaDef): void {
  if (!a.doors || a.kind === 'corridor' || a.kind === 'stair') return;
  const { x, y, w, h } = a.rect;
  ctx.save();
  ctx.font = `600 13px ${FONT}`;
  ctx.fillStyle = COLORS.labelStrong;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const d of a.doors) {
    const off = 22;
    let px = 0;
    let py = 0;
    if (d.side === 'N') { px = d.at; py = y + off; }
    else if (d.side === 'S') { px = d.at; py = y + h - off; }
    else if (d.side === 'W') { px = x + off + 8; py = d.at; }
    else { px = x + w - off - 8; py = d.at; }
    ctx.fillText(a.label.split(' ')[0] ?? a.label, px, py);
  }
  ctx.restore();
}

export interface RenderOpts {
  player: Vec2;
  facing: number;
  visPoly: Vec2[];
  debug: boolean;
  fogEnabled: boolean;
}

export function renderFloor(
  ctx: CanvasRenderingContext2D,
  floor: CompiledFloor,
  opts: RenderOpts,
): void {
  const { map } = floor;

  // 建築物底色
  ctx.fillStyle = COLORS.building;
  ctx.fillRect(map.shell.x, map.shell.y, map.shell.w, map.shell.h);

  // 區域填色
  for (const a of map.areas) fillRect(ctx, a, areaColor(a));
  for (const a of map.areas) {
    if (a.kind === 'well') drawWellHatch(ctx, a);
    if (a.kind === 'stair') drawStairTreads(ctx, a);
  }

  // 柱子
  ctx.fillStyle = COLORS.column;
  for (const c of map.columns) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 門檻
  ctx.strokeStyle = COLORS.doorway;
  ctx.lineWidth = WALL_THICKNESS;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  for (const d of floor.doorways) {
    ctx.moveTo(d.x1, d.y1);
    ctx.lineTo(d.x2, d.y2);
  }
  ctx.stroke();

  // 牆
  ctx.strokeStyle = COLORS.wall;
  ctx.lineWidth = WALL_THICKNESS;
  ctx.lineCap = 'square';
  ctx.beginPath();
  for (const s of floor.walls) {
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2, s.y2);
  }
  ctx.stroke();

  // 房間名稱（中央）
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const a of map.areas) {
    if (a.kind === 'well') {
      ctx.font = `700 22px ${FONT}`;
      ctx.fillStyle = '#5c6b7a';
      ctx.fillText('挑空 WELL', a.rect.x + a.rect.w / 2, a.rect.y + a.rect.h / 2);
      continue;
    }
    if (a.kind === 'outside') {
      ctx.font = `700 26px ${FONT}`;
      ctx.fillStyle = '#7fd6a8';
      ctx.fillText('建築外 OUTSIDE', a.rect.x + a.rect.w / 2, a.rect.y + a.rect.h / 2);
      continue;
    }
    const big = Math.min(a.rect.w, a.rect.h) > 150;
    ctx.font = `${big ? 600 : 500} ${big ? 20 : 14}px ${FONT}`;
    ctx.fillStyle = a.kind === 'corridor' ? COLORS.label : COLORS.labelStrong;
    ctx.fillText(a.label, a.rect.x + a.rect.w / 2, a.rect.y + a.rect.h / 2);
  }

  for (const a of map.areas) drawDoorPlates(ctx, a);

  // 地標（要夠近、而且要在視線內才看得到 —— 隔著牆感覺不到出口）
  for (const lm of map.landmarks) {
    if (!inSight(opts.player, opts.visPoly, lm.x, lm.y)) continue;
    const tone =
      lm.tone === 'exit' ? '#1f7a55' : lm.tone === 'warn' ? '#b4592a' : '#2f4a63';
    ctx.font = `700 16px ${FONT}`;
    const tw = ctx.measureText(lm.text).width;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillRect(lm.x - tw / 2 - 10, lm.y - 15, tw + 20, 30);
    ctx.strokeStyle = tone;
    ctx.lineWidth = 2;
    ctx.strokeRect(lm.x - tw / 2 - 10, lm.y - 15, tw + 20, 30);
    ctx.fillStyle = tone;
    ctx.fillText(lm.text, lm.x, lm.y + 1);
  }

  if (opts.debug) drawDebug(ctx, floor, opts);

  drawPlayer(ctx, opts.player, opts.facing);
}

/**
 * 目標點是否在玩家目前的可視多邊形內。
 * visPoly 是以等角射線取樣出來的星狀多邊形，所以只要比對同一個角度的
 * 射線長度就夠了，不需要完整的 point-in-polygon。
 */
function inSight(player: Vec2, poly: Vec2[], tx: number, ty: number): boolean {
  const dx = tx - player.x;
  const dy = ty - player.y;
  const dist = Math.hypot(dx, dy);
  if (dist > LANDMARK_RANGE) return false;
  if (poly.length === 0) return dist <= LANDMARK_RANGE;

  let ang = Math.atan2(dy, dx);
  if (ang < 0) ang += Math.PI * 2;
  const idx = Math.round((ang / (Math.PI * 2)) * poly.length) % poly.length;
  const hit = poly[idx];
  if (!hit) return false;
  const rayLen = Math.hypot(hit.x - player.x, hit.y - player.y);
  // 留一點寬容值，讓貼在牆上的標示牌本身不會被自己的牆擋掉
  return dist <= rayLen + 10;
}

function drawPlayer(ctx: CanvasRenderingContext2D, p: Vec2, facing: number): void {
  ctx.save();
  ctx.translate(p.x, p.y);
  // 視線指向
  ctx.rotate(facing);
  ctx.fillStyle = 'rgba(30,136,229,0.25)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, 30, -0.55, 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.rotate(-facing);

  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.player;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.playerRing;
  ctx.stroke();
  ctx.restore();
}

function drawDebug(ctx: CanvasRenderingContext2D, floor: CompiledFloor, opts: RenderOpts): void {
  const { map } = floor;
  ctx.save();

  // 區域邊界 + ID
  ctx.strokeStyle = 'rgba(255,77,109,0.35)';
  ctx.lineWidth = 1.5;
  ctx.font = `600 12px ${FONT}`;
  ctx.fillStyle = COLORS.debug;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  for (const a of map.areas) {
    ctx.strokeRect(a.rect.x, a.rect.y, a.rect.w, a.rect.h);
    ctx.fillText(`${a.id} (${a.rect.x},${a.rect.y})`, a.rect.x + 5, a.rect.y + 4);
  }

  // 牆體線段
  ctx.strokeStyle = COLORS.debug;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const s of floor.walls) {
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2, s.y2);
  }
  ctx.stroke();

  // 樓梯區
  ctx.strokeStyle = '#00c2ff';
  ctx.lineWidth = 4;
  for (const st of map.stairs) ctx.strokeRect(st.rect.x, st.rect.y, st.rect.w, st.rect.h);

  // 出口區
  ctx.strokeStyle = '#3ddc84';
  for (const ex of map.exits) ctx.strokeRect(ex.rect.x, ex.rect.y, ex.rect.w, ex.rect.h);

  // 可視半徑與可視多邊形
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(opts.player.x, opts.player.y, VISIBILITY_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  if (opts.visPoly.length > 2) {
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const p0 = opts.visPoly[0]!;
    ctx.moveTo(p0.x, p0.y);
    for (const p of opts.visPoly) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.stroke();
  }

  // 門洞寬度標記
  ctx.fillStyle = '#00c2ff';
  ctx.font = `500 10px ${FONT}`;
  for (const d of floor.doorways) {
    ctx.fillText(`${DOOR_WIDTH}`, (d.x1 + d.x2) / 2 + 4, (d.y1 + d.y2) / 2 - 12);
  }

  ctx.restore();
}
