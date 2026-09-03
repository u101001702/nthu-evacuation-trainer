/**
 * 以 WebAudio 合成的極簡音效。
 * 只有：低沉警報、腳步、樓梯切換、火焰、濃煙中的呼吸、成功與失敗提示。
 * 刻意不加槍聲 / 爆炸 / 恐怖音效 —— 這是教育訓練工具。
 */
export class AudioSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private alarmTimer: number | null = null;
  private muted = false;
  private lastStep = 0;
  private lastHiss = 0;
  private lastBreath = 0;

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

  /** 濃煙裡的腳步放慢、放輕 —— 低姿勢摸著牆走 */
  footstep(now: number, inSmoke = false): void {
    const gap = inSmoke ? 560 : 340;
    if (now - this.lastStep < gap) return;
    this.lastStep = now;
    this.tone(90 + Math.random() * 25, 0.07, 'triangle', inSmoke ? 0.06 : 0.09);
  }

  /** 站在火裡的劈啪聲，同時是「你正在被燒」的聽覺警告 */
  fireHiss(now: number): void {
    if (now - this.lastHiss < 220) return;
    this.lastHiss = now;
    this.tone(60 + Math.random() * 90, 0.16, 'sawtooth', 0.07);
    this.tone(1400 + Math.random() * 700, 0.05, 'square', 0.02, 0.03);
  }

  /** 濃煙中的呼吸聲：吸一口、吐一口，約 2.6 秒一輪 */
  breathing(now: number): void {
    if (now - this.lastBreath < 2600) return;
    this.lastBreath = now;
    this.tone(230, 0.42, 'sine', 0.05);
    this.tone(165, 0.55, 'sine', 0.045, 0.6);
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

  /** 訓練失敗：兩聲下墜的低音，不做恐怖音效 */
  failure(): void {
    this.stopAlarm();
    this.tone(220, 0.7, 'sine', 0.16);
    this.tone(146.83, 1.1, 'sine', 0.15, 0.3);
    this.tone(110, 1.4, 'sine', 0.12, 0.65);
  }

  dispose(): void {
    this.stopAlarm();
    if (this.ctx) void this.ctx.close();
    this.ctx = null;
    this.master = null;
  }
}
