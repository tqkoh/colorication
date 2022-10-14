/* eslint-disable no-use-before-define */
import * as lodash from 'lodash';
import Phaser from 'phaser';
import { log } from '../../utils/deb';
import Term from '../../utils/term';

export type Block =
  | 'start'
  | 'parent'
  | 'reset'
  | 'submit'
  | 'apply'
  | 'equal'
  | 'place'
  | 'down'
  | 'wall';

export type Test = {
  input: Square[];
  output: Square;
};

export type Stage = {
  tests: Test[];
  terms: Square[];
  name: string;
};

export type Square = (
  | { type: 'air' }
  | { type: 'term'; term: Term; map?: GameMap }
  | { type: 'map'; map: GameMap }
  | { type: 'stage'; stage: Stage; map?: GameMap }
  | { type: 'block'; block: Block }
) & {
  name: string;
  movable: boolean;
  collidable: boolean;
  locked: boolean;
  image?: Phaser.GameObjects.Image;

  testString?: string;
};

export class GameMap {
  // eslint-disable-next-line no-use-before-define
  parentMap: GameMap | undefined;

  squares: Square[][];

  h: number;

  w: number;

  starti: number;

  startj: number;

  constructor(squares: Square[][]) {
    this.starti = -1;
    this.startj = -1;
    this.squares = squares;
    this.h = squares.length;
    this.w = this.h ? squares[0].length : 0;
    for (let i = 0; i < squares.length; i += 1) {
      if (squares[i].length !== this.w) {
        throw new Error('width does not match');
      }
      for (let j = 0; j < squares[i].length; j += 1) {
        if (
          squares[i][j].type === 'block' &&
          (squares[i][j] as { type: 'block'; block: Block }).block === 'start'
        ) {
          this.starti = i;
          this.startj = j;
          this.squares[i][j] = airSquare();
        }
      }
    }
    if (this.starti === -1) throw new Error('start does not exist');
  }

  setParent(parent: GameMap) {
    this.parentMap = parent;
  }
}

export const airSquareI: Square = {
  type: 'air',
  name: '',
  movable: false,
  collidable: false,
  locked: false
};

export function airSquare() {
  return lodash.cloneDeep(airSquareI);
}

export const parentSquareI: Square = {
  type: 'block',
  block: 'parent',
  name: '..',
  movable: false,
  collidable: true,
  locked: false
};

export function parentSquare() {
  return lodash.cloneDeep(parentSquareI);
}

export const wallSquareI: Square = {
  type: 'block',
  block: 'wall',
  name: '',
  movable: false,
  collidable: true,
  locked: true
};

export function wallSquare() {
  return lodash.cloneDeep(wallSquareI);
}

export const startSquareI: Square = {
  type: 'block',
  block: 'start',
  name: '',
  movable: false,
  collidable: false,
  locked: false
};

export function startSquare() {
  return lodash.cloneDeep(startSquareI);
}

// export function squaresFrom(s: string[]): Square[][] {
// 	const h = s.length;
// 	if (!h) return [];
// 	const w = s[0].length;
// 	let ret = new Array<Square[]>(h).fill(
// 		new Array<Square>(w).fill(airSquare)
// 	);
// 	for (let i = 0; i < h; ++i){
// 		if (s[i].length !== w) throw new Error("not same width");
// 		for (let j = 0; j < w; ++j){
// 			switch (s[i][j]) {
// 				case '.':

// 					break;

// 				default:
// 					break;
// 			}
// 		}
// 	}
// 	return ret;
// }

// todo: History

export function squaresFromStage(s: Stage): Square[][] {
  const h = Math.max(8 + s.tests.length, 11);
  const w = 11;
  const ret: Square[][] = [];
  for (let i = 0; i < h; i += 1) {
    ret.push([]);
    for (let j = 0; j < w; j += 1) {
      ret[i].push(airSquare());
    }
  }

  ret[0][0] = {
    type: 'block',
    block: 'parent',
    name: '..',
    movable: false,
    collidable: true,
    locked: false
  };
  ret[0][1] = startSquare();
  for (let j = 0; j < w; j += 1) {
    ret[5][j] = {
      type: 'block',
      block: 'wall',
      name: '',
      movable: false,
      collidable: true,
      locked: false
    };
  }
  ret[5][5] = {
    type: 'block',
    block: 'submit',
    name: 'submit',
    movable: false,
    collidable: true,
    locked: false
  };
  ret[6][5] = {
    type: 'block',
    block: 'down',
    name: '',
    movable: false,
    collidable: false,
    locked: false
  };

  for (let k = 0; k < s.terms.length; k += 1) {
    // eslint-disable-next-line no-bitwise
    const i = 1 + ((k / 4) | 0) * 2;
    const j = 2 + (k % 4) * 2;
    ret[i][j] = s.terms[k];
  }

  for (let k = 0; k < s.tests.length; k += 1) {
    ret[7 + k][3] = s.tests[k].output;
    ret[7 + k][4] = {
      type: 'block',
      block: 'equal',
      name: '',
      movable: false,
      collidable: false,
      locked: false
    };
    ret[7 + k][5] = {
      type: 'block',
      block: 'place',
      name: '',
      movable: false,
      collidable: true,
      locked: false
    };
  }
  return ret;
}

export function squaresFromLam(t: Term): Square[][] {
  log(10, t);
  const ret = new Array<Square[]>(7).fill(
    new Array<Square>(6).fill(airSquare())
  );
  return ret;
}
