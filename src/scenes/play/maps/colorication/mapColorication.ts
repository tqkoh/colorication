import { codesFrom } from '../../../../utils/font';
import {
  Square,
  airSquare as ai,
  parentSquare as pa,
  startSquare as st
} from '../../gamemap';
import { Stage } from '../../stage';
import stageRegulation from '../stageRegulation';

const stages: Stage[] = [stageRegulation];
const s: Square[] = stages.map((stage) => ({
  Atype: 'stage',
  stage,
  name: codesFrom(stage.name),
  movable: false,
  collidable: true,
  locked: false,
  image: []
}));

const mapColorication: Square[][] = [
  [pa(), st(), ai(), ai(), ai(), ai(), ai(), ai(), ai(), s[0]]
];
export default mapColorication;
