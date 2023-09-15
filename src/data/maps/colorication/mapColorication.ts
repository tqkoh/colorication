import {
  Square,
  airSquare as ai,
  parentSquare as pa,
  startSquare as st
} from '../../../scenes/play/gamemap';
import { Stage } from '../../../scenes/play/stage';
import { CLEAR_ALL } from '../../../utils/deb';
import { codesFrom } from '../../../utils/font';
import stageDoNotMix from './stageDoNotMix';
import stageMix from './stageMix';

const stages: Stage[] = [stageMix, stageDoNotMix];
const s: Square[] = stages.map((stage) => ({
  Atype: 'stage',
  stage,
  name: codesFrom(stage.name),
  movable: CLEAR_ALL,
  collidable: true,
  locked: false,
  image: []
}));

const mapColorication: Square[][] = [
  [pa(), st(), ai(), ai(), s[0], ai()],
  [ai(), ai(), ai(), ai(), s[1], ai()]
];
export default mapColorication;
