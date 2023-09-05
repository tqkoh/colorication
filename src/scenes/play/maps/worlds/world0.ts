import { codesFrom } from '../../../../utils/font';
import {
  Square,
  airSquare as ai,
  parentSquare as pa,
  startSquare as st
} from '../../gamemap';
import { Stage } from '../../stage';
import stageCombination from './world0/stageCombination';
import stageExample from './world0/stageExample';
import stageRegulation from './world0/stageRegulation';
import stageStairs from './world0/stageStairs';

const stages: Stage[] = [
  stageExample,
  stageRegulation,
  stageCombination,
  stageStairs
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

const mapWorld0: Square[][] = [
  [pa(), st(), ai(), ai(), s[0], ai(), ai(), ai(), ai(), ai(), ai()],
  [ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai()],
  [ai(), s[1], ai(), s[2], ai(), s[3], ai(), ai(), ai(), ai(), ai()],
  [ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai()],
  [ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai()],
  [ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai()]
];
export default mapWorld0;
