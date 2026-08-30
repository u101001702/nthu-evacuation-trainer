import { useState } from 'react';
import { VISIBILITY_METRES } from '../game/config';
import type { SessionInfo } from '../game/session';

interface Props {
  initial: SessionInfo;
  backendReady: boolean;
  pending: number;
  onConfirm: (session: string, nickname: string) => void;
}

export function SessionScreen({ initial, backendReady, pending, onConfirm }: Props) {
  const [nickname, setNickname] = useState(initial.nickname);
  const nicknameOk = nickname.trim().length > 0;

  const submit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!nicknameOk) return;
    onConfirm(initial.session, nickname.trim());
  };

  return (
    <div className="overlay">
      <form className="panel session" onSubmit={submit}>
        <div className="session-tag">EDUCATION BUILDING · EVACUATION TRAINER</div>
        <h1>教育館逃生訓練</h1>
        <p className="session-lead">
          取一個暱稱就可以開始。成績會上傳給教官做全班統計。<br />
          <b>不會收集真實姓名。</b>
        </p>

        <label className="field">
          <span className="field-label">暱稱</span>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="隨便取一個，自己認得就好"
            maxLength={20}
            autoFocus
          />
        </label>

        <div className="session-meta">
          <span className="session-meta-label">場次</span>
          <span className="session-meta-value">{initial.session}</span>
          {initial.locked && <em className="field-lock">教官指定</em>}
        </div>

        <div className="session-status">
          {!backendReady && <span className="dim">— 尚未設定成績後端，這次不會上傳</span>}
          {backendReady && pending > 0 && (
            <span className="warn">⏳ 有 {pending} 筆舊成績待重傳，會在背景自動送出</span>
          )}
          {backendReady && pending === 0 && <span className="ok">✓ 成績後端已連線</span>}
        </div>

        <button className="btn-primary" type="submit" disabled={!nicknameOk}>
          下一步
        </button>

        <div className="session-hint">
          能見度約 {VISIBILITY_METRES} 公尺，視線不穿牆。<br />
          教官：網址加 <code>?s=場次名稱</code> 可指定場次，加 <code>?dashboard</code> 開啟全班看板
        </div>
      </form>
    </div>
  );
}
