/**
 * 教育館 1F — 出口樓層
 * 1F 沒有挑空，中央為開放大廳（2F/3F 的挑空往下看就是這裡），內有 11 根柱子。
 * 三處「建築外」出口：北側、南側、東側。
 */
import type { FloorMap, Rect } from '../game/types';
import {
  SHELL, ST_MAIN_RECT, SPAWN_MAIN,
  area, open, hWall, vWall, mainStairArea,
} from './geometry';

/** 室外安全區域（進入即撤離成功） */
const OUT_N: Rect = { x: 400, y: -400, w: 1200, h: 600 };
const OUT_S: Rect = { x: 400, y: 2100, w: 1200, h: 600 };
const OUT_E: Rect = { x: 2400, y: 950, w: 550, h: 700 };

export const floor1: FloorMap = {
  id: 'floor1',
  name: '1F',
  bounds: { x: -350, y: -450, w: 3300, h: 3150 },
  shell: SHELL,

  areas: [
    /* ── 室外（先畫，當底層） ──────────────────────────────── */
    open('out_n', '建築外', 'outside', OUT_N.x, OUT_N.y, OUT_N.x + OUT_N.w, OUT_N.y + OUT_N.h, 'Outside'),
    open('out_s', '建築外', 'outside', OUT_S.x, OUT_S.y, OUT_S.x + OUT_S.w, OUT_S.y + OUT_S.h, 'Outside'),
    open('out_e', '建築外', 'outside', OUT_E.x, OUT_E.y, OUT_E.x + OUT_E.w, OUT_E.y + OUT_E.h, 'Outside'),

    /* ── 動線 ──────────────────────────────────────────────── */
    open('corr_w', '西側走廊', 'corridor', 720, 200, 1000, 2100, 'West Corridor'),
    open('hall', '中央開放區', 'corridor', 1000, 750, 2400, 1440, 'Central Hall'),
    open('corr_se', '東南走廊', 'corridor', 2000, 1440, 2130, 2100, 'SE Corridor'),

    /* ── 西側 ──────────────────────────────────────────────── */
    area('106', '106', 'room', 200, 200, 720, 750, [{ side: 'E', at: 475 }], 'Room 106'),
    area('107', '107', 'room', 200, 750, 720, 1080, [{ side: 'E', at: 915 }], 'Room 107'),
    area('108', '108', 'room', 200, 1080, 720, 1440, [{ side: 'E', at: 1260 }], 'Room 108'),
    area('109', '109', 'room', 200, 1440, 720, 1770, [{ side: 'E', at: 1605 }], 'Room 109'),
    area('110', '110', 'room', 200, 1770, 460, 2100, [{ side: 'E', at: 1935, width: 90 }], 'Room 110'),
    area('111', '111', 'room', 460, 1770, 720, 2100,
      [{ side: 'E', at: 1935, width: 90 }, { side: 'W', at: 1935, width: 90 }], 'Room 111'),

    /* ── 北側 ──────────────────────────────────────────────── */
    area('wc_1n_f', '女廁', 'service', 1000, 200, 1150, 480, [{ side: 'W', at: 340, width: 90 }], 'Ladies Restroom'),
    area('wc_1n_m', '男廁', 'service', 1000, 480, 1150, 750, [{ side: 'W', at: 615, width: 90 }], 'Gents Restroom'),
    area('105', '105', 'room', 1150, 200, 1400, 750, [{ side: 'S', at: 1275 }], 'Room 105'),
    area('104', '104', 'room', 1400, 200, 1650, 750, [{ side: 'S', at: 1525 }], 'Room 104'),
    area('103', '103', 'room', 1650, 200, 1900, 750, [{ side: 'S', at: 1775 }], 'Room 103'),
    area('102', '102', 'room', 1900, 200, 2150, 750, [{ side: 'S', at: 2025 }], 'Room 102'),
    area('101', '101', 'room', 2150, 200, 2400, 750, [{ side: 'S', at: 2275 }], 'Room 101'),

    /* ── 主樓梯（獨立量體，立於中央開放區內） ─────────────── */
    mainStairArea(),

    /* ── 南側 ──────────────────────────────────────────────── */
    area('113', '113', 'room', 1000, 1440, 1250, 1780, [{ side: 'N', at: 1125 }], 'Room 113'),
    area('112', '112', 'room', 1000, 1780, 1250, 2100, [{ side: 'W', at: 1940 }], 'Room 112'),
    area('114', '114', 'room', 1250, 1440, 1500, 2100, [{ side: 'N', at: 1375 }], 'Room 114'),
    area('115', '115', 'room', 1500, 1440, 1750, 2100, [{ side: 'N', at: 1625 }], 'Room 115'),
    area('116', '116', 'room', 1750, 1440, 2000, 2100, [{ side: 'N', at: 1875 }], 'Room 116'),
    area('117', '117', 'room', 2130, 1440, 2400, 1610, [{ side: 'W', at: 1525, width: 90 }], 'Room 117'),
    area('pantry', '茶水間', 'service', 2130, 1610, 2400, 1730, [{ side: 'W', at: 1670, width: 80 }], 'Pantry'),
    area('wc_1s_m', '男廁', 'service', 2130, 1730, 2400, 1915, [{ side: 'W', at: 1822, width: 90 }], 'Gents Restroom'),
    area('wc_1s_f', '女廁', 'service', 2130, 1915, 2400, 2100, [{ side: 'W', at: 2007, width: 90 }], 'Ladies Restroom'),
  ],

  extraWalls: [
    ...hWall(720, 1000, 200, [[780, 980]]),      // 北側外牆 + 建築外出口
    ...hWall(720, 1000, 2100, [[780, 980]]),     // 南側外牆 + 建築外出口
    ...vWall(750, 1440, 2400, [[1180, 1330]]),   // 東側外牆 + 建築外出口
    ...hWall(2000, 2130, 2100),                  // 東南走廊南端封閉
  ],

  /** 中央開放區的柱子（依原圖 3 排陣列） */
  columns: [
    { x: 1060, y: 930, r: 26 }, { x: 1300, y: 930, r: 26 }, { x: 1550, y: 930, r: 26 },
    { x: 1060, y: 1110, r: 26 }, { x: 1300, y: 1110, r: 26 }, { x: 1550, y: 1110, r: 26 },
    { x: 1060, y: 1290, r: 26 }, { x: 1300, y: 1290, r: 26 }, { x: 1550, y: 1290, r: 26 },
    { x: 1800, y: 1290, r: 26 }, { x: 2060, y: 1290, r: 26 },
  ],

  stairs: [
    {
      id: 'st_main', label: '主樓梯', rect: ST_MAIN_RECT,
      up: { floor: 'floor2', spawn: SPAWN_MAIN, label: '2F' },
    },
  ],

  exits: [
    { id: 'exit_n', label: '北側建築外', rect: OUT_N },
    { id: 'exit_s', label: '南側建築外', rect: OUT_S },
    { id: 'exit_e', label: '東側建築外', rect: OUT_E },
  ],

  landmarks: [
    { x: 880, y: 260, text: '緊急出口 EXIT', tone: 'exit' },
    { x: 880, y: 2040, text: '緊急出口 EXIT', tone: 'exit' },
    { x: 2330, y: 1255, text: '緊急出口 EXIT', tone: 'exit' },
    { x: 2190, y: 1020, text: '樓梯 STAIRS', tone: 'stair' },
  ],
};

export { OUT_N, OUT_S, OUT_E };
