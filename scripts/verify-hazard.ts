/**
 * 火場參數守門員。
 *
 * config.ts 裡寫了火場的安全界線，但註解不會自己檢查自己 ——
 * 這支腳本把每一條變成會失敗的斷言，直接讀真正的地圖與設定，
 * 所以以後任何人調整火源座標或半徑，跑 `npm run verify:hazard` 就知道有沒有踩線。
 *
 *   npm run verify:hazard
 */
import { FLOORS } from '../src/maps';
import { activeFires, fireAt, rectHitByFire } from '../src/game/hazard';
import {
  FIRE_TOLERANCE_MS, PLAYER_SPEED, PX_PER_M,
  SMOKE_SPEED_FACTOR, SMOKE_VISIBILITY_RADIUS, VISIBILITY_RADIUS,
} from '../src/game/config';
import type { Vec2 } from '../src/game/types';

const floor = FLOORS.floor3;
const hazards = floor.hazards;
if (!hazards) throw new Error('floor3 沒有火場資料');

const AT_MAX = 300_000;   // 拖很久的一局：火勢連延燒都燒到頂了
const GRACE_S = 15;       // 學生離開起火教室的寬限時間
const firesAtMax = activeFires(hazards, AT_MAX);

const spawn = floor.spawn!;
const UPPER_DOOR = { x: 700, y: 800 };    // 310 上方門（火要封住這扇）
const LOWER_DOOR = { x: 700, y: 1100 };   // 310 下方門（活路，永遠要通）
const DOOR_HALF = 55;                     // 門洞半寬

