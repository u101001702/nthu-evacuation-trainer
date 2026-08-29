import { useState } from 'react';
import type { SessionInfo } from '../game/session';

interface Props {
  initial: SessionInfo;
  backendReady: boolean;
  pending: number;
  onConfirm: (session: string, nickname: string) => void;
}

export function SessionScreen({ initial, backendReady, pending, onConfirm }: Props) {
  const [session, setSession] = useState(initial.session);
  const [nickname, setNickname] = useState(initial.nickname);

  const nicknameOk = nickname.trim().length > 0;

  const submit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!nicknameOk) return;
    onConfirm(session.trim() || '未指定場次', nickname.trim());
  };

  return (
    <div className="overlay">
      <form className="panel session" onSubmit={submit}>
        <div className="session-tag">EDUCATION BUILDING · EVACUATION TRAINER</div>
        <h1>教育館逃生訓練</h1>
        <p className="session-lead">
          開始前先留下場次與暱稱，成績會上傳給教官做全班統計。<br />
          <b>不會收集真實姓名。</b>
        </p>

        <label className="field">
          <span className="field-label">
            場次
            {initial.locked && <em className="field-lock">已由教官指定</em>}
          </span>
          <input
            type="text"
            value={session}
            readOnly={initial.locked}
            onChange={(e) => setSession(e.target.value)}
            placeholder="例：20260915 醫學系五年級"
            maxLength={60}
          />
        </label>

        <label className="field">
          <span className="field-label">暱稱</span>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="隨便取一個，自己認得就好"
            maxLength={20}
            autoFocus={!initial.nickname}
          />
        </label>

        <div className="session-status">
          {!backendReady && <span className="dim">— 尚未設定成績後端，這次不會上傳</span>}
          {backendReady && pending > 0 && <span className="warn">⏳ 有 {pending} 筆舊成績待重傳，會在背景自動送出</span>}
          {backendReady && pending === 0 && <span className="ok">✓ 成績後端已連線</span>}
        </div>

        <button className="btn-primary" type="submit" disabled={!nicknameOk}>
          下一步
        </button>

        <div className="session-hint">
          教官：網址加 <code>?s=場次名稱</code> 可鎖定場次，加 <code>?dashboard</code> 開啟全班看板
        </div>
      </form>
    </div>
  );
}
