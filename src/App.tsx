import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { SessionScreen } from './components/SessionScreen';
import { StartScreen } from './components/StartScreen';
import { SuccessScreen } from './components/SuccessScreen';
import { FloorTransition } from './components/FloorTransition';
import { GameEngine, type TransitionState } from './game/engine';
import { metres, type GameStats, type HudSnapshot } from './game/gameState';
import { loadSession, saveSession, type SessionInfo } from './game/session';
import { makeScoreCode, UploadService, type ResultPayload, type UploadState } from './game/upload';
import { isBackendConfigured } from './config/backend';

type UiPhase = 'session' | 'briefing' | 'playing' | 'escaped';

export default function App() {
  const engineRef = useRef<GameEngine | null>(null);
  if (!engineRef.current) engineRef.current = new GameEngine();
  const engine = engineRef.current;

  const uploadRef = useRef<UploadService | null>(null);
  if (!uploadRef.current) uploadRef.current = new UploadService();
  const upload = uploadRef.current;

  const [phase, setPhase] = useState<UiPhase>('session');
  const [identity, setIdentity] = useState<SessionInfo>(() => loadSession());
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [transition, setTransition] = useState<TransitionState | null>(null);
  const [finalStats, setFinalStats] = useState<GameStats | null>(null);
  const [scoreCode, setScoreCode] = useState<string | null>(null);
  const [lastRecord, setLastRecord] = useState<ResultPayload | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>(upload.getState());
  const [muted, setMuted] = useState(false);

  const identityRef = useRef(identity);
  identityRef.current = identity;

  const isTouch = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
    [],
  );

  /* 上傳狀態訂閱 + 開場先把上次沒送出去的成績補送 */
  useEffect(() => {
    const off = upload.subscribe(setUploadState);
    void upload.flush();
    return () => {
      off();
      upload.dispose();
    };
  }, [upload]);

  const restart = useCallback(() => {
    engine.reset();
    setFinalStats(null);
    setScoreCode(null);
    setLastRecord(null);
    setPhase('briefing');
    setTransition(null);
  }, [engine]);

  useEffect(() => {
    engine.onEscape = (stats) => {
      const snapshot: GameStats = {
        ...stats,
        path: [...stats.path],
        visitedAreas: [...stats.visitedAreas],
      };
      const code = makeScoreCode();
      setFinalStats(snapshot);
      setScoreCode(code);
      setPhase('escaped');

      const id = identityRef.current;
      const record: ResultPayload = {
        code,
        session: id.session || '未指定場次',
        nickname: id.nickname || '匿名',
        exit: snapshot.exitUsed ?? '',
        seconds: Math.round(((snapshot.endedAt ?? Date.now()) - snapshot.startedAt) / 1000),
        distanceM: Math.round(metres(snapshot.distancePx)),
        floorChanges: snapshot.floorChanges,
        areasVisited: snapshot.visitedAreas.length,
        wrongTurns: snapshot.wrongTurns,
        route: snapshot.path.join('→').slice(0, 500),
      };
      setLastRecord(record);
      upload.submit(record);
    };
    engine.input.onRestart = () => restart();
    return () => {
      engine.onEscape = null;
      engine.input.onRestart = null;
    };
  }, [engine, restart, upload]);

  useEffect(() => () => engine.dispose(), [engine]);

  const confirmIdentity = useCallback((session: string, nickname: string) => {
    saveSession({ session, nickname });
    setIdentity({ session, nickname, locked: identityRef.current.locked });
    setPhase('briefing');
  }, []);

  const start = useCallback(() => {
    engine.start();
    setPhase('playing');
  }, [engine]);

  const toggleMute = useCallback(() => {
    const next = !engine.audio.isMuted();
    engine.audio.setMuted(next);
    setMuted(next);
  }, [engine]);

  return (
    <div className="app">
      <GameCanvas engine={engine} onHud={setHud} onTransition={setTransition} />

      {phase === 'playing' && hud && (
        <HUD
          hud={hud}
          muted={muted}
          isTouch={isTouch}
          onToggleMute={toggleMute}
          onInteract={() => engine.interact()}
          onAscend={() => engine.ascend()}
        />
      )}

      {transition && <FloorTransition state={transition} />}

      {phase === 'session' && (
        <SessionScreen
          initial={identity}
          backendReady={isBackendConfigured()}
          pending={uploadState.pending}
          onConfirm={confirmIdentity}
        />
      )}

      {phase === 'briefing' && <StartScreen onStart={start} nickname={identity.nickname} />}

      {phase === 'escaped' && finalStats && (
        <SuccessScreen
          stats={finalStats}
          identity={identity}
          scoreCode={scoreCode}
          record={lastRecord}
          upload={uploadState}
          onRetryUpload={() => void upload.flush()}
          onRestart={restart}
          onChangeIdentity={() => setPhase('session')}
        />
      )}
    </div>
  );
}
