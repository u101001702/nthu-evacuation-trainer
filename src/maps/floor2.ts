/**
 * 教育館 2F — 中間樓層
 * 依原始 2F 緊急逃生路線圖建立，使用者指定的 40 個房號全數涵蓋
 *（原圖無 212、213）。
 */
import type { FloorMap } from '../game/types';
import {
  SHELL, WELL, ST_MAIN_RECT, ST_NW_RECT, ST_SW_RECT,
  SPAWN_MAIN, SPAWN_NW, SPAWN_SW,
  area, open, hWall, vWall, mainStairArea,
} from './geometry';

export const floor2: FloorMap = {
  id: 'floor2',
  name: '2F',
  bounds: { x: -350, y: -450, w: 3300, h: 3150 },
  shell: SHELL,

  areas: [
    /* ── 走廊環 ────────────────────────────────────────────── */
    open('corr_n', '北側走廊', 'corridor', 440, 590, 2130, 670, 'North Corridor'),
    open('corr_w', '西側走廊', 'corridor', 440, 590, 560, 1800, 'West Corridor'),
    open('corr_e', '東側走廊', 'corridor', 2130, 200, 2250, 1800, 'East Corridor'),
    open('corr_s', '南側走廊', 'corridor', 440, 1695, 2400, 1800, 'South Corridor'),

    /* ── 北側外圈 ──────────────────────────────────────────── */
    area('211', '211', 'room', 200, 200, 760, 590, [{ side: 'S', at: 600 }], 'Room 211'),
    area('nw_lobby', '西北逃生梯前室', 'corridor', 760, 200, 1030, 590,
      [{ side: 'S', at: 895 }, { side: 'N', at: 880, width: 200 }], 'NW Stair Lobby'),
    area('209B', '209B', 'room', 1030, 200, 1190, 590, [{ side: 'S', at: 1110, width: 90 }], 'Room 209B'),
    area('209A', '209A', 'room', 1190, 200, 1330, 590, [{ side: 'S', at: 1260, width: 90 }], 'Room 209A'),
    area('207', '207', 'room', 1330, 200, 1560, 590, [{ side: 'S', at: 1445 }], 'Room 207'),
    area('205B', '205B', 'room', 1560, 200, 1720, 590, [{ side: 'S', at: 1640, width: 90 }], 'Room 205B'),
    area('205A', '205A', 'room', 1720, 200, 1870, 590, [{ side: 'S', at: 1795, width: 90 }], 'Room 205A'),
    area('203B', '203B', 'room', 1870, 200, 1995, 590, [{ side: 'S', at: 1932, width: 80 }], 'Room 203B'),
    area('203A', '203A', 'room', 1995, 200, 2130, 590, [{ side: 'S', at: 2062, width: 80 }], 'Room 203A'),
    area('202', '202', 'room', 2250, 200, 2400, 590, [{ side: 'W', at: 395, width: 90 }], 'Room 202'),

    /* ── 西側外圈 ──────────────────────────────────────────── */
    area('214', '214', 'room', 200, 590, 440, 993, [{ side: 'E', at: 790, width: 90 }], 'Room 214'),
    area('215', '215', 'room', 200, 993, 440, 1396, [{ side: 'E', at: 1195, width: 90 }], 'Room 215'),
    area('216', '216', 'room', 200, 1396, 440, 1800, [{ side: 'E', at: 1600, width: 90 }], 'Room 216'),

    /* ── 東側外圈 ──────────────────────────────────────────── */
    area('201', '201', 'room', 2250, 590, 2400, 900, [{ side: 'W', at: 745, width: 90 }], 'Room 201'),
    area('228', '228', 'room', 2250, 900, 2400, 1300, [{ side: 'W', at: 1100, width: 90 }], 'Room 228'),
    area('227', '227', 'room', 2250, 1300, 2400, 1695, [{ side: 'W', at: 1500, width: 90 }], 'Room 227'),

    /* ── 內圈北 ────────────────────────────────────────────── */
    area('210S', '210S', 'service', 560, 670, 700, 900, [{ side: 'N', at: 630, width: 90 }], 'Room 210S'),
    area('server', '機房 Computer Facilities', 'service', 700, 670, 900, 900,
      [{ side: 'N', at: 800, width: 90 }], 'Computer Facilities'),
    area('208', '208', 'room', 900, 670, 1330, 900, [{ side: 'N', at: 1115 }], 'Room 208'),
    area('206', '206', 'room', 1330, 670, 1610, 900, [{ side: 'N', at: 1470 }], 'Room 206'),
    area('204', '204', 'room', 1610, 670, 1870, 900, [{ side: 'N', at: 1740 }], 'Room 204'),
    area('wc_2n_f', '女廁', 'service', 1870, 670, 2000, 900, [{ side: 'N', at: 1935, width: 90 }], 'Ladies Restroom'),
    area('wc_2n_m', '男廁', 'service', 2000, 670, 2130, 900, [{ side: 'N', at: 2065, width: 90 }], 'Gents Restroom'),

    /* ── 210 系列套房（西側內圈） ──────────────────────────── */
    area('210hall', '210 內走道', 'corridor', 560, 900, 860, 1060,
      [{ side: 'W', at: 980, width: 100 }, { side: 'E', at: 980, width: 100 }], '210 Suite'),
    area('210M', '210M', 'room', 860, 900, 1010, 1060, [{ side: 'W', at: 980, width: 100 }], 'Room 210M'),
    area('210AB', '210A/B', 'room', 560, 1060, 860, 1370, [{ side: 'W', at: 1215, width: 100 }], 'Room 210A/B'),
    area('210D1', '210D1', 'room', 860, 1060, 1010, 1370, [{ side: 'N', at: 935, width: 100 }], 'Room 210D1'),
    area('210C', '210C', 'room', 560, 1370, 780, 1695, [{ side: 'S', at: 670 }], 'Room 210C'),
    area('210D2', '210D2', 'room', 780, 1370, 1010, 1695, [{ side: 'S', at: 895 }], 'Room 210D2'),

    /* ── 內圈東（主樓梯 + 225） ────────────────────────────── */
    mainStairArea(),
    area('225', '225', 'room', 1840, 1140, 2130, 1695, [{ side: 'E', at: 1400 }], 'Room 225'),

    /* ── 內圈南 ────────────────────────────────────────────── */
    area('219', '219', 'room', 1010, 1420, 1290, 1695, [{ side: 'S', at: 1150 }], 'Room 219'),
    area('221', '221', 'room', 1290, 1420, 1570, 1695, [{ side: 'S', at: 1430 }], 'Room 221'),
    area('223', '223', 'room', 1570, 1420, 1840, 1695, [{ side: 'S', at: 1705 }], 'Room 223'),

    /* ── 挑空 ──────────────────────────────────────────────── */
    area('well', '挑空 Well', 'well', WELL.x, WELL.y, WELL.x + WELL.w, WELL.y + WELL.h, [], 'Open Well'),

    /* ── 南側外圈 ──────────────────────────────────────────── */
    area('217A', '217A', 'room', 200, 1800, 420, 1950, [{ side: 'E', at: 1875, width: 90 }], 'Room 217A'),
    area('217B', '217B', 'room', 200, 1950, 420, 2100, [{ side: 'E', at: 2025, width: 90 }], 'Room 217B'),
    area('217M', '217M', 'room', 420, 1800, 640, 1950,
      [{ side: 'E', at: 1875, width: 90 }, { side: 'W', at: 1875, width: 90 }], 'Room 217M'),
    area('217C', '217C', 'room', 420, 1950, 640, 2100,
      [{ side: 'E', at: 2025, width: 90 }, { side: 'W', at: 2025, width: 90 }], 'Room 217C'),
    area('217lobby', '217 前室', 'corridor', 640, 1800, 760, 2100,
      [{ side: 'N', at: 700, width: 90 }, { side: 'W', at: 1875, width: 90 }, { side: 'W', at: 2025, width: 90 }],
      '217 Lobby'),
    area('sw_lobby', '西南逃生梯前室', 'corridor', 760, 1800, 1030, 2100,
      [{ side: 'N', at: 895 }, { side: 'S', at: 880, width: 200 }], 'SW Stair Lobby'),
    area('218', '218', 'room', 1030, 1800, 1170, 2100, [{ side: 'N', at: 1100, width: 90 }], 'Room 218'),
    area('220A', '220A', 'room', 1170, 1800, 1330, 2100, [{ side: 'N', at: 1250, width: 90 }], 'Room 220A'),
    area('220B', '220B', 'room', 1330, 1800, 1450, 2100, [{ side: 'N', at: 1390, width: 80 }], 'Room 220B'),
    area('222', '222', 'room', 1450, 1800, 1670, 2100, [{ side: 'N', at: 1560 }], 'Room 222'),
    area('224A', '224A', 'room', 1670, 1800, 1800, 2100, [{ side: 'N', at: 1735, width: 80 }], 'Room 224A'),
    area('224B', '224B', 'room', 1800, 1800, 1915, 2100, [{ side: 'N', at: 1857, width: 80 }], 'Room 224B'),
    area('226A', '226A', 'room', 1915, 1800, 2030, 2100, [{ side: 'N', at: 1972, width: 80 }], 'Room 226A'),
    area('226B', '226B', 'room', 2030, 1800, 2170, 2100, [{ side: 'N', at: 2100, width: 90 }], 'Room 226B'),
    area('wc_2s_f', '女廁', 'service', 2170, 1800, 2285, 2100, [{ side: 'N', at: 2227, width: 80 }], 'Ladies Restroom'),
    area('wc_2s_m', '男廁', 'service', 2285, 1800, 2400, 2100, [{ side: 'N', at: 2342, width: 80 }], 'Gents Restroom'),

    /* ── 室外逃生梯塔 ──────────────────────────────────────── */
    area('st_nw', '西北室外逃生梯', 'stair',
      ST_NW_RECT.x, ST_NW_RECT.y, ST_NW_RECT.x + ST_NW_RECT.w, ST_NW_RECT.y + ST_NW_RECT.h,
      [{ side: 'S', at: 880, width: 200 }], 'NW Escape Stairs'),
    area('st_sw', '西南室外逃生梯', 'stair',
      ST_SW_RECT.x, ST_SW_RECT.y, ST_SW_RECT.x + ST_SW_RECT.w, ST_SW_RECT.y + ST_SW_RECT.h,
      [{ side: 'N', at: 880, width: 200 }], 'SW Escape Stairs'),
  ],

  extraWalls: [
    ...hWall(2130, 2250, 200),   // 東側走廊北端封閉
    ...vWall(1695, 1800, 2400),  // 南側走廊東端封閉
  ],

  columns: [],

  stairs: [
    {
      id: 'st_main', label: '主樓梯', rect: ST_MAIN_RECT,
      down: { floor: 'floor1', spawn: SPAWN_MAIN, label: '1F' },
      up: { floor: 'floor3', spawn: SPAWN_MAIN, label: '3F' },
    },
    {
      id: 'st_nw', label: '西北室外逃生梯', rect: ST_NW_RECT,
      down: { floor: 'floor1', spawn: SPAWN_NW, label: '1F' },
      up: { floor: 'floor3', spawn: SPAWN_NW, label: '3F' },
    },
    {
      id: 'st_sw', label: '西南室外逃生梯', rect: ST_SW_RECT,
      down: { floor: 'floor1', spawn: SPAWN_SW, label: '1F' },
      up: { floor: 'floor3', spawn: SPAWN_SW, label: '3F' },
    },
  ],

  exits: [],

  landmarks: [
    { x: 2190, y: 1020, text: '樓梯 STAIRS', tone: 'stair' },
    { x: 2195, y: 930, text: '緊急逃生出口', tone: 'exit' },
    { x: 895, y: 400, text: '緊急逃生梯', tone: 'exit' },
    { x: 1010, y: 300, text: '電梯 · 災時勿用', tone: 'warn' },
    { x: 895, y: 1900, text: '緊急逃生梯', tone: 'exit' },
  ],
};
