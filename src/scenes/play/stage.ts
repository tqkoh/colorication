import { log } from '../../utils/deb';
import { GameMap, Square } from './gamemap';

export type Test = {
  input: Square[];
  output: Square;
};

export class Stage extends GameMap {
  tests: Test[];

  name: string;

  constructor(name: string, tests: Test[], squares: Square[][]) {
    log(10, 'constructor of Stage: squares:', squares);
    super(squares);
    this.name = name;
    this.tests = tests;
  }
}
