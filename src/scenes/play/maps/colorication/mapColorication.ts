import { CLEAR_ALL } from '../../../../utils/deb';
import { codesFrom } from '../../../../utils/font';
import {
  Square,
  airSquare as ai,
  parentSquare as pa,
  startSquare as st
} from '../../gamemap';
import { Stage } from '../../stage';
import stageColorication from './stageColorication';

const stages: Stage[] = [stageColorication];
const s: Square[] = stages.map((stage) => ({
  Atype: 'stage',
  stage,
  name: codesFrom(stage.name),
  movable: CLEAR_ALL,
  collidable: true,
  locked: false,
  image: []
}));

const mapColorication: Square[][] = [[pa(), st(), ai(), ai(), s[0]]];
export default mapColorication;