let failed = 0;
function check(name: string, ok: boolean, detail: string): void {
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}\n      ${detail}`);
  if (!ok) failed++;
}

const m = (px: number): string => `${(px / PX_PER_M).toFixed(1)} m`;
const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);
const walkTime = (a: Vec2, b: Vec2): number => dist(a, b) / PLAYER_SPEED;

/** 整個門洞都被火蓋住才算封死 —— 只擋一半是擋不住人的 */
function doorSealedAt(door: Vec2): number {
  for (let t = 0; t <= AT_MAX; t += 50) {
    const fs = activeFires(hazards, t);
    let sealed = true;
    for (let dy = -DOOR_HALF; dy <= DOOR_HALF; dy += 5) {
      if (!fireAt(fs, { x: door.x, y: door.y + dy })) { sealed = false; break; }
    }
    if (sealed) return t / 1000;
  }
  return -1;
}

console.log('\n火源設定');
for (const f of hazards.fires) {
  const grow = (f.maxRadius - f.startRadius) / f.growthPxPerSec;
  console.log(
    `  ${f.id} @ (${f.x}, ${f.y})　${f.label}`
    + `\n      初期　${f.startRadius} → ${f.maxRadius} px（${m(f.startRadius)} → ${m(f.maxRadius)}）`
    + `，${f.growthPxPerSec} px/s，${grow.toFixed(1)} 秒長滿`,
  );
  if (f.creepPxPerSec) {
    const cap = f.creepMaxRadius ?? f.maxRadius;
    const creepT = grow + (cap - f.maxRadius) / f.creepPxPerSec;
    console.log(
      `      延燒　${f.maxRadius} → ${cap} px（${m(f.maxRadius)} → ${m(cap)}）`
      + `，${f.creepPxPerSec} px/s，第 ${creepT.toFixed(0)} 秒到頂`,
    );
  }
}

console.log('\n安全界線');

/* 1. 學生一睜眼就要看得見火。看不見的火只會讓人往火裡亂撞。 */
const seeGap = dist(spawn, hazards.fires[0]!) - hazards.fires[0]!.startRadius;
check(
  '1. 開場當下，學生就看得見火光',
  seeGap <= VISIBILITY_RADIUS,
  `火緣距座位 ${m(seeGap)}，可視 ${m(VISIBILITY_RADIUS)}`,
);

/* 2. 上方門要在學生跑到之前封死 —— 這是這個情境的核心 */
const upperSealed = doorSealedAt(UPPER_DOOR);
const toUpper = walkTime(spawn, UPPER_DOOR);
check(
  '2. 上方門在學生跑到之前就封死（「往上走」不能是選項）',
  upperSealed > 0 && upperSealed < toUpper,
  `封閉於第 ${upperSealed.toFixed(1)} 秒，學生全速也要 ${toUpper.toFixed(1)} 秒才到`,
);

/* 3. 下方門是唯一活路，永遠不能封 */
const lowerSealed = doorSealedAt(LOWER_DOOR);
let lowerTouched = false;
for (let dy = -DOOR_HALF; dy <= DOOR_HALF; dy += 5) {
  if (fireAt(firesAtMax, { x: LOWER_DOOR.x, y: LOWER_DOOR.y + dy })) lowerTouched = true;
}
check(
  '3. 下方門永不封閉（延燒燒到頂也一樣）',
  lowerSealed < 0 && !lowerTouched,
  lowerSealed < 0 && !lowerTouched
    ? `門洞全程無火，火緣最近仍差 ${m(dist(LOWER_DOOR, hazards.fires[0]!) - (hazards.fires[0]!.creepMaxRadius ?? 0))}`
    : '⚠️ 下方門會被火波及',
);

/* 4. 學生不會一睜眼就衝刺 —— 他要先搞清楚火在哪、門在哪。
      所以驗的不是「路徑上有沒有火」，而是「最晚可以拖到第幾秒才動身，
      沿路走到下方門的過程仍然全程安全」。這個數字就是反應時間的預算。 */
function safeDeparture(): number {
  let latest = -1;
  for (let delay = 0; delay <= GRACE_S * 1000; delay += 250) {
    let ok = true;
    for (let k = 0; k <= 60 && ok; k++) {
      const px = spawn.x + ((LOWER_DOOR.x - spawn.x) * k) / 60;
      const py = spawn.y + ((LOWER_DOOR.y - spawn.y) * k) / 60;
      const t = delay + walkTime(spawn, { x: px, y: py }) * 1000;
      if (fireAt(activeFires(hazards, t), { x: px, y: py })) ok = false;
    }
    if (ok) latest = delay / 1000;
    else break;
  }
  return latest;
}
const departBy = safeDeparture();
check(
  '4. 學生至少有 5 秒的反應時間，才動身也還走得到下方門',
  departBy >= 5,
  `最晚可以拖到第 ${departBy.toFixed(1)} 秒才動身`
  + `（走完只要 ${walkTime(spawn, LOWER_DOOR).toFixed(1)} 秒）`,
);

/* 5. 就算學生愣住不動，教室也不能整間變火海 */
const r310 = floor.areas.find((a) => a.id === '310')!.rect;
let cells = 0;
let safe = 0;
for (let x = r310.x; x <= r310.x + r310.w; x += 8) {
  for (let y = r310.y; y <= r310.y + r310.h; y += 8) {
    cells++;
    if (!fireAt(firesAtMax, { x, y })) safe++;
  }
}
const safePct = (safe / cells) * 100;
check(
  '5. 火燒到頂時，310 教室至少還有 25% 的空間可躲',
  safePct >= 25,
  `教室仍有 ${safePct.toFixed(0)}% 安全（集中在南半部，下方門那一側）`,
);

/* 6. 往北要封得徹底 —— 走廊中線封住但貼著東牆能溜過去，等於沒封 */
const corrW = floor.areas.find((a) => a.id === 'corr_w')!.rect;
const gateY = 600;   // 西側走廊接北側走廊的高度
let northOpenAt: number | null = null;
for (let x = corrW.x + 15; x <= corrW.x + corrW.w - 15; x += 5) {
  if (!fireAt(firesAtMax, { x, y: gateY })) { northOpenAt = x; break; }
}
check(
  '6. 往北的路封得徹底（貼著東牆也溜不過去）',
  northOpenAt === null,
  northOpenAt === null
    ? `西側走廊 y=${gateY} 全寬皆在火中`
    : `⚠️ x=${northOpenAt} 有縫可鑽`,
);

/* 7. 煙可以蓋住火 —— 真實火場的煙本來就從火源往外鋪。
      但煙蓋住火的前提是這兩件事都成立：
        7a. 學生的「第一眼」不能被煙剝奪：座位看向火源的路上不能有煙，
            他要能帶著「火在那個方向」這個資訊才走進煙裡；
        7b. 在煙裡撞見火之後，來得及在燒死前退出去。 */
const inSmokeRect = (p: Vec2): boolean =>
  hazards.smoke.some((sm) => {
    const { x, y, w, h } = sm.rect;
    return p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h;
  });

const fire0 = hazards.fires[0]!;
let firstLookBlocked = false;
for (let k = 0; k <= 40; k++) {
  const px = spawn.x + ((fire0.x - spawn.x) * k) / 40;
  const py = spawn.y + ((fire0.y - spawn.y) * k) / 40;
  if (inSmokeRect({ x: px, y: py })) { firstLookBlocked = true; break; }
}
check(
  '7a. 學生的第一眼沒被煙擋住（座位到火源之間無煙）',
  !firstLookBlocked,
  firstLookBlocked ? '⚠️ 開場看向火的方向就是煙，學生無從判斷' : '座位到火源的視線全程無煙',
);

const smokeSpeed = PLAYER_SPEED * SMOKE_SPEED_FACTOR;
const REACT_S = 1;                                   // 看見火之後還往前衝的呆滯時間
const overshoot = Math.max(0, smokeSpeed * REACT_S - SMOKE_VISIBILITY_RADIUS);
const escapeS = REACT_S + overshoot / smokeSpeed;    // 呆滯 + 退出火場
check(
  '7b. 在煙裡撞見火，來得及在燒死前退出來',
  escapeS < FIRE_TOLERANCE_MS / 1000,
  `煙中可視 ${m(SMOKE_VISIBILITY_RADIUS)}、速度 ${smokeSpeed.toFixed(0)} px/s`
  + ` → 最壞情況 ${escapeS.toFixed(1)} 秒脫身，緩衝有 ${FIRE_TOLERANCE_MS / 1000} 秒`,
);

/* 8. 濃煙要落在學生真的會走的路上，不然等於白做 */
const mustPass = { x: 855, y: 1400 };   // 出下方門往南，一定會經過這裡
const onRoute = hazards.smoke.some((sm) => {
  const { x, y, w, h } = sm.rect;
  return mustPass.x >= x && mustPass.x <= x + w && mustPass.y >= y && mustPass.y <= y + h;
});
check(
  '8. 濃煙落在必經動線上（出下方門往南的走廊）',
  onRoute,
  onRoute ? `(${mustPass.x}, ${mustPass.y}) 在煙區內` : '⚠️ 學生可以完全不碰到煙',
);

console.log('\n往南的活路必須全程安全');
const southRoute: [string, Vec2][] = [
  ['西側走廊南段', { x: 855, y: 1400 }],
  ['南側走廊西端', { x: 1100, y: 1680 }],
  ['南側走廊東端', { x: 2050, y: 1680 }],
];
for (const [name, p] of southRoute) {
  const hit = fireAt(firesAtMax, p) !== null;
  check(`  ${name} (${p.x}, ${p.y})`, !hit, hit ? '⚠️ 在火中' : `安全（距火緣 ${m(dist(p, hazards.fires[0]!) - (hazards.fires[0]!.creepMaxRadius ?? 0))}）`);
}
for (const id of ['st_sw', 'st_main'] as const) {
  const st = floor.stairs.find((s) => s.id === id)!;
  const hit = rectHitByFire(firesAtMax, st.rect);
  check(`  ${st.label}`, !hit, hit ? '⚠️ 已被火勢覆蓋' : '全程安全');
}

console.log('\n學生視角時序');
console.log(`  0.0 s　開場，火在座位西北方 ${m(seeGap)} 處，看得見`);
console.log(`  ${upperSealed.toFixed(1)} s　上方門封死`);
console.log(`  ${toUpper.toFixed(1)} s　（學生全速衝上方門最快也只能到這裡 —— 太遲了）`);
console.log(`  ${walkTime(spawn, LOWER_DOOR).toFixed(1)} s　全速跑下方門可以出得去`);
let spawnBurnt = -1;
for (let t = 0; t <= AT_MAX; t += 250) {
  if (fireAt(activeFires(hazards, t), spawn)) { spawnBurnt = t / 1000; break; }
}
console.log(`  ${spawnBurnt < 0 ? '—' : spawnBurnt.toFixed(0)} s　火燒到原本的座位`);
const northSealed = doorSealedAt({ x: 855, y: gateY });
console.log(`  ${northSealed < 0 ? '—' : northSealed.toFixed(0)} s　西側走廊北段被切斷，往北的路沒了`);

check(
  '學生有足夠時間找到下方門（座位起火前至少 3 倍的腳程）',
  spawnBurnt < 0 || spawnBurnt >= walkTime(spawn, LOWER_DOOR) * 3,
  spawnBurnt < 0
    ? '座位永遠安全'
    : `座位第 ${spawnBurnt.toFixed(0)} 秒起火，跑到下方門只要 ${walkTime(spawn, LOWER_DOOR).toFixed(1)} 秒`,
);

console.log(failed === 0 ? '\n全部通過\n' : `\n${failed} 項未通過\n`);
process.exit(failed === 0 ? 0 : 1);
