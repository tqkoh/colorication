import { codesFrom } from '../../../../utils/font';
import {
  Square,
  airSquare as ai,
  parentSquare as pa,
  startSquare as st
} from '../../gamemap';
import { Stage } from '../../stage';
import stage0 from './world0/stage0';
import stageExample from './world0/stageExample';

const stages: Stage[] = [stageExample, stage0];
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
  [ai(), s[1], ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai()],
  [ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai()],
  [ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai()],
  [ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), ai()]
];
export default mapWorld0;
