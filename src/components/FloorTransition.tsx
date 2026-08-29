import type { TransitionState } from '../game/engine';

interface Props {
  state: TransitionState;
}

export function FloorTransition({ state }: Props) {
  // 0 → 0.5 淡入全黑，0.5 → 1 淡出
  const alpha = state.progress < 0.5 ? state.progress / 0.5 : (1 - state.progress) / 0.5;
  return (
    <div className="transition" style={{ opacity: Math.min(1, alpha * 1.15) }}>
      <div className="transition-inner">
        <div className="transition-building">EDUCATION BUILDING</div>
        <div className="transition-floors">{state.label}</div>
      </div>
    </div>
  );
}
