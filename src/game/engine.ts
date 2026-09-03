import {
  PLAYER_RADIUS, PLAYER_SPEED, TRANSITION_MS, VISIBILITY_RADIUS, ZOOM, DEBUG_MODE,
  FIRE_TOLERANCE_MS, FIRE_RECOVERY_RATE, FIRE_WARN_RANGE,
  SMOKE_VISIBILITY_RADIUS, SMOKE_SPEED_FACTOR,
} from './config';
import { FLOORS, START_FLOOR } from '../maps';
import { areaAt, compileFloor, rectContains, type CompiledFloor } from './mapBuilder';
import { resolveCollisions } from './collision';
import { computeVisibility } from './visibility';
import { applyCamera, FogSystem, type CameraView } from './fog';
import { renderFloor } from './renderer';
import { InputSystem } from './input';
import { AudioSystem } from './audio';
import {
  activeFires, fireAt, fireProximity, rectHitByFire, smokeAt, type ActiveFire,
} from './hazard';
import { elapsedMs, newStats, type GameStats, type HudSnapshot, type Phase, type StairPrompt } from './gameState';
import type { FloorId, Vec2 } from './types';

export interface TransitionState {
  label: string;
  fromName: string;
  toName: string;
  progress: number;
}

export class GameEngine {
  readonly input = new InputSystem();
  readonly audio = new AudioSystem();
  private readonly fog = new FogSystem();

  private floorId: FloorId = START_FLOOR;
  private floor: CompiledFloor = compileFloor(FLOORS[START_FLOOR]);
  private player: Vec2 = { x: 0, y: 0 };
  private facing = 0;
  private visPoly: Vec2[] = [];

  private phase: Phase = 'briefing';
  private debug = DEBUG_MODE;
  private stats: GameStats = newStats(0);

  /* ── 火場狀態 ──
   * hazardMs 是「開場後經過多久」，火勢半徑完全由它決定。
   * 刻意不用 performance.now()，才不會因為分頁被切到背景而讓火瞬間長大。 */
  private hazardMs = 0;
  private fires: ActiveFire[] = [];
  private fireExposureMs = 0;
  private inSmoke = false;
  private sightRadius = VISIBILITY_RADIUS;

  private transition: {
    fromName: string; toName: string; floor: FloorId; spawn: Vec2; t: number; applied: boolean;
  } | null = null;

  private fps = 0;
  private fpsAccum = 0;
  private fpsFrames = 0;

  onEscape: ((stats: GameStats) => void) | null = null;
  onFail: ((stats: GameStats) => void) | null = null;

  constructor() {
    this.input.onInteract = () => this.useStair('down');
    this.input.onAscend = () => this.useStair('up');
    this.input.onToggleDebug = () => { this.debug = !this.debug; };
    this.reset();
  }

  /* ── 生命週期 ────────────────────────────────────────────── */

  reset(): void {
    this.floorId = START_FLOOR;
    this.floor = compileFloor(FLOORS[START_FLOOR]);
    const spawn = this.floor.map.spawn ?? { x: 500, y: 500 };
    this.player = { ...spawn };
    this.facing = 0;
    this.visPoly = [];
    this.transition = null;
    this.phase = 'briefing';
    this.hazardMs = 0;
    this.fires = activeFires(this.floor.map.hazards, 0);
    this.fireExposureMs = 0;
    this.inSmoke = false;
    this.sightRadius = VISIBILITY_RADIUS;
    this.fog.reset();
    this.stats = newStats(performance.now());
    const a = areaAt(this.floor, this.player);
    if (a) {
      this.stats.visitedAreas.push(a.id);
      this.stats.path.push(`3F ${a.logName ?? a.label}`);
    }
  }

  start(): void {
    this.phase = 'playing';
    this.stats.startedAt = performance.now();
    this.audio.startAlarm();
  }

  dispose(): void {
    this.audio.dispose();
  }

  /* ── 主迴圈 ──────────────────────────────────────────────── */

