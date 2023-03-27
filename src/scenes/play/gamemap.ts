/* eslint-disable no-use-before-define */
import * as lodash from 'lodash';
import { cloneDeep } from 'lodash';
import Phaser from 'phaser';
import { log } from '../../utils/deb';
import { codesFrom } from '../../utils/font';
import Term from '../../utils/term';

export type Direction = 'right' | 'down' | 'left' | 'up';

export type Block =
  | 'start'
  | 'parent'
  | 'return_title'
  | 'reset'
  | 'submit'
  | 'apply'
  | 'equal'
  | 'place'
  | 'down'
  | 'wall'
  | 'lam_var'
  | 'lam_ret';

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
  | { Atype: 'air' }
  | { Atype: 'term'; term: Term; map?: GameMap }
  | { Atype: 'map'; map: GameMap }
  | { Atype: 'stage'; stage: Stage; map?: GameMap }
  | { Atype: 'block'; block: Block }
) & {
  name: number[];
  movable: boolean;
  collidable: boolean;
  locked: boolean;
  image: Phaser.GameObjects.Image[];
};

export class GameMap {
  // eslint-disable-next-line no-use-before-define
  parentMap: GameMap | undefined;

  squares: Square[][];

  h: number;

  w: number;

  starti: number;

  startj: number;

  startd: Direction;

  constructor(squares: Square[][], from: GameMap | undefined = undefined) {
    if (from) {
      this.starti = from.starti;
      this.startj = from.startj;
      this.startd = from.startd;
    } else {
      this.starti = -1;
      this.startj = -1;
      this.startd = 'right';
    }
    this.squares = cloneDeep(squares);
    this.h = squares.length;
    this.w = this.h ? squares[0].length : 0;
    for (let i = 0; i < squares.length; i += 1) {
      if (squares[i].length !== this.w) {
        throw new Error('width does not match');
      }
      for (let j = 0; j < squares[i].length; j += 1) {
        if (
          squares[i][j].Atype === 'block' &&
          (squares[i][j] as { Atype: 'block'; block: Block }).block === 'start'
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
  Atype: 'air',
  name: [],
  movable: false,
  collidable: false,
  locked: false,
  image: []
};

export function airSquare() {
  return lodash.cloneDeep(airSquareI);
}

export const parentSquareI: Square = {
  Atype: 'block',
  block: 'parent',
  name: [],
  movable: false,
  collidable: true,
  locked: false,
  image: []
};

export function parentSquare() {
  return lodash.cloneDeep(parentSquareI);
}

export const wallSquareI: Square = {
  Atype: 'block',
  block: 'wall',
  name: [],
  movable: false,
  collidable: true,
  locked: true,
  image: []
};

export function wallSquare() {
  return lodash.cloneDeep(wallSquareI);
}

export const startSquareI: Square = {
  Atype: 'block',
  block: 'start',
  name: [],
  movable: false,
  collidable: false,
  locked: false,
  image: []
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
    Atype: 'block',
    block: 'parent',
    name: [],
    movable: false,
    collidable: true,
    locked: false,
    image: []
  };
  ret[0][1] = startSquare();
  for (let j = 0; j < w; j += 1) {
    ret[5][j] = {
      Atype: 'block',
      block: 'wall',
      name: [],
      movable: false,
      collidable: true,
      locked: false,
      image: []
    };
  }
  ret[5][5] = {
    Atype: 'block',
    block: 'submit',
    name: codesFrom('submit'),
    movable: false,
    collidable: true,
    locked: false,
    image: []
  };
  ret[6][5] = {
    Atype: 'block',
    block: 'down',
    name: [],
    movable: false,
    collidable: false,
    locked: false,
    image: []
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
      Atype: 'block',
      block: 'equal',
      name: [],
      movable: false,
      collidable: false,
      locked: false,
      image: []
    };
    ret[7 + k][5] = {
      Atype: 'block',
      block: 'place',
      name: [],
      movable: false,
      collidable: true,
      locked: false,
      image: []
    };
  }
  return ret;
}

function squaresFromLam(v: string, r: Term) {
  const h = 5;
  const w = 7;
  const ret: Square[][] = [];
  for (let i = 0; i < h; i += 1) {
    ret.push([]);
    for (let j = 0; j < w; j += 1) {
      ret[i].push(airSquare());
    }
  }
  ret[0][0] = {
    Atype: 'block',
    block: 'parent',
    name: [],
    movable: false,
    collidable: true,
    locked: false,
    image: []
  };
  ret[0][1] = startSquare();

  ret[2][0] = {
    Atype: 'block',
    block: 'lam_ret',
    name: [],
    movable: false,
    collidable: false,
    locked: false,
    image: []
  };
  ret[2][1] = {
    Atype: 'term',
    term: r,
    name: [],
    movable: true,
    collidable: true,
    locked: false,
    image: []
  };
  ret[2][5] = {
    Atype: 'term',
    term: {
      Atype: 'var',
      var: v
    },
    name: [],
    movable: false,
    collidable: true,
    locked: false,
    image: []
  };
  ret[2][6] = {
    Atype: 'block',
    block: 'lam_var',
    name: [],
    movable: false,
    collidable: false,
    locked: false,
    image: []
  };

  return ret;
}

function squaresFromApp(l: Term, p: Term) {
  const h = 5;
  const w = 7;
  const ret: Square[][] = [];
  for (let i = 0; i < h; i += 1) {
    ret.push([]);
    for (let j = 0; j < w; j += 1) {
      ret[i].push(airSquare());
    }
  }
  ret[0][0] = {
    Atype: 'block',
    block: 'parent',
    name: [],
    movable: false,
    collidable: true,
    locked: false,
    image: []
  };
  ret[0][1] = startSquare();
  ret[2][2] = {
    Atype: 'term',
    term: l,
    name: [],
    movable: true,
    collidable: true,
    locked: false,
    image: []
  };
  ret[2][3] = {
    Atype: 'block',
    block: 'apply',
    name: [],
    movable: false,
    collidable: false,
    locked: false,
    image: []
  };
  ret[2][4] = {
    Atype: 'term',
    term: p,
    name: [],
    movable: true,
    collidable: true,
    locked: false,
    image: []
  };

  return ret;
}
export function squaresFromTerm(t: Term): Square[][] {
  log(10, t);
  if (t.Atype === 'lam') {
    return squaresFromLam(t.var, t.ret);
  }
  if (t.Atype === 'app') {
    return squaresFromApp(t.lam, t.param);
  }
  throw new Error('var cant become map');
}

export function cloneSquare(s: Square, addMovable: boolean = true): Square {
  if (s.Atype === 'air' || s.Atype === 'block') {
    return {
      ...s,
      movable: addMovable,
      image: []
    };
  }
  if (!s.map) {
    return {
      ...s,
      movable: addMovable,
      image: []
    };
  }

  log(10, s.map);
  const newMap = new GameMap(
    s.map.squares.map((col) => col.map((sq) => cloneSquare(sq, false))),
    s.map
  );
  const ret: Square = {
    ...s,
    map: newMap,
    movable: addMovable,
    image: []
  };
  return ret;
}
