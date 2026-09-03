/**
 * 教育館 3F — 遊戲起始樓層
 *
 * ⚠️ 座標已依 MAP_NOTES.md §1 的結論，將原始 3F 圖面順時針旋轉 90°，
 *    使三座樓梯與挑空能與 2F / 1F 垂直對齊。
 *    玩家起點：310 視聽教室（建築物西側中段）。
 */
import type { FloorMap } from '../game/types';
import {
  SHELL, WELL, ST_MAIN_RECT, ST_NW_RECT, ST_SW_RECT,
  SPAWN_MAIN, SPAWN_NW, SPAWN_SW,
  area, open, hWall, vWall, mainStairArea,
} from './geometry';

export const floor3: FloorMap = {
  id: 'floor3',
  name: '3F',
  bounds: { x: -350, y: -450, w: 3300, h: 3150 },
  shell: SHELL,

  areas: [
    /* ── 走廊環 ────────────────────────────────────────────── */
    open('corr_w', '西側走廊', 'corridor', 700, 200, 1010, 2100, 'West Corridor'),
    open('corr_e', '東側走廊', 'corridor', 2130, 200, 2250, 2100, 'East Corridor'),
    open('corr_n', '北側走廊', 'corridor', 1010, 550, 2130, 650, 'North Corridor'),
    open('corr_s', '南側走廊', 'corridor', 1010, 1620, 2130, 1740, 'South Corridor'),

    /* ── 西側外圈（309 / 310 / 311） ───────────────────────── */
    area('309', '309 教室', 'room', 200, 200, 700, 550,
      [{ side: 'E', at: 375 }], 'Room 309'),
    area('310', '310 視聽教室', 'room', 200, 550, 700, 1340,
      [{ side: 'E', at: 800 }, { side: 'E', at: 1100 }], 'Room 310'),
    area('311', '311 視聽教室', 'room', 200, 1340, 700, 2100,
      [{ side: 'E', at: 1720 }], 'Room 311'),

    /* ── 北側外圈 ──────────────────────────────────────────── */
    area('307', '307 教室', 'room', 1010, 200, 1380, 550, [{ side: 'S', at: 1195 }], 'Room 307'),
    area('305', '305 教室', 'room', 1380, 200, 1755, 550, [{ side: 'S', at: 1567 }], 'Room 305'),
    area('303', '303 教室', 'room', 1755, 200, 2130, 550, [{ side: 'S', at: 1942 }], 'Room 303'),

    /* ── 東側外圈（研究室 + 廁所） ─────────────────────────── */
    area('302', '302 研究室', 'room', 2250, 200, 2400, 565, [{ side: 'W', at: 380, width: 90 }], 'Room 302'),
    area('301', '301 研究室', 'room', 2250, 565, 2400, 975, [{ side: 'W', at: 770, width: 90 }], 'Room 301'),
    area('320', '320 研究室', 'room', 2250, 975, 2400, 1370, [{ side: 'W', at: 1170, width: 90 }], 'Room 320'),
    area('318', '318 研究室', 'room', 2250, 1370, 2400, 1740, [{ side: 'W', at: 1555, width: 90 }], 'Room 318'),
    area('wc_3e_f', '女廁', 'service', 2250, 1740, 2400, 1920, [{ side: 'W', at: 1830, width: 90 }], 'Ladies Restroom'),
    area('wc_3e_m', '男廁', 'service', 2250, 1920, 2400, 2100, [{ side: 'W', at: 2010, width: 90 }], 'Gents Restroom'),

    /* ── 南側外圈 ──────────────────────────────────────────── */
    area('312', '312 研究室', 'room', 1010, 1740, 1390, 2100, [{ side: 'N', at: 1200 }], 'Room 312'),
    area('314', '314 教室', 'room', 1390, 1740, 1760, 2100, [{ side: 'N', at: 1575 }], 'Room 314'),
    area('316', '316 教室', 'room', 1760, 1740, 2130, 2100, [{ side: 'N', at: 1945 }], 'Room 316'),

    /* ── 內圈北（304 / 306 / 308 + 廁所） ──────────────────── */
    area('308', '308 教室', 'room', 1010, 650, 1290, 900, [{ side: 'N', at: 1150 }], 'Room 308'),
    area('306', '306 教室', 'room', 1290, 650, 1560, 900, [{ side: 'N', at: 1425 }], 'Room 306'),
    area('304', '304 教室', 'room', 1560, 650, 1840, 900, [{ side: 'N', at: 1700 }], 'Room 304'),
    area('wc_3m_f', '女廁', 'service', 1840, 650, 1985, 900, [{ side: 'N', at: 1912, width: 90 }], 'Ladies Restroom'),
    area('wc_3m_m', '男廁', 'service', 1985, 650, 2130, 900, [{ side: 'N', at: 2057, width: 90 }], 'Gents Restroom'),

    /* ── 內圈東（主樓梯 + 教員室） ─────────────────────────── */
    mainStairArea(),
    area('faculty', '教員室', 'room', 1840, 1140, 2130, 1420, [{ side: 'E', at: 1280 }], 'Faculty Room'),

    /* ── 內圈南 ────────────────────────────────────────────── */
    area('313', '313 教室', 'room', 1010, 1420, 1450, 1620, [{ side: 'S', at: 1230 }], 'Room 313'),
    area('media_ws', '媒體工作室', 'room', 1450, 1420, 1790, 1620, [{ side: 'S', at: 1620 }], 'Media Workshop'),
    area('av_store', '視聽器材室', 'service', 1790, 1420, 2130, 1620, [{ side: 'S', at: 1960 }], 'AV Equipment'),

    /* ── 挑空（不可通行） ──────────────────────────────────── */
    area('well', '挑空', 'well', WELL.x, WELL.y, WELL.x + WELL.w, WELL.y + WELL.h, [], 'Open Well'),

    /* ── 室外逃生梯塔 ──────────────────────────────────────── */
    area('st_nw', '樓梯', 'stair',
      ST_NW_RECT.x, ST_NW_RECT.y, ST_NW_RECT.x + ST_NW_RECT.w, ST_NW_RECT.y + ST_NW_RECT.h,
      [{ side: 'S', at: 880, width: 200 }], 'NW Escape Stairs', '西北室外逃生梯'),
    area('st_sw', '樓梯', 'stair',
      ST_SW_RECT.x, ST_SW_RECT.y, ST_SW_RECT.x + ST_SW_RECT.w, ST_SW_RECT.y + ST_SW_RECT.h,
      [{ side: 'N', at: 880, width: 200 }], 'SW Escape Stairs', '西南室外逃生梯'),
  ],

  extraWalls: [
    // 挑空西側牆（西邊是走廊，沒有房間可以提供這道牆）
    ...vWall(WELL.y, WELL.y + WELL.h, WELL.x),
    // 外殼補牆：走廊直接貼到外牆的地方
    ...hWall(700, 1010, 200, [[740, 1000]]),   // 北牆（讓開逃生梯塔）
    ...hWall(700, 1010, 2100, [[740, 1000]]),  // 南牆
    ...hWall(2130, 2250, 200),                 // 東側走廊北端
    ...hWall(2130, 2250, 2100),                // 東側走廊南端
  ],

  columns: [],

  stairs: [
    {
      id: 'st_main', label: '主樓梯', rect: ST_MAIN_RECT,
      down: { floor: 'floor2', spawn: SPAWN_MAIN, label: '2F' },
    },
    {
      id: 'st_nw', label: '西北室外逃生梯', rect: ST_NW_RECT,
      down: { floor: 'floor2', spawn: SPAWN_NW, label: '2F' },
    },
    {
      id: 'st_sw', label: '西南室外逃生梯', rect: ST_SW_RECT,
      down: { floor: 'floor2', spawn: SPAWN_SW, label: '2F' },
    },
  ],

  exits: [],

  landmarks: [
    { x: 2190, y: 1020, text: '樓梯 STAIRS', tone: 'stair' },
    { x: 2190, y: 880, text: '電梯 · 災時勿用', tone: 'warn' },
  ],

  spawn: { x: 430, y: 1010 },

  /**
   * 火場情境：310 視聽教室內起火，起火點就在學生座位的西北邊、
   * 緊鄰教室上方那扇門。
   *
   * 火在第 2 秒就封死上方那扇門 —— 比學生跑得到那裡還快，
   * 所以「往上走」這個選項在他反應過來時就已經沒了，只能從下方門往南。
   * 火接著燒出教室、切斷西側走廊北段，通往西北逃生梯的路一併封死。
   * 活路只剩往南：西南室外逃生梯，或南側走廊繞到東側走主樓梯。
   *
   * 參數的安全界線寫在 config.ts 的火場情境區塊，
   * 每一條都由 `npm run verify:hazard` 實際驗證。
   */
  hazards: {
    fires: [
      {
        id: 'fire_310',
        label: '310 視聽教室 · 上方門邊',
        x: 560,
        y: 560,
        // 開場就 210 px，剛好讓學生在可視範圍邊緣看見火光 —— 
        // 看不見的火只會讓人亂撞，第一眼就要知道火在哪個方向。
        startRadius: 250,
        growthPxPerSec: 40,
        maxRadius: 350,
        // 延燒上限 480 是安全閥，落在一個很窄的窗口裡：
        //   > 442 px 才封得死西側走廊（含貼著東牆想溜過去的路線）
        //   < 505 px 才碰不到下方門的門洞上緣
        // 動這個數字之前先看 verify:hazard 的第 3 與第 6 條。
        creepPxPerSec: 12,
        creepMaxRadius: 480,
      },
    ],
    smoke: [
      {
        id: 'smoke_corr_w',
        label: '西側走廊',
        /*
         * 整條西側走廊都是煙，包含北段那片火場的上方 ——
         * 真實火場的煙本來就從火源往外鋪，離火愈近煙愈濃。
         *
         * 煙蓋住火不算陷阱，因為學生在「還沒進煙的教室裡」就已經看見火了，
         * 他帶著「北邊有火」這個資訊走進走廊。
         * 而且煙裡看得到 2 公尺、退出去只要不到 1 秒，4 秒的緩衝綽綽有餘。
         * 這兩件事由 verify:hazard 的第 7 條實際驗證。
         */
        rect: { x: 700, y: 200, w: 310, h: 1900 },
      },
      {
        id: 'smoke_st_sw',
        label: '西南室外逃生梯口',
        // 樓梯口本身也有煙：學生得在看不見的狀態下認出這是樓梯
        rect: { x: 740, y: 2100, w: 260, h: 130 },
      },
    ],
  },
};
