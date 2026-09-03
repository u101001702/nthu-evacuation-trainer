/**
 * 全域遊戲設定
 * 所有數值都集中在這裡，方便日後校正，不要散落在元件內。
 */

/** 1 公尺 = 幾個遊戲像素 */
export const PX_PER_M = 45;

/**
 * 玩家可視半徑（公尺）。
 * 這是全案唯一的來源 —— HUD、開場說明、Debug 面板都從這裡推導，
 * 想調難度只要改這一個數字。
 *   2 m = 濃煙／完全無照明（最難）
 *   5 m = 一般停電走廊，看得到眼前一小段（預設）
 */
export const VISIBILITY_METRES = 5;

/** 玩家可視半徑（像素） */
export const VISIBILITY_RADIUS = VISIBILITY_METRES * PX_PER_M;

/**
 * 相機縮放倍率（固定，確保地圖比例不因視窗大小變形）。
 * 需要讓可視圓完整放進畫面：VISIBILITY_RADIUS × ZOOM 要小於畫面高度的一半。
 * 225 px × 1.3 ≈ 292 px，1280×720 以上的螢幕都裝得下。
 */
export const ZOOM = 1.3;

/** 玩家碰撞半徑（像素） */
export const PLAYER_RADIUS = 13;

/** 玩家移動速度（公尺/秒）→ 疏散時的快步移動 */
export const PLAYER_SPEED_MPS = 3.2;
export const PLAYER_SPEED = PLAYER_SPEED_MPS * PX_PER_M;

/** 預設門洞寬度（像素）≈ 2.4 公尺 */
export const DOOR_WIDTH = 110;

/** 牆體繪製厚度（像素） */
export const WALL_THICKNESS = 7;

/** Fog of War 射線數量。愈多輪廓愈平滑，愈少效能愈好 */
export const RAY_COUNT = 220;

/** 已探索區域殘留的黑幕比例（0 = 全亮，1 = 全黑） */
export const EXPLORED_DARKNESS = 0.68;

/** 「已探索」圖層的解析度縮放（節省記憶體） */
export const EXPLORED_SCALE = 0.5;

/** Debug Mode 預設值。遊戲中按 F2 切換 */
export const DEBUG_MODE = false;

/** 樓層切換動畫時間（毫秒） */
export const TRANSITION_MS = 900;

/** 靠近多遠才會看到地標文字（像素）。同時必須在視線內，不會穿牆 */
export const LANDMARK_RANGE = VISIBILITY_RADIUS;

/** 配色（Professional Emergency Training 風格） */
export const COLORS = {
  void: '#0d1117',
  outside: '#1a2028',
  outsideSafe: '#20342b',
  building: '#dfe3e8',
  corridor: '#f2f4f7',
  room: '#e4e8ec',
  service: '#d7dce2',
  wellFill: '#151b23',
  wellHatch: '#2b333d',
  stair: '#cfe3d6',
  stairLine: '#6b8f7b',
  exit: '#2e7d5b',
  wall: '#3a4149',
  doorway: '#b9c2cb',
  label: '#5a646e',
  labelStrong: '#2c343c',
  player: '#1e88e5',
  playerRing: '#ffffff',
  fog: '#05070b',
  column: '#aab3bd',
  debug: '#ff4d6d',
  fireCore: '#ffe08a',
  fireMid: '#f4722b',
  fireEdge: '#a5261a',
  smoke: '#8d949c',
} as const;

/* ── 火場情境（3F 310 視聽教室內起火） ──────────────────────────
 *
 * 火起在學生座位的西北邊、緊鄰教室上方那扇門。第 2 秒就把上方門封死，
 * 接著燒出教室、切斷西側走廊北段。活路只剩往南：從下方門出去，
 * 走西南室外逃生梯，或南側走廊繞到東側走主樓梯。
 *
 * ⚠️ 改動火源座標或半徑前，這六條必須仍然成立
 *    （火源 560,560；座位 430,1010；上方門 700,800；下方門 700,1100）：
 *
 *   1. 開場當下學生就看得見火光 —— 看不見的火只會讓人往火裡亂撞。
 *   2. 上方門要在學生跑得到之前封死（實測 1.9 s vs 腳程 2.4 s），
 *      「往上走」才會真的不是一個選項。
 *   3. 下方門永遠不能被火碰到，那是唯一的活路。
 *   4. 學生至少要有 5 秒的反應時間，拖到那時才動身也走得出去。
 *   5. 火燒到頂時，教室至少還有 25% 的空間可躲。
 *   6. 往北要封得徹底 —— 走廊中線封住但貼著東牆能溜過去，等於沒封。
 *
 * 延燒上限 creepMaxRadius 落在一個很窄的窗口裡：要大於 442 px 才封得死
 * 西側走廊，又要小於 505 px 才碰不到下方門。動它之前先跑驗證腳本。
 *
 * 每一條都由 `npm run verify:hazard` 實際驗證，不是註解說了算。
 */

/** 玩家踩進火場後，撐得住幾毫秒。超過就訓練失敗 */
export const FIRE_TOLERANCE_MS = 4000;

/** 離開火場後，耐受度回復的倍率（1 = 進去多久就要退出來多久） */
export const FIRE_RECOVERY_RATE = 1.6;

/** HUD 開始示警的距離（像素）。距火緣多近就變紅 */
export const FIRE_WARN_RANGE = 260;

/** 濃煙中的可視半徑（公尺）—— 伸手才看得到 */
export const SMOKE_VISIBILITY_METRES = 2;
export const SMOKE_VISIBILITY_RADIUS = SMOKE_VISIBILITY_METRES * PX_PER_M;

/**
 * 濃煙中的移動速度倍率（低姿勢前進、摸牆走）。
 * 0.6 → 0.78：整條西側走廊都是煙之後，原本的 0.6 讓那段路變得太折磨，
 * 提高三成讓節奏回到「難走」而不是「卡住」。
 */
export const SMOKE_SPEED_FACTOR = 0.78;
