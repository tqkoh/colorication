import { GameMap, Square } from '../../scenes/play/gamemap';
import { squaresFromAA, startSquare as st } from '../../scenes/play/squares';
import { CLEAR_ALL } from '../../utils/deb';
import { codesFrom } from '../../utils/font';

import { Stage } from '../../scenes/play/stage';
import mapColorication from './colorication/mapColorication';
import stagePipe2 from './colorication/stagePipe2';
import stageCombination from './stageCombination';
import stageRegulation from './stageRegulation';
import stageSokoban from './stageSokoban';
import stageStairs from './stageStairs';

const wo1: Square = {
  Atype: 'map',
  map: new GameMap(mapColorication, undefined, () => {
    // skills.enterTerm = true;
  }),
  name: codesFrom('Colorication'),
  movable: false,
  collidable: true,
  locked: false,
  image: []
};
const rett: Square = {
  Atype: 'block',
  block: 'return_title',
  name: [],
  movable: false,
  collidable: true,
  locked: false,
  image: []
};

const stages: Stage[] = [
  stageRegulation, // B
  stageSokoban, // C
  stageCombination, // D
  stageStairs, // E
  stageRegulation, // F

  stagePipe2 // debug G
];
const stagesquares: Square[] = stages.map((stage) => ({
  Atype: 'stage',
  stage,
  name: codesFrom(stage.name),
  movable: CLEAR_ALL,
  collidable: true,
  locked: false,
  image: []
}));

const mapBeginningAA = [
  '......#######',
  '......B.#####',
  '...###..#####',
  'ps.###..##...',
  '...#.C..##..A',
  '####..###....',
  '####..###..##',
  '####.D#..F###',
  '#####...#E.##',
  '#####......##'
];
const mapBeginning = squaresFromAA(mapBeginningAA, [wo1, ...stagesquares]);

const wo0: Square = {
  Atype: 'map',
  map: new GameMap(mapBeginning),
  name: codesFrom('Beginning            WASD to move, R to reset!'),
  movable: false,
  collidable: true,
  locked: false,
  image: []
};

export const mapRoot: Square[][] = [[rett, st(), wo0]];

export const sandboxRoot: Square[][] = squaresFromAA(
  [
    'As.........',
    '...........',
    '...........',
    '...........',
    '...........',
    '...........'
  ],
  [rett]
);

export default mapBeginning;
