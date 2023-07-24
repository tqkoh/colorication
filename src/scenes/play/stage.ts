import { log } from '../../utils/deb';
import { GameMap, Square, airOutSquare, wallSquare } from './gamemap';

export type SquareWithCoords = {
  square: Square;
  i: number;
  j: number;
};

export type Test = {
  input: Square[];
  output: Square;
};

export type TestWithCoords = {
  input: SquareWithCoords[];
  output: SquareWithCoords;
};

export class Stage extends GameMap {
  tests: Test[];

  name: string;

  constructor(name: string, tests: Test[], squares: Square[][]) {
    log(10, 'constructor of Stage: squares:', squares);

    const s: Square[][] = [];
    for (let i = 0; i < squares.length; i += 1) {
      s.push([]);
      for (let j = 0; j < 2; j += 1) s[i].push(airOutSquare());
      s[i].push(wallSquare());
      for (let j = 0; j < squares[i].length; j += 1) s[i].push(squares[i][j]);
      if (tests.length && tests[0].input.length) {
        s[i].push(wallSquare());
        for (let k = 0; k < tests[0].input.length + 1; k += 1)
          s[i].push(airOutSquare());
      }
    }
    for (let i = 0; i < tests.length; i += 1) {
      const ci = Math.floor(squares.length / 2) - (tests.length - 1);
      log(8, ci);
      s[ci][1] = tests[i].output;
      if (tests[i].input.length) {
        for (let j = 0; j < tests[i].input.length; j += 1) {
          s[ci][squares[0].length + j + 4] = tests[i].input[j];
        }
      }
    }
    if (s.length % 2 === 0) {
      s.push(new Array<Square>(s[0].length).fill(wallSquare()));
    }
    if (s[0].length % 2 === 0) {
      for (let i = 0; i < s.length; i += 1) {
        s[i].push(wallSquare());
      }
    }

    super(s);
    this.name = name;
    this.tests = tests;
  }
}
