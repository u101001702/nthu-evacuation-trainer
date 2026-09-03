import { formatTime, metres } from '../game/gameState';
import type { GameStats } from '../game/gameState';
import type { SessionInfo } from '../game/session';

interface Props {
  stats: GameStats;
  identity: SessionInfo;
  onRestart: () => void;
  onChangeIdentity: () => void;
}

/**
 * 訓練失敗畫面。
 *
 * 刻意不上傳成績 —— 排行榜只收成功撤離的紀錄，失敗留在這台裝置上檢討就好，
 * 免得學生為了不留下難看的紀錄而不敢嘗試不同路線。
 * 語氣也刻意不責備：重點是「下次先想第二條路」，不是「你死了」。
 */
export function FailScreen({ stats, identity, onRestart, onChangeIdentity }: Props) {
  const total = (stats.endedAt ?? Date.now()) - stats.startedAt;
  const path = compressPath(stats.path);
  const at = stats.failedAt;

  return (
    <div className="overlay">
      <div className="panel fail">
        <div className="rule rule-alert" />
        <h1 className="fail-en">TRAINING FAILED</h1>
        <h2 className="fail-zh">被火勢困住</h2>
        <p className="success-sub">
          {identity.nickname || '匿名'} · {identity.session || '未指定場次'}
        </p>

        <div className="fail-where">
          <div className="fail-where-label">被困位置</div>
          <strong>{at ? `${at.floor} ${at.area}` : '火場中'}</strong>
          {at && <span>起火點：{at.fire}</span>}
        </div>

        <div className="stat-grid">
          <Stat label="Survived" value={formatTime(total)} sub="撐了多久" />
          <Stat label="Distance Travelled" value={`${metres(stats.distancePx).toFixed(0)} m`} sub="移動距離" />
          <Stat label="Floor Changes" value={String(stats.floorChanges)} sub="次樓層切換" />
          <Stat
            label="Areas Visited"
            value={String(stats.visitedAreas.length)}
            sub={`造訪區域 · 誤入房間 ${stats.wrongTurns}`}
          />
        </div>

        <div className="decision">
          <div className="decision-title">你走過的路</div>
          <div className="decision-path">
            {path.map((p, i) => (
              <span key={`${p}-${i}`}>
                {p}
                {i < path.length - 1 && <i>→</i>}
              </span>
            ))}
          </div>
        </div>

        <p className="debrief">
          火場裡最危險的判斷，是<b>「已經走到一半了，衝過去應該還來得及」</b>。
          濃煙與熱氣往上竄得比人跑得快，一旦看見前方有火光，正確答案幾乎永遠是
          <b>掉頭找第二條路</b>，而不是加速通過。
          再想一次：離你最近的那座樓梯不能走的時候，第二座在哪個方向？
        </p>

        <div className="rule rule-alert" />
        <button className="btn-primary btn-retry" onClick={onRestart} autoFocus>
          再試一次
        </button>
        <button className="btn-link" onClick={onChangeIdentity}>
          更換場次 / 暱稱
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

/** 把連續重複的區域壓縮，讓路徑好讀 */
function compressPath(path: string[]): string[] {
  const out: string[] = [];
  for (const p of path) {
    if (out[out.length - 1] !== p) out.push(p);
  }
  if (out.length <= 14) return out;
  return [...out.slice(0, 6), `⋯ 中間 ${out.length - 12} 段 ⋯`, ...out.slice(-6)];
}
