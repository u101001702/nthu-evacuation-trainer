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
    area('st_nw', '西北室外逃生梯', 'stair',
      ST_NW_RECT.x, ST_NW_RECT.y, ST_NW_RECT.x + ST_NW_RECT.w, ST_NW_RECT.y + ST_NW_RECT.h,
      [{ side: 'S', at: 880, width: 200 }], 'NW Escape Stairs'),
    area('st_sw', '西南室外逃生梯', 'stair',
      ST_SW_RECT.x, ST_SW_RECT.y, ST_SW_RECT.x + ST_SW_RECT.w, ST_SW_RECT.y + ST_SW_RECT.h,
      [{ side: 'N', at: 880, width: 200 }], 'SW Escape Stairs'),
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
    { x: 870, y: 260, text: '緊急逃生出口', tone: 'exit' },
    { x: 870, y: 2040, text: '緊急逃生出口', tone: 'exit' },
  ],

  spawn: { x: 430, y: 1010 },
};
