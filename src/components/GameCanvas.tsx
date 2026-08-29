import { useEffect, useRef } from 'react';
import type { GameEngine, TransitionState } from '../game/engine';
import type { HudSnapshot } from '../game/gameState';

interface Props {
  engine: GameEngine;
  onHud: (h: HudSnapshot) => void;
  onTransition: (t: TransitionState | null) => void;
}

export function GameCanvas({ engine, onHud, onTransition }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    engine.input.attach(canvas);

    let raf = 0;
    let last = performance.now();
    let cssW = 0;
    let cssH = 0;
    let dpr = 1;

    const resize = (): void => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = Math.max(1, rect.width);
      cssH = Math.max(1, rect.height);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const loop = (now: number): void => {
      const dt = Math.min(50, now - last);
      last = now;
      engine.update(dt, now);
      engine.render(ctx, cssW, cssH, dpr);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const hudTimer = window.setInterval(() => {
      onHud(engine.snapshot(performance.now()));
      onTransition(engine.getTransition());
    }, 50);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(hudTimer);
      ro.disconnect();
      engine.input.detach(canvas);
    };
  }, [engine, onHud, onTransition]);

  return <canvas ref={canvasRef} className="game-canvas" />;
}
