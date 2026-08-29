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

/** 玩家移動速度（公尺/秒）→ 一般成人快走 */
export const PLAYER_SPEED_MPS = 2.4;
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
} as const;
