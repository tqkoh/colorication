import { Square } from '../../../scenes/play/gamemap';
import { squaresFromAA } from '../../../scenes/play/squares';
import { Stage } from '../../../scenes/play/stage';
import { CLEAR_ALL } from '../../../utils/deb';
import { codesFrom } from '../../../utils/font';
import stageDoNotMix from './stageDoNotMix';
import stageMix from './stageMix';
import stagePipe from './stagePipe';

const stages: Stage[] = [stagePipe, stageMix, stageDoNotMix];
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
const mapColorication = squaresFromAA([
  'ps.......A',
  '........B.',
  '........C.',
  '........D.',
  '..........',
  '..........'
], [s[0], ...s]); // kari
// const mapColorication: Square[][] = [
//   [pa(), st(), ai(), ai(), s[0], ai()],
//   [ai(), ai(), ai(), ai(), s[1], ai()],
//   [ai(), ai(), ai(), ai(), s[2], ai()]
// ];
export default mapColorication;
