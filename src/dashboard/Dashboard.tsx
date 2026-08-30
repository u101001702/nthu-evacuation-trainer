import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getScoreStore } from '../data/scoreStore';
import type { StoredScore } from '../data/types';
import { formatTime } from '../game/gameState';
import { BarList, Histogram, Scatter, type BarItem, type Point } from './charts';

/** 沿用舊名稱，形狀就是資料層的 StoredScore */
export type ScoreRow = StoredScore;

type LoadState = 'local' | 'loading' | 'ok' | 'error';

const REFRESH_MS = 15000;
const ALL = '全部場次';

/** 撤離路徑分類：以「最後使用的樓梯」為準，這是教學討論最關鍵的一張圖 */
export function classifyRoute(row: ScoreRow): string {
  const steps = row.route.split('→').map((s) => s.trim());
  let last = '';
  for (const s of steps) {
    if (s.includes('西北室外逃生梯')) last = '西北室外逃生梯';
    else if (s.includes('西南室外逃生梯')) last = '西南室外逃生梯';
    else if (s.includes('主樓梯')) last = '主樓梯';
  }
  if (last === '西北室外逃生梯' || last === '西南室外逃生梯') return last;
  const exit = row.exit.replace('建築外', '') || '其他';
  return `主樓梯 → ${exit}出口`;
}

