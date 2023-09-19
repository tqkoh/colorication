import { GameMap, Square } from '../../scenes/play/gamemap';
import {
  airSquare as ai,
  parentSquare as pa,
  startSquare as st,
  wallSquare as wa
} from "../../scenes/play/squares";
import { CLEAR_ALL } from '../../utils/deb';
import { codesFrom } from '../../utils/font';

import { Stage } from '../../scenes/play/stage';
import mapColorication from './colorication/mapColorication';
import stageDoNotMix from './colorication/stageDoNotMix';
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
  stageRegulation,
  stageSokoban,
  stageCombination,
  stageStairs,
  stageRegulation,

  // debug 5..
  stageDoNotMix
];
const s: Square[] = stages.map((stage) => ({
  Atype: 'stage',
  stage,
  name: codesFrom(stage.name),
  movable: CLEAR_ALL,
  collidable: true,
  locked: false,
  image: []
}));

// prettier-ignore
const mapBeginning: Square[][] = [
  [ai(), ai(), ai(), ai(), ai(), ai(), wa(), wa(), wa(), wa(), wa(), wa(), wa()],
  [ai(), ai(), ai(), ai(), ai(), ai(), s[0], ai(), wa(), wa(), wa(), wa(), wa()],
  [ai(), ai(), ai(), wa(), wa(), wa(), ai(), ai(), wa(), wa(), wa(), wa(), wa()],
  [pa(), st(), ai(), wa(), wa(), wa(), ai(), ai(), wa(), wa(), ai(), ai(), ai()],
  [ai(), ai(), ai(), wa(), ai(), s[1], ai(), ai(), wa(), wa(), ai(), ai(), wo1],
  [wa(), wa(), wa(), wa(), ai(), ai(), wa(), wa(), wa(), ai(), ai(), ai(), ai()],
  [wa(), wa(), wa(), wa(), ai(), ai(), wa(), wa(), wa(), ai(), ai(), wa(), wa()],
  [wa(), wa(), wa(), wa(), ai(), s[2], wa(), ai(), ai(), s[4], wa(), wa(), wa()],
  [wa(), wa(), wa(), wa(), wa(), ai(), ai(), ai(), wa(), s[3], ai(), wa(), wa()],
  [wa(), wa(), wa(), wa(), wa(), ai(), ai(), ai(), ai(), ai(), ai(), wa(), wa()]
];

const wo0: Square = {
  Atype: 'map',
  map: new GameMap(mapBeginning),
  name: codesFrom('Beginning                 WASD to move!'),
  movable: false,
  collidable: true,
  locked: false,
  image: []
};

export const mapRoot: Square[][] = [[rett, st(), wo0]];

export const sandboxRoot: Square[][] = [
  [rett, st(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai()],
  [ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai()],
  [ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai()],
  [ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai()],
  [ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai()],
  [ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai()]
];

export default mapBeginning;