  update(dtMs: number, now: number): void {
    this.fpsAccum += dtMs;
    this.fpsFrames += 1;
    if (this.fpsAccum >= 500) {
      this.fps = Math.round((this.fpsFrames * 1000) / this.fpsAccum);
      this.fpsAccum = 0;
      this.fpsFrames = 0;
    }

    if (this.transition) {
      this.transition.t += dtMs;
      if (!this.transition.applied && this.transition.t >= TRANSITION_MS * 0.5) {
        this.applyFloorChange();
      }
      if (this.transition.t >= TRANSITION_MS) this.transition = null;
    }

    if (this.phase === 'playing') {
      this.hazardMs += dtMs;
    }
    this.fires = activeFires(this.floor.map.hazards, this.hazardMs);
    this.inSmoke = smokeAt(this.floor.map.hazards, this.player) !== null;
    this.sightRadius = this.inSmoke ? SMOKE_VISIBILITY_RADIUS : VISIBILITY_RADIUS;

    if (this.phase === 'playing' && !this.transition) {
      this.movePlayer(dtMs, now);
      this.updateFireExposure(dtMs, now);
    }

    this.visPoly = computeVisibility(
      this.player.x, this.player.y, this.sightRadius, this.floor.index,
    );
    if (this.phase === 'playing' || this.phase === 'briefing') {
      this.fog.markExplored(this.floorId, this.floor.map.bounds, this.visPoly);
    }
  }

  /**
   * 站在火裡就開始倒數，退出來會回復。
   * 給緩衝而不是碰到就死，是因為真實火場裡人會本能退開 ——
   * 我們要訓練的是「發現不對就退回來」，不是懲罰一次失誤。
   */
  private updateFireExposure(dtMs: number, now: number): void {
    const burning = fireAt(this.fires, this.player) !== null;
    if (burning) {
      this.fireExposureMs += dtMs;
      this.audio.fireHiss(now);
      if (this.fireExposureMs >= FIRE_TOLERANCE_MS) this.fail();
      return;
    }
    this.fireExposureMs = Math.max(0, this.fireExposureMs - dtMs * FIRE_RECOVERY_RATE);
  }

  private fail(): void {
    if (this.phase !== 'playing') return;
    const f = fireAt(this.fires, this.player);
    const a = areaAt(this.floor, this.player);
    this.phase = 'failed';
    this.stats.endedAt = performance.now();
    this.stats.failedAt = {
      floor: this.floor.map.name,
      area: a?.logName ?? a?.label ?? '不明位置',
      fire: f?.label ?? '火場',
    };
    this.fog.setEnabled(false);
    this.audio.failure();
    this.onFail?.(this.stats);
  }

  private movePlayer(dtMs: number, now: number): void {
    const axis = this.input.axis();
    if (axis.x === 0 && axis.y === 0) return;

    this.facing = Math.atan2(axis.y, axis.x);
    // 濃煙裡只能低姿勢摸著牆走
    const speed = PLAYER_SPEED * (this.inSmoke ? SMOKE_SPEED_FACTOR : 1);
    const step = (speed * dtMs) / 1000;
    const before = { ...this.player };
    const target = { x: this.player.x + axis.x * step, y: this.player.y + axis.y * step };
    this.player = resolveCollisions(target, PLAYER_RADIUS, this.floor.index);

    const moved = Math.hypot(this.player.x - before.x, this.player.y - before.y);
    this.stats.distancePx += moved;
    if (moved > 0.5) this.audio.footstep(now, this.inSmoke);
    if (this.inSmoke) this.audio.breathing(now);

    this.trackArea();
    this.checkEscape();
  }

  private trackArea(): void {
    const a = areaAt(this.floor, this.player);
    if (!a) return;
    const floorName = this.floor.map.name;
    const entry = `${floorName} ${a.logName ?? a.label}`;
    if (this.stats.path[this.stats.path.length - 1] !== entry) this.stats.path.push(entry);
    if (!this.stats.visitedAreas.includes(a.id)) {
      this.stats.visitedAreas.push(a.id);
      if ((a.kind === 'room' || a.kind === 'service') && this.stats.visitedAreas.length > 1) {
        this.stats.wrongTurns += 1;
      }
    }
  }

  private checkEscape(): void {
    for (const ex of this.floor.map.exits) {
      if (!rectContains(ex.rect, this.player)) continue;
      this.phase = 'escaped';
      this.stats.endedAt = performance.now();
      this.stats.exitUsed = ex.label;
      this.stats.exitFloor = this.floorId;
      this.fog.setEnabled(false);
      this.audio.success();
      this.onEscape?.(this.stats);
      return;
    }
  }

  /* ── 樓梯 ────────────────────────────────────────────────── */

  /** 這座樓梯是否已被火勢吞掉 —— 被封的樓梯不能用，硬闖也下不去 */
  private stairBlocked(rect: { x: number; y: number; w: number; h: number }): boolean {
    return rectHitByFire(this.fires, rect);
  }