export function Dashboard() {
  const store = useMemo(() => getScoreStore(), []);
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<string>(ALL);
  const [auto, setAuto] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string>('—');
  const timerRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await store.list();
      setRows(data);
      setState(store.id === 'local' ? 'local' : 'ok');
      setError(null);
      setUpdatedAt(new Date().toLocaleTimeString('zh-TW', { hour12: false }));
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [store]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!auto) return;
    timerRef.current = window.setInterval(() => void load(), REFRESH_MS);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [auto, load]);

  const sessions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.session) set.add(r.session);
    return [ALL, ...[...set].sort()];
  }, [rows]);

  const filtered = useMemo(
    () => (session === ALL ? rows : rows.filter((r) => r.session === session)),
    [rows, session],
  );

  const stats = useMemo(() => summarise(filtered), [filtered]);

  const routeItems: BarItem[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of filtered) {
      const key = classifyRoute(r);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const floorItems: BarItem[] = useMemo(() => {
    const counts = new Map<number, number>();
    for (const r of filtered) counts.set(r.floorChanges, (counts.get(r.floorChanges) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([k, v]) => ({ label: `${k} 次`, value: v }));
  }, [filtered]);

  const points: Point[] = useMemo(
    () => filtered.map((r) => ({ x: r.distanceM, y: r.seconds, label: r.nickname })),
    [filtered],
  );

  const ranking = useMemo(
    () => [...filtered].sort((a, b) => a.seconds - b.seconds).slice(0, 10),
    [filtered],
  );

  return (
    <div className="dash">
      <header className="dash-head">
        <div>
          <div className="dash-kicker">EDUCATION BUILDING · EVACUATION TRAINER</div>
          <h1>全班逃生表現看板</h1>
          <div className="dash-source">資料來源：{store.label}</div>
        </div>
        <div className="dash-controls">
          <select value={session} onChange={(e) => setSession(e.target.value)}>
            {sessions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button onClick={() => void load()}>立即更新</button>
          <label className="dash-auto">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
            自動更新
          </label>
          <span className="dash-updated">最後更新 {updatedAt}</span>
        </div>
      </header>

      {state === 'local' && (
        <Notice tone="warn">
          目前顯示的是<b>這台裝置</b>的本機紀錄，還沒連上 Google Sheet。
          依 <code>apps-script/Code.gs</code> 的說明部署 Apps Script 後，
          把網址填進 <code>src/config/backend.ts</code>（或在網址加 <code>?api=你的網址</code>），
          就會改讀全班資料。
        </Notice>
      )}
      {state === 'error' && <Notice tone="error">讀取失敗：{error}</Notice>}
      {(state === 'ok' || state === 'local') && filtered.length === 0 && (
        <Notice tone="dim">這個場次還沒有人完成。學生跑完就會自動出現在這裡。</Notice>
      )}

      <section className="dash-cards">
        <Card label="完成人數" value={String(stats.count)} sub="人" />
        <Card label="中位數時間" value={formatTime(stats.medianSec * 1000)} sub="mm:ss" />
        <Card label="最快" value={formatTime(stats.minSec * 1000)} sub={stats.fastest || '—'} />
        <Card label="最慢" value={formatTime(stats.maxSec * 1000)} sub={stats.slowest || '—'} />
        <Card label="平均移動距離" value={`${stats.avgDist.toFixed(0)} m`} sub="全班平均" />
      </section>

      <section className="dash-grid">
        <Panel title="撤離路徑選擇" hint="最多人走的那條，就是現場最會塞的那條">
          <BarList items={routeItems} />
        </Panel>
        <Panel title="逃生時間分布" hint="橫軸秒數，看全班的離散程度">
          <Histogram values={filtered.map((r) => r.seconds)} unit=" 秒" />
        </Panel>
        <Panel title="移動距離 vs 逃生時間" hint="右上角離群的點，就是迷路繞很多的人">
          <Scatter points={points} xLabel="公尺" yLabel="秒" />
        </Panel>
        <Panel title="樓層切換次數" hint="正常應為 2 次；偏多代表上下樓來回找路">
          <BarList items={floorItems} />
        </Panel>
      </section>

      <section className="dash-table">
        <h2>最快前 10 名</h2>
        <table>
          <thead>
            <tr>
              <th>#</th><th>暱稱</th><th>時間</th><th>距離</th><th>樓層切換</th><th>誤入房間</th><th>撤離路徑</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r, i) => (
              <tr key={r.code}>
                <td className="rank">{i + 1}</td>
                <td>{r.nickname}</td>
                <td className="mono">{formatTime(r.seconds * 1000)}</td>
                <td className="mono">{r.distanceM.toFixed(0)} m</td>
                <td className="mono">{r.floorChanges}</td>
                <td className="mono">{r.wrongTurns}</td>
                <td className="dim">{classifyRoute(r)}</td>
              </tr>
            ))}
            {ranking.length === 0 && (
              <tr><td colSpan={7} className="dim center">尚無資料</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Panel({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="dash-panel">
      <div className="dash-panel-title">{title}</div>
      <div className="dash-panel-hint">{hint}</div>
      {children}
    </div>
  );
}

function Card({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="dash-card">
      <div className="dash-card-label">{label}</div>
      <div className="dash-card-value">{value}</div>
      <div className="dash-card-sub">{sub}</div>
    </div>
  );
}

function Notice({ tone, children }: { tone: 'warn' | 'error' | 'dim'; children: React.ReactNode }) {
  return <div className={`dash-notice ${tone}`}>{children}</div>;
}

interface Summary {
  count: number;
  medianSec: number;
  minSec: number;
  maxSec: number;
  avgDist: number;
  fastest: string;
  slowest: string;
}

function summarise(rows: ScoreRow[]): Summary {
  if (rows.length === 0) {
    return { count: 0, medianSec: 0, minSec: 0, maxSec: 0, avgDist: 0, fastest: '', slowest: '' };
  }
  const sorted = [...rows].sort((a, b) => a.seconds - b.seconds);
  const mid = Math.floor(sorted.length / 2);
  const lo = sorted[mid - 1];
  const hi = sorted[mid];
  const median =
    sorted.length % 2 === 0 && lo && hi ? (lo.seconds + hi.seconds) / 2 : (hi ?? sorted[0]!).seconds;
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  return {
    count: rows.length,
    medianSec: median,
    minSec: first.seconds,
    maxSec: last.seconds,
    avgDist: rows.reduce((s, r) => s + r.distanceM, 0) / rows.length,
    fastest: first.nickname,
    slowest: last.nickname,
  };
}
