import { Square } from '../../../../scenes/play/gamemap';
import { squaresFromAA } from '../../../../scenes/play/squares';
import { Stage } from '../../../../scenes/play/stage';
import { CLEAR_ALL } from '../../../../utils/deb';
import { codesFrom } from '../../../../utils/font';
import stagePipe2 from './stagePipe2';

const stages: Stage[] = [stagePipe2];
const s: Square[] = stages.map((stage) => ({
  Atype: 'stage',
  stage,
  name: codesFrom(stage.name),
  movable: CLEAR_ALL,
  collidable: true,
  locked: false,
  image: []
}));

export const mapGreenName = 'Green';

// prettier-ignore
const mapGreen = squaresFromAA([
  'ps...A....',
  '..........',
  '..........',
  '..........',
  '...........',
  '..........'
], [...s]); // kari
export default mapGreen;