  private currentStair(): {
    down: StairPrompt['down'];
    up: StairPrompt['up'];
    blocked: boolean;
  } & {
    downTarget?: { floor: FloorId; spawn: Vec2; label: string };
    upTarget?: { floor: FloorId; spawn: Vec2; label: string };
  } | null {
    for (const st of this.floor.map.stairs) {
      if (!rectContains(st.rect, this.player)) continue;
      const blocked = this.stairBlocked(st.rect);
      const out: ReturnType<GameEngine['currentStair']> = {
        down: blocked ? null : st.down ? `前往 ${st.down.label}` : null,
        up: blocked ? null : st.up ? `前往 ${st.up.label}` : null,
        blocked,
      };
      if (blocked) return out;
      if (st.down && out) out.downTarget = st.down;
      if (st.up && out) out.upTarget = st.up;
      return out;
    }
    return null;
  }

  private useStair(dir: 'down' | 'up'): void {
    if (this.phase !== 'playing' || this.transition) return;
    const s = this.currentStair();
    if (!s || s.blocked) return;
    const target = dir === 'down' ? s.downTarget : s.upTarget;
    if (!target) return;
    this.transition = {
      fromName: this.floor.map.name,
      toName: FLOORS[target.floor].name,
      floor: target.floor,
      spawn: target.spawn,
      t: 0,
      applied: false,
    };
    this.audio.stairChange();
  }

  private applyFloorChange(): void {
    const t = this.transition;
    if (!t) return;
    t.applied = true;
    this.floorId = t.floor;
    this.floor = compileFloor(FLOORS[t.floor]);
    this.player = { ...t.spawn };
    this.stats.floorChanges += 1;
    this.trackArea();
    this.checkEscape();
  }

  /* ── 對外介面 ────────────────────────────────────────────── */

  interact(): void {
    this.useStair('down');
  }

  ascend(): void {
    this.useStair('up');
  }

  toggleDebug(): void {
    this.debug = !this.debug;
  }

  getStats(): GameStats {
    return this.stats;
  }

  getTransition(): TransitionState | null {
    if (!this.transition) return null;
    return {
      label: `${this.transition.fromName} → ${this.transition.toName}`,
      fromName: this.transition.fromName,
      toName: this.transition.toName,
      progress: Math.min(1, this.transition.t / TRANSITION_MS),
    };
  }

  snapshot(now: number): HudSnapshot {
    const a = areaAt(this.floor, this.player);
    const s = this.currentStair();
    return {
      floorName: this.floor.map.name,
      locationLabel: a?.label ?? '—',
      locationShort: a?.short ?? '—',
      elapsedMs: elapsedMs(this.stats, now),
      prompt: s ? { down: s.down, up: s.up, blocked: s.blocked } : null,
      debug: this.debug,
      phase: this.phase,
      distanceM: this.stats.distancePx / 45,
      floorChanges: this.stats.floorChanges,
      playerX: Math.round(this.player.x),
      playerY: Math.round(this.player.y),
      fps: this.fps,
      fireProximity: fireProximity(this.fires, this.player, FIRE_WARN_RANGE),
      fireExposure: Math.min(1, this.fireExposureMs / FIRE_TOLERANCE_MS),
      inSmoke: this.inSmoke,
      sightRadius: this.sightRadius,
    };
  }

  /* ── 繪製 ────────────────────────────────────────────────── */

  render(ctx: CanvasRenderingContext2D, cssW: number, cssH: number, dpr: number): void {
    const view: CameraView = {
      cx: this.player.x, cy: this.player.y, zoom: ZOOM, cssW, cssH, dpr,
    };

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, cssW * dpr, cssH * dpr);

    applyCamera(ctx, view);
    renderFloor(ctx, this.floor, {
      player: this.player,
      facing: this.facing,
      visPoly: this.visPoly,
      debug: this.debug,
      fogEnabled: this.phase === 'playing' || this.phase === 'briefing',
      fires: this.fires,
      sightRadius: this.sightRadius,
      timeMs: this.hazardMs,
    });

    this.fog.render(ctx, view, this.floorId, this.floor.map.bounds, this.visPoly);

    // 結束後（成功或失敗）移除黑幕，把全圖攤開來檢討，玩家標記重畫在最上層
    if (this.phase === 'escaped' || this.phase === 'failed') {
      applyCamera(ctx, view);
      renderFloor(ctx, this.floor, {
        player: this.player,
        facing: this.facing,
        visPoly: this.visPoly,
        debug: this.debug,
        fogEnabled: false,
        fires: this.fires,
        sightRadius: this.sightRadius,
        timeMs: this.hazardMs,
      });
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}
