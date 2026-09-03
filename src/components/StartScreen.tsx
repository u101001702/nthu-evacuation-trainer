import { SMOKE_VISIBILITY_METRES, VISIBILITY_METRES } from '../game/config';

interface Props {
  onStart: () => void;
  nickname?: string;
}

export function StartScreen({ onStart, nickname }: Props) {
  return (
    <div className="overlay">
      <div className="panel briefing">
        <div className="briefing-tag">⚠️ 災害發生 · EMERGENCY</div>
        <h1>教育館內發生緊急事件</h1>

        <div className="briefing-where">
          <span className="briefing-where-label">
            {nickname ? `${nickname}，你目前位於` : '你目前位於'}
          </span>
          <strong>教育館 3F</strong>
          <strong>310 視聽教室</strong>
        </div>

        <p className="briefing-body">
          <b>你所在的教室已經起火</b>，火勢正在擴大，出口隨時可能被封住。<br />
          請盡快找到安全路線，離開建築物。<br />
          能見度極低，你只看得到身邊約 <b>{VISIBILITY_METRES} 公尺</b>。<br />
          沒有人會告訴你最佳路線 —— <b>你必須自行判斷方向</b>。
        </p>

        {/* 規則要先講清楚，學生才不會把「被燒到」誤會成程式壞掉 */}
        <ul className="briefing-rules">
          <li>
            <b>看到火就退回來。</b>踩進火場只撐得住幾秒，畫面會出現紅色警示條，
            燒完就是訓練失敗。
          </li>
          <li>
            <b>濃煙裡看不見也走不快。</b>能見度掉到約 {SMOKE_VISIBILITY_METRES} 公尺，
            腳步會變慢，但濃煙本身不會讓你失敗。
          </li>
        </ul>

        <div className="ooda">
          <span>Observe</span><i>→</i><span>Orient</span><i>→</i><span>Decide</span><i>→</i><span>Act</span>
        </div>

        <ul className="keys">
          <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 或 <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> 移動</li>
          <li><kbd>E</kbd> / <kbd>Space</kbd> 互動（下樓）　<kbd>Q</kbd> 上樓</li>
          <li><kbd>F2</kbd> Debug Mode　<kbd>R</kbd> 重新開始</li>
          <li>平板：在畫面上拖曳即可移動</li>
        </ul>

        <button className="btn-primary" onClick={onStart} autoFocus>
          開　始
        </button>
      </div>
    </div>
  );
}
