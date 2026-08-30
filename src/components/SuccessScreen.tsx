import { Leaderboard } from './Leaderboard';
import type { ScoreRecord } from '../data/types';
import { formatTime, metres } from '../game/gameState';
import type { GameStats } from '../game/gameState';
import type { SessionInfo } from '../game/session';
import type { UploadState } from '../game/upload';

interface Props {
  stats: GameStats;
  identity: SessionInfo;
  scoreCode: string | null;
  /** 這次的成績，用來算排行榜名次 */
  record: ScoreRecord | null;
  upload: UploadState;
  onRetryUpload: () => void;
  onRestart: () => void;
  onChangeIdentity: () => void;
}

export function SuccessScreen({
  stats, identity, scoreCode, record, upload, onRetryUpload, onRestart, onChangeIdentity,
}: Props) {
  const total = (stats.endedAt ?? Date.now()) - stats.startedAt;
  const path = compressPath(stats.path);

  return (
    <div className="overlay">
      <div className="panel success">
        <div className="rule" />
        <h1 className="success-en">ESCAPE SUCCESS</h1>
        <h2 className="success-zh">成功撤離</h2>
        <p className="success-sub">
          {identity.nickname || '匿名'} · {identity.session || '未指定場次'}
        </p>

        <div className="stat-grid">
          <Stat label="Starting Point" value="Education Building 3F" sub="Room 310 視聽教室" />
          <Stat label="Exit" value="Outside 建築外" sub={stats.exitUsed ?? '—'} />
          <Stat label="Escape Time" value={formatTime(total)} sub="mm:ss" />
          <Stat label="Floor Changes" value={String(stats.floorChanges)} sub="次樓層切換" />
          <Stat label="Distance Travelled" value={`${metres(stats.distancePx).toFixed(0)} m`} sub="移動距離" />
          <Stat
            label="Areas Visited"
            value={String(stats.visitedAreas.length)}
            sub={`造訪區域 · 誤入房間 ${stats.wrongTurns}`}
          />
        </div>

        <UploadBar
          upload={upload}
          scoreCode={scoreCode}
          onRetry={onRetryUpload}
        />

        {record && (
          <Leaderboard
            mine={record}
            session={identity.session}
            uploadStatus={upload.status}
          />
        )}

        <div className="decision">
          <div className="decision-title">你的逃生決策</div>
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
          災害現場資訊永遠不完整。你剛才做的是一輪又一輪的
          <b> Observe → Orient → Decide → Act</b>：
          看到眼前這一小段、判斷方位、決定轉哪個彎、走出去，然後重來一次。
          回想一下 —— 如果今天是真的，你事先知道自己教室最近的兩座樓梯在哪裡嗎？
        </p>

        <div className="rule" />
        <button className="btn-primary" onClick={onRestart} autoFocus>
          重新挑戰
        </button>
        <button className="btn-link" onClick={onChangeIdentity}>
          更換場次 / 暱稱
        </button>
      </div>
    </div>
  );
}

function UploadBar({
  upload, scoreCode, onRetry,
}: { upload: UploadState; scoreCode: string | null; onRetry: () => void }) {
  const { status, pending, error } = upload;

  return (
    <div className={`upload-bar ${status}`}>
      <div className="upload-main">
        {status === 'local' && <span>✓ 成績已存在這台裝置（尚未連線後端）</span>}
        {status === 'sending' && <span>⏳ 上傳中…</span>}
        {status === 'ok' && <span>✓ 成績已上傳給教官 · {upload.storeLabel}</span>}
        {status === 'idle' && <span>⏳ 準備上傳…</span>}
        {status === 'queued' && (
          <span>
            ⏳ 上傳失敗，已排入佇列（{pending} 筆），會自動重傳
            {error && <em className="upload-err"> · {error}</em>}
          </span>
        )}
      </div>
      <div className="upload-side">
        {scoreCode && <span className="score-code">成績代碼 <b>{scoreCode}</b></span>}
        {status === 'queued' && (
          <button className="btn-tiny" onClick={onRetry}>立即重試</button>
        )}
      </div>
      {status === 'queued' && (
        <div className="upload-note">
          Wi-Fi 若一直連不上，把上面的成績代碼抄給教官人工補登即可。
        </div>
      )}
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
