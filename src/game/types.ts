export type FloorId = 'floor1' | 'floor2' | 'floor3';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

/** 零厚度牆體線段。碰撞與視線都以此為基礎 */
export interface Seg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type Side = 'N' | 'S' | 'E' | 'W';

/** 門洞規格：在某一面牆的 `at` 位置開一個寬 `width` 的開口 */
export interface DoorSpec {
  side: Side;
  /** N/S 面為 x 座標，E/W 面為 y 座標 */
  at: number;
  width?: number;
}

export type AreaKind =
  | 'room'      // 一般房間（教室、研究室）
  | 'service'   // 廁所、機房、茶水間等服務空間
  | 'corridor'  // 走廊、大廳、前室
  | 'stair'     // 樓梯間
  | 'well'      // 挑空（不可通行）
  | 'outside';  // 建築物外

export interface AreaDef {
  id: string;
  /** 顯示名稱，例如「310 視聽教室」 */
  label: string;
  /** HUD 短標籤，例如「Room 310」 */
  short?: string;
  /**
   * 統計與逃生路徑紀錄用的名稱，預設等於 label。
   * 樓梯在畫面上一律只寫「樓梯」，不讓學生看出哪一座是室外逃生梯；
   * 但資料層仍要保留身分，教官看板的「撤離路徑選擇」才分得出來。
   */
  logName?: string;
  kind: AreaKind;
  rect: Rect;
  /** 有牆的區域才需要；走廊 / 大廳 / 室外不長牆 */
  doors?: DoorSpec[];
  /** true = 此區域不產生牆體（走廊、大廳、室外） */
  openArea?: boolean;
}

export interface StairDef {
  id: string;
  label: string;
  rect: Rect;
  /** 往下一層 */
  down?: { floor: FloorId; spawn: Vec2; label: string };
  /** 往上一層 */
  up?: { floor: FloorId; spawn: Vec2; label: string };
}

export interface ExitDef {
  id: string;
  label: string;
  rect: Rect;
}

export interface Landmark {
  x: number;
  y: number;
  text: string;
  tone?: 'exit' | 'stair' | 'warn';
}

export interface FloorMap {
  id: FloorId;
  /** 顯示名稱：3F / 2F / 1F */
  name: string;
  /** 相機與探索圖層的世界邊界 */
  bounds: Rect;
  /** 建築物外框（用於繪製底色） */
  shell: Rect;
  areas: AreaDef[];
  /** 額外牆體（外殼補牆、挑空邊界、柱子等） */
  extraWalls: Seg[];
  /** 圓形障礙物（柱子） */
  columns: { x: number; y: number; r: number }[];
  stairs: StairDef[];
  exits: ExitDef[];
  landmarks: Landmark[];
  spawn?: Vec2;
}
