import { codesFrom } from '../../../../utils/font';
import {
  Square,
  airSquare as ai,
  parentSquare as pa,
  startSquare as st
} from '../../gamemap';
import { Stage } from '../../stage';
import stage0 from './world0/stage0';
import stage1 from './world0/stage1';
import stage2 from './world0/stage2';
import stageExample from './world0/stageExample';

const stages: Stage[] = [stageExample, stage0, stage1, stage2];
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
