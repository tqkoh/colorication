/* eslint-disable no-use-before-define */
import { cloneDeep } from 'lodash';
import Phaser from 'phaser';
import { log } from '../../utils/deb';
import Term, { randomized } from '../../utils/term';
import { airSquare, startSquare } from './squares';
import { Stage } from './stage';

export type Direction = 'right' | 'down' | 'left' | 'up';

export function opposite(d: Direction): Direction {
  switch (d) {
    case 'up':
      return 'down';
    case 'down':
      return 'up';
    case 'left':
      return 'right';
    case 'right':
      return 'left';
    default:
      return 'left';
  }
}

export type Block =
  | 'solid'
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
  | 'lam_ret'
  | 'notblock';

export type Square = (
  | { Atype: 'air'; airtype: 'normal' | 'out' }
  | { Atype: 'term'; term: Term; map?: GameMap }
  | { Atype: 'map'; map: GameMap }
  | { Atype: 'stage'; stage: Stage; map?: GameMap; term?: Term }
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

  onEnter: Function;

  constructor(
    squares: Square[][],
    from: GameMap | undefined = undefined,
    onEnter: Function | undefined = undefined
  ) {
    if (onEnter) this.onEnter = onEnter;
    else this.onEnter = () => {};
    if (from) {
      this.starti = from.starti;
      this.startj = from.startj;
      this.startd = from.startd;
    } else {
      this.starti = -1;
      this.startj = -1;
      this.startd = 'right';
      for (let i = 0; i < squares.length; i += 1) {
        for (let j = 0; j < squares[i].length; j += 1) {
          const s = squares[i][j];
          if (s.Atype === 'block' && s.block === 'parent') {
            // 4 方向確認して start があればその方向を startd にする
            const d = [
              [0, 1],
              [1, 0],
              [0, -1],
              [-1, 0]
            ];
            for (let k = 0; k < 4; k += 1) {
              const ni = i + d[k][0];
              const nj = j + d[k][1];
              if (
                ni >= 0 &&
                ni < squares.length &&
                nj >= 0 &&
                nj < squares[ni].length
              ) {
                const sn = squares[ni][nj];
                if (sn.Atype === 'block' && sn.block === 'start') {
                  this.starti = ni;
                  this.startj = nj;
                  this.startd = ['right', 'down', 'left', 'up'][k] as Direction;
                }
              }
            }
          }
        }
      }
    }
    this.squares = cloneDeep(squares);
    log(10, 'constructor of GameMap: clone squares', squares);
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

  enter() {
    this.onEnter();
  }

  setParent(parent: GameMap) {
    this.parentMap = parent;
  }
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
  if (t.Atype === 'ref') {
    log(1, 'ref before lam become squares');
    if (t.ref && t.ref.Atype === 'lam') {
      return squaresFromLam(t.ref.var, t.ref.ret);
    }
    throw new Error('ref is not lam');
  }
  throw new Error('var cant become map');
}

export function cloneSquare(
  s: Square,
  addMovable: boolean = true,
  randomize = false
): Square {
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

  if (s.Atype === 'term' && (randomize || s.term.Atype === 'ref')) {
    return {
      ...s,
      term: randomized(s.term),
      map: undefined,
      movable: s.movable || addMovable,
      image: []
    };
  }
  return {
    ...s,
    map: new GameMap(
      s.map.squares.map((col) =>
        col.map((sq) => cloneSquare(sq, false, randomize))
      ),
      s.map
    ),
    movable: s.movable || addMovable,
    image: []
  };
}
