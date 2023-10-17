import { GameMap, Square } from '../../../scenes/play/gamemap';
import { squaresFromAA } from '../../../scenes/play/squares';
import { Stage } from '../../../scenes/play/stage';
import { CLEAR_ALL } from '../../../utils/deb';
import { codesFrom } from '../../../utils/font';
import mapGreen, { mapGreenName } from './green/mapGreen';
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

const worldGreen: Square = {
  Atype: 'map',
  map: new GameMap(mapGreen),
  name: codesFrom(mapGreenName),
  movable: false,
  collidable: true,
  locked: false,
  image: []
};

export const mapColoricationName = 'Cyan';

// prettier-ignore
const mapColorication = squaresFromAA([
  'ps..B.....',
  '..........',
  '.........A',
  '..........',
  '...........',
  '..........'
], [worldGreen, ...s]); // kari
export default mapColorication;
