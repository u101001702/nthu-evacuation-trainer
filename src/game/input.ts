export interface Axis { x: number; y: number }

/**
 * 鍵盤 + 觸控搖桿。
 * 桌機：WASD / 方向鍵移動，E 或 Space 互動（下樓），Q 上樓，F2 Debug，R 重來。
 * 平板：畫面任一處拖曳 = 虛擬搖桿；互動按鈕由 HUD 提供。
 */
export class InputSystem {
  private keys = new Set<string>();
  private pointerId: number | null = null;
  private origin: Axis = { x: 0, y: 0 };
  private drag: Axis = { x: 0, y: 0 };

  onInteract: (() => void) | null = null;
  onAscend: (() => void) | null = null;
  onToggleDebug: (() => void) | null = null;
  onRestart: (() => void) | null = null;

  /** 觸控搖桿的視覺狀態，供 HUD 使用 */
  joystick: { active: boolean; ox: number; oy: number; dx: number; dy: number } = {
    active: false, ox: 0, oy: 0, dx: 0, dy: 0,
  };

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    const k = e.key.toLowerCase();
    if (k === 'f2') {
      e.preventDefault();
      this.onToggleDebug?.();
      return;
    }
    if (k === 'e' || k === ' ' || k === 'enter') {
      e.preventDefault();
      this.onInteract?.();
      return;
    }
    if (k === 'q') {
      e.preventDefault();
      this.onAscend?.();
      return;
    }
    if (k === 'r') {
      this.onRestart?.();
      return;
    }
    if (MOVE_KEYS.has(k)) e.preventDefault();
    this.keys.add(k);
  };

  private readonly handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key.toLowerCase());
  };

  private readonly handleBlur = (): void => {
    this.keys.clear();
    this.releasePointer();
  };

  private readonly handlePointerDown = (e: PointerEvent): void => {
    if (this.pointerId !== null) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    this.pointerId = e.pointerId;
    this.origin = { x: e.clientX, y: e.clientY };
    this.drag = { x: 0, y: 0 };
    this.joystick = { active: true, ox: e.clientX, oy: e.clientY, dx: 0, dy: 0 };
  };

  private readonly handlePointerMove = (e: PointerEvent): void => {
    if (this.pointerId !== e.pointerId) return;
    const dx = e.clientX - this.origin.x;
    const dy = e.clientY - this.origin.y;
    const max = 70;
    const len = Math.hypot(dx, dy);
    const s = len > max ? max / len : 1;
    this.drag = { x: dx * s, y: dy * s };
    this.joystick.dx = this.drag.x;
    this.joystick.dy = this.drag.y;
  };

  private readonly handlePointerUp = (e: PointerEvent): void => {
    if (this.pointerId !== e.pointerId) return;
    this.releasePointer();
  };

  private releasePointer(): void {
    this.pointerId = null;
    this.drag = { x: 0, y: 0 };
    this.joystick = { active: false, ox: 0, oy: 0, dx: 0, dy: 0 };
  }

  attach(target: HTMLElement): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    target.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
  }

  detach(target: HTMLElement): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    target.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
    this.keys.clear();
    this.releasePointer();
  }

  /** 回傳正規化的移動向量 */
  axis(): Axis {
    let x = 0;
    let y = 0;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;

    if (x === 0 && y === 0 && (this.drag.x !== 0 || this.drag.y !== 0)) {
      const len = Math.hypot(this.drag.x, this.drag.y);
      if (len > 12) {
        x = this.drag.x / 70;
        y = this.drag.y / 70;
      }
    }

    const len = Math.hypot(x, y);
    if (len > 1) return { x: x / len, y: y / len };
    return { x, y };
  }
}

const MOVE_KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);
