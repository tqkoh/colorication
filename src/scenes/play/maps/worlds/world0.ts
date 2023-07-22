import { codesFrom } from '../../../../utils/font';
import {
  Square,
  airSquare as a,
  parentSquare as p,
  startSquare as s
} from '../../gamemap';
import stage0 from './world0/stage0';

const st0: Square = {
  Atype: 'stage',
  stage: stage0,
  name: codesFrom(stage0.name),
  movable: false,
  collidable: true,
  locked: false,
  image: []
};

const mapWorld0: Square[][] = [
  [p(), s(), a(), a(), a(), a(), a(), a(), a(), a(), a()],
  [a(), a(), a(), a(), a(), a(), a(), a(), a(), a(), a()],
  [a(), st0, a(), a(), a(), a(), a(), a(), a(), a(), a()],
  [a(), a(), a(), a(), a(), a(), a(), a(), a(), a(), a()],
  [a(), a(), a(), a(), a(), a(), a(), a(), a(), a(), a()],
  [a(), a(), a(), a(), a(), a(), a(), a(), a(), a(), a()]
];
export default mapWorld0;
