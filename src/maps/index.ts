import type { FloorId, FloorMap } from '../game/types';
import { floor1 } from './floor1';
import { floor2 } from './floor2';
import { floor3 } from './floor3';

export const FLOORS: Record<FloorId, FloorMap> = {
  floor1,
  floor2,
  floor3,
};

/** 由高到低 */
export const FLOOR_ORDER: FloorId[] = ['floor3', 'floor2', 'floor1'];

export const START_FLOOR: FloorId = 'floor3';

export { floor1, floor2, floor3 };
