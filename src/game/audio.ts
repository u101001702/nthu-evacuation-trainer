/**
 * 以 WebAudio 合成的極簡音效。
 * 只有：低沉警報、腳步、樓梯切換、成功提示。
 * 刻意不加槍聲 / 爆炸 / 恐怖音效 —— 這是教育訓練工具。
 */
export class AudioSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private alarmTimer: number | null = null;
  private muted = false;
  private lastStep = 0;

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  setMuted(v: boolean): void {
    this.muted = v;
    if (this.master) this.master.gain.value = v ? 0 : 0.5;
  }

  isMuted(): boolean {
    return this.muted;
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, delay = 0): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  /** 低沉的兩聲警報，每 2.8 秒一次 */
  startAlarm(): void {
    this.ensure();
    if (this.alarmTimer !== null) return;
    const beep = (): void => {
      this.tone(196, 0.5, 'sine', 0.16);
      this.tone(147, 0.6, 'sine', 0.14, 0.55);
    };
    beep();
    this.alarmTimer = window.setInterval(beep, 2800);
  }

  stopAlarm(): void {
    if (this.alarmTimer !== null) {
      window.clearInterval(this.alarmTimer);
      this.alarmTimer = null;
    }
  }

  footstep(now: number): void {
    if (now - this.lastStep < 340) return;
    this.lastStep = now;
    this.tone(90 + Math.random() * 25, 0.07, 'triangle', 0.09);
  }

  stairChange(): void {
    this.tone(330, 0.18, 'sine', 0.14);
    this.tone(247, 0.28, 'sine', 0.14, 0.16);
  }

  success(): void {
    this.stopAlarm();
    this.tone(523.25, 0.5, 'sine', 0.16);
    this.tone(659.25, 0.5, 'sine', 0.15, 0.14);
    this.tone(783.99, 0.8, 'sine', 0.15, 0.28);
  }

  dispose(): void {
    this.stopAlarm();
    if (this.ctx) void this.ctx.close();
    this.ctx = null;
    this.master = null;
  }
}
