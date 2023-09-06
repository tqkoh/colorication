import { codesFrom } from '../../../utils/font';
import {
  GameMap,
  Square,
  airSquare as ai,
  startSquare as st,
  wallSquare as wa
} from '../gamemap';

import { Stage } from '../stage';
import mapColorication from './colorication/mapColorication';
import stageCombination from './stageCombination';
import stageRegulation from './stageRegulation';
import stageSokoban from './stageSokoban';
import stageStairs from './stageStairs';

const wo0: Square = {
  Atype: 'map',
  map: new GameMap(mapColorication),
  name: codesFrom('w0'),
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
  stageRegulation
];
const s: Square[] = stages.map((stage) => ({
  Atype: 'stage',
  stage,
  name: codesFrom(stage.name),
  movable: false,
  collidable: true,
  locked: false,
  image: []
}));

const mapRoot: Square[][] = [
  [
    ai(),
    ai(),
    ai(),
    ai(),
    ai(),
    ai(),
    wa(),
    wa(),
    wa(),
    wa(),
    wa(),
    wa(),
    wa()
  ],
  [
    ai(),
    ai(),
    ai(),
    ai(),
    ai(),
    ai(),
    s[0],
    ai(),
    wa(),
    wa(),
    wa(),
    wa(),
    wa()
  ],
  [
    ai(),
    ai(),
    ai(),
    wa(),
    wa(),
    wa(),
    ai(),
    ai(),
    wa(),
    wa(),
    wa(),
    wa(),
    wa()
  ],
  [
    rett,
    st(),
    ai(),
    wa(),
    wa(),
    wa(),
    ai(),
    ai(),
    wa(),
    ai(),
    ai(),
    ai(),
    ai()
  ],
  [ai(), ai(), ai(), wa(), ai(), s[1], ai(), ai(), wa(), ai(), ai(), ai(), wo0],
  [
    wa(),
    wa(),
    wa(),
    wa(),
    ai(),
    ai(),
    wa(),
    wa(),
    wa(),
    ai(),
    ai(),
    ai(),
    ai()
  ],
  [
    wa(),
    wa(),
    wa(),
    wa(),
    ai(),
    ai(),
    wa(),
    wa(),
    wa(),
    ai(),
    ai(),
    wa(),
    wa()
  ],
  [
    wa(),
    wa(),
    wa(),
    wa(),
    ai(),
    s[2],
    wa(),
    ai(),
    ai(),
    s[4],
    wa(),
    wa(),
    wa()
  ],
  [
    wa(),
    wa(),
    wa(),
    wa(),
    wa(),
    ai(),
    ai(),
    ai(),
    wa(),
    s[3],
    wa(),
    wa(),
    wa()
  ],
  [wa(), wa(), wa(), wa(), wa(), ai(), ai(), ai(), ai(), ai(), wa(), wa(), wa()]
];

export const sandboxRoot: Square[][] = [
  [rett, st(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai()],
  [ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai()],
  [ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai()],
  [ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai()],
  [ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai()],
  [ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai()]
];

export default mapRoot;
