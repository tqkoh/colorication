import { cloneDeep } from 'lodash';
import { randomized } from '../../utils/term';
import { Square } from './gamemap';

export const airSquareI: Square = {
  Atype: 'air',
  airtype: 'normal',
  name: [],
  movable: false,
  collidable: false,
  locked: false,
  image: []
};

export const airOutSquareI: Square = {
  Atype: 'air',
  airtype: 'out',
  name: [],
  movable: false,
  collidable: false,
  locked: false,
  image: []
};

export const parentSquareI: Square = {
  Atype: 'block',
  block: 'parent',
  name: [],
  movable: false,
  collidable: true,
  locked: false,
  image: []
};

export const submitSquareI: Square = {
  Atype: 'block',
  block: 'submit',
  name: [],
  movable: false,
  collidable: true,
  locked: false,
  image: []
};

export const wallSquareI: Square = {
  Atype: 'block',
  block: 'wall',
  name: [],
  movable: false,
  collidable: true,
  locked: false,
  image: []
};

export const startSquareI: Square = {
  Atype: 'block',
  block: 'start',
  name: [],
  movable: false,
  collidable: false,
  locked: false,
  image: []
};

const idSquareI: Square = {
  Atype: 'term',
  term: randomized({
    Atype: 'lam',
    var: '0',
    ret: {
      Atype: 'var',
      var: '0'
    }
  }),
  name: [],
  movable: true,
  collidable: true,
  locked: false,
  image: []
};
const zeroSquareI: Square = {
  Atype: 'term',
  term: randomized({
    Atype: 'lam',
    var: '0',
    ret: {
      Atype: 'lam',
      var: '1',
      ret: { Atype: 'var', var: '1' }
    }
  }),
  name: [],
  movable: true,
  collidable: true,
  locked: false,
  image: []
};
const oneSquareI: Square = {
  Atype: 'term',
  term: randomized({
    Atype: 'lam',
    var: '0',
    ret: {
      Atype: 'lam',
      var: '1',
      ret: {
        Atype: 'app',
        lam: { Atype: 'var', var: '0' },
        param: { Atype: 'var', var: '1' }
      }
    }
  }),
  name: [],
  movable: true,
  collidable: true,
  locked: false,
  image: []
};

const blockSquareI: Square = {
  Atype: 'block',
  block: 'solid',
  name: [],
  movable: true,
  collidable: true,
  locked: false,
  image: []
};

const inputSquareI: Square = {
  Atype: 'term',
  term: randomized({
    Atype: 'var',
    var: '0'
  }),
  name: [],
  movable: false,
  collidable: true,
  locked: false,
  image: []
};

export function airSquare() {
  return cloneDeep(airSquareI);
}
export function airOutSquare() {
  return cloneDeep(airOutSquareI);
}
export function parentSquare() {
  return cloneDeep(parentSquareI);
}
export function submitSquare() {
  return cloneDeep(submitSquareI);
}
export function wallSquare() {
  return cloneDeep(wallSquareI);
}
export function startSquare() {
  return cloneDeep(startSquareI);
}
export function zeroSquare(): Square {
  return cloneDeep(zeroSquareI);
}
export function idSquare(): Square {
  return cloneDeep(idSquareI);
}
export function oneSquare(): Square {
  return cloneDeep(oneSquareI);
}
export function blockSquare(): Square {
  return cloneDeep(blockSquareI);
}
export function inputSquare(): Square {
  return cloneDeep(inputSquareI);
}

export function squaresFromAA(aa: string[], alphabets: Square[]): Square[][] {
  const h = aa.length;
  const w = aa[0].length;
  const ret: Square[][] = [];
  for (let i = 0; i < h; i += 1) {
    ret.push([]);
    for (let j = 0; j < w; j += 1) {
      if (aa[i][j] === '.') {
        ret[i].push(airSquare());
      } else if (aa[i][j] === '#') {
        ret[i].push(wallSquare());
      } else if (aa[i][j] === 'p') {
        ret[i].push(parentSquare());
      } else if (aa[i][j] === 's') {
        ret[i].push(startSquare());
      } else if (aa[i][j] === '!') {
        ret[i].push(submitSquare());
      } else if (aa[i][j] === '?') {
        ret[i].push(inputSquare());
      } else if (aa[i][j] === 'b') {
        ret[i].push(blockSquare());
      } else if (aa[i][j] === 'i') {
        ret[i].push(idSquare());
      } else if (aa[i][j] === '0') {
        ret[i].push(zeroSquare());
      } else if (aa[i][j] === '1') {
        ret[i].push(oneSquare());
      } else if (
        'A'.charCodeAt(0) <= aa[i][j].charCodeAt(0) &&
        aa[i][j].charCodeAt(0) <= 'Z'.charCodeAt(0)
      ) {
        ret[i].push(alphabets[aa[i][j].charCodeAt(0) - 'A'.charCodeAt(0)]);
      }
    }
  }
  return ret;
}
