import { squaresFromAA } from '../../scenes/play/squares';
import { Stage } from '../../scenes/play/stage';

const stageStairs: Stage = new Stage(
  3,
  '3.',
  [
    {
      input: [],
      output: {
        Atype: 'term',
        term: {
          Atype: 'lam',
          var: '0',
          ret: {
            Atype: 'var',
            var: '0'
          }
        },
        name: [],
        movable: false,
        collidable: true,
        locked: false,
        image: []
      }
    }
  ],
  // prettier-ignore
  squaresFromAA([
    '#.iii#.p',
    '!..ii#.s',
    '#i..i#..',
    '#ii.....'
  ], [])
);

export default stageStairs;
