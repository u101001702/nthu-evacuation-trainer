import { VISIBILITY_METRES, VISIBILITY_RADIUS } from '../game/config';
import { formatTime } from '../game/gameState';
import type { HudSnapshot } from '../game/gameState';

interface Props {
  hud: HudSnapshot;
  muted: boolean;
  isTouch: boolean;
  onToggleMute: () => void;
  onInteract: () => void;
  onAscend: () => void;
}

export function HUD({ hud, muted, isTouch, onToggleMute, onInteract, onAscend }: Props) {
  return (
    <>
      <div className="hud hud-tl">
        <div className="hud-building">EDUCATION BUILDING</div>
        <div className="hud-floor">Floor: <b>{hud.floorName}</b></div>
        <div className="hud-loc-label">Location</div>
        <div className="hud-loc">{hud.locationLabel}</div>
      </div>

      <div className="hud hud-tr">
        <div className="hud-emergency">⚠️ EMERGENCY</div>
        <div className="hud-timer">{formatTime(hud.elapsedMs)}</div>
        <div className="hud-mini">
          {hud.distanceM.toFixed(0)} m　·　樓層切換 {hud.floorChanges}
        </div>
        <button className="hud-mute" onClick={onToggleMute}>
          {muted ? '🔇 音效關' : '🔊 音效開'}
        </button>
      </div>

      {hud.prompt && (hud.prompt.down || hud.prompt.up) && (
        <div className="hud-prompt">
          {hud.prompt.down && <span><kbd>E</kbd> {hud.prompt.down}</span>}
          {hud.prompt.up && <span><kbd>Q</kbd> {hud.prompt.up}</span>}
        </div>
      )}

      <div className="hud hud-bottom">
        <span><kbd>WASD</kbd> 移動</span>
        <span><kbd>E</kbd> 互動</span>
        <span><kbd>Q</kbd> 上樓</span>
        <span><kbd>F2</kbd> Debug</span>
        <span><kbd>R</kbd> 重來</span>
      </div>

      {isTouch && (
        <div className="touch-actions">
          <button onClick={onAscend}>上樓</button>
          <button className="primary" onClick={onInteract}>互動 / 下樓</button>
        </div>
      )}

      {hud.debug && (
        <div className="hud hud-debug">
          <div className="hud-debug-title">DEBUG MODE（F2 關閉）</div>
          <div>floor: {hud.floorName}</div>
          <div>area: {hud.locationLabel}</div>
          <div>x: {hud.playerX}　y: {hud.playerY}</div>
          <div>visibility radius: {VISIBILITY_RADIUS} px（{VISIBILITY_METRES} m）</div>
          <div>distance: {hud.distanceM.toFixed(1)} m</div>
          <div>fps: {hud.fps}</div>
        </div>
      )}
    </>
  );
}
