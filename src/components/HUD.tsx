import { SMOKE_VISIBILITY_METRES, VISIBILITY_METRES } from '../game/config';
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

      {hud.prompt?.blocked && (
        <div className="hud-prompt blocked">
          <span>⛔ 這座樓梯已被火勢封閉 · 另尋出路</span>
        </div>
      )}

      {hud.prompt && !hud.prompt.blocked && (hud.prompt.down || hud.prompt.up) && (
        <div className="hud-prompt">
          {hud.prompt.down && <span><kbd>E</kbd> {hud.prompt.down}</span>}
          {hud.prompt.up && <span><kbd>Q</kbd> {hud.prompt.up}</span>}
        </div>
      )}

      {/* 進了濃煙才會出現，提醒學生「看不見不是壞掉，是煙」 */}
      {hud.inSmoke && (
        <div className="hud-smoke">
          <span className="hud-smoke-icon">🌫</span>
          濃煙中 · 能見度剩約 {SMOKE_VISIBILITY_METRES} 公尺 · 放低姿勢前進
        </div>
      )}

      {/* 火場耐受度：一離開火就會回充，讓學生看得出退回來是有用的 */}
      {hud.fireExposure > 0 && (
        <div className="fire-alarm">
          <div className="fire-alarm-text">🔥 火場中 · 立刻退出</div>
          <div className="fire-alarm-bar">
            <i style={{ width: `${(1 - hud.fireExposure) * 100}%` }} />
          </div>
        </div>
      )}

      {/* 逼近火場時整個畫面邊緣泛紅，不用低頭看儀表也知道 */}
      {hud.fireProximity > 0 && (
        <div
          className="fire-vignette"
          style={{ opacity: 0.15 + hud.fireProximity * 0.75 }}
        />
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
          <div>
            sight radius: {hud.sightRadius.toFixed(0)} px（
            {(hud.sightRadius / 45).toFixed(1)} m / 常態 {VISIBILITY_METRES} m）
          </div>
          <div>in smoke: {hud.inSmoke ? 'YES' : 'no'}</div>
          <div>fire proximity: {hud.fireProximity.toFixed(2)}</div>
          <div>fire exposure: {(hud.fireExposure * 100).toFixed(0)}%</div>
          <div>distance: {hud.distanceM.toFixed(1)} m</div>
          <div>fps: {hud.fps}</div>
        </div>
      )}
    </>
  );
}
