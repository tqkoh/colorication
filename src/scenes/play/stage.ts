import { log } from '../../utils/deb';
import { GameMap, Square } from './gamemap';
import { airOutSquare, wallSquare } from './squares';

export type Test = {
  input: Square[];
  output: Square;
};

export class Stage extends GameMap {
  tests: Test[];

  inputCoords: [number, number][][] = [];

  outputCoords: [number, number][] = [];

  id: number;

  name: string;

  constructor(id: number, name: string, tests: Test[], squares: Square[][]) {
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

    const inputCoords: [number, number][][] = [];

    const outputCoords: [number, number][] = [];

    for (let i = 0; i < tests.length; i += 1) {
      inputCoords.push([]);
      const ci =
        Math.floor((squares.length - 1) / 2) - (tests.length - 1) + i * 2;
      log(8, ci);
      s[ci][1] = tests[i].output;
      outputCoords.push([ci, 1]);
      if (tests[i].input.length) {
        for (let j = 0; j < tests[i].input.length; j += 1) {
          s[ci][squares[0].length + j + 4] = tests[i].input[j];
          inputCoords[i].push([ci, squares[0].length + j + 4]);
        }
      }
    }
    log(100, 'tests', inputCoords, outputCoords);
    if (s.length % 2 === 0) {
      s.push(new Array<Square>(s[0].length).fill(wallSquare()));
    }
    if (s[0].length % 2 === 0) {
      for (let i = 0; i < s.length; i += 1) {
        s[i].push(wallSquare());
      }
    }

    super(s);
    this.id = id;
    this.name = name;
    this.tests = tests;
    this.inputCoords = inputCoords;
    this.outputCoords = outputCoords;
  }
}
