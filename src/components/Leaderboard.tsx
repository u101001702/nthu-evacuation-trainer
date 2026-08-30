import { useCallback, useEffect, useMemo, useState } from 'react';
import { getScoreStore } from '../data/scoreStore';
import type { ScoreRecord, StoredScore } from '../data/types';
import { formatTime } from '../game/gameState';
import type { UploadStatus } from '../game/upload';

interface Props {
  /** 這次的成績，用來在清單還沒同步到自己時先墊上去 */
  mine: ScoreRecord;
  /** 只比同一場次 —— 那才是學生真正的比較對象 */
  session: string;
  /** 上傳成功後重新抓一次，拿到權威名次 */
  uploadStatus: UploadStatus;
}

type State = 'loading' | 'ok' | 'error';

const TOP_N = 10;

export function Leaderboard({ mine, session, uploadStatus }: Props) {
  const store = useMemo(() => getScoreStore(), []);
  const [rows, setRows] = useState<StoredScore[]>([]);
  const [state, setState] = useState<State>('loading');

  const load = useCallback(async () => {
    try {
      const all = await store.list();
      setRows(all);
      setState('ok');
    } catch {
      setState('error');
    }
  }, [store]);

  useEffect(() => {
    void load();
  }, [load]);

  // 上傳成功後再抓一次，這時清單才一定包含自己
  useEffect(() => {
    if (uploadStatus === 'ok') void load();
  }, [uploadStatus, load]);

  const { top, myRank, total } = useMemo(() => {
    const same = rows.filter((r) => r.session === session);
    // 清單還沒同步到自己時先墊上去，讓名次立刻看得到
    const merged = same.some((r) => r.code === mine.code)
      ? same
      : [...same, { time: '', ...mine }];
    merged.sort((a, b) => a.seconds - b.seconds);
    const idx = merged.findIndex((r) => r.code === mine.code);
    return { top: merged.slice(0, TOP_N), myRank: idx + 1, total: merged.length };
  }, [rows, session, mine]);

  const outsideTop = myRank > TOP_N;
  const me = outsideTop ? { ...mine, time: '' } : null;

  return (
    <div className="leaderboard">
      <div className="leaderboard-head">
        <span className="leaderboard-title">本場次排行榜</span>
        <span className="leaderboard-sub">
          {state === 'loading' && '載入中…'}
          {state === 'error' && '暫時讀不到（你的成績已保存）'}
          {state === 'ok' && `${session} · 共 ${total} 人完成 · 依逃生時間排序`}
        </span>
      </div>

      <ol className="leaderboard-list">
        {top.map((r, i) => (
          <Row key={r.code} rank={i + 1} row={r} isMe={r.code === mine.code} />
        ))}
        {outsideTop && me && (
          <>
            <li className="leaderboard-gap">⋯</li>
            <Row rank={myRank} row={me} isMe />
          </>
        )}
      </ol>

      {state === 'ok' && total === 1 && (
        <div className="leaderboard-note">
          這個場次目前只有你完成。等其他人跑完，這裡就會出現全班排名。
        </div>
      )}
    </div>
  );
}

function Row({ rank, row, isMe }: { rank: number; row: StoredScore | (ScoreRecord & { time: string }); isMe: boolean }) {
  return (
    <li className={`leaderboard-row${isMe ? ' me' : ''}`}>
      <span className="lb-rank">{rank}</span>
      <span className="lb-name">
        {row.nickname}
        {isMe && <em className="lb-you">你</em>}
      </span>
      <span className="lb-time">{formatTime(row.seconds * 1000)}</span>
      <span className="lb-dist">{Math.round(row.distanceM)} m</span>
    </li>
  );
}
