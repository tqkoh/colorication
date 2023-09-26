import { squaresFromAA } from '../../../scenes/play/squares';
import { Stage } from '../../../scenes/play/stage';

const stageMix: Stage = new Stage(
  10,
  '1.',
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
        locked: true,
        image: []
      }
    }
  ],
  squaresFromAA(
    ['#..###', '#.....', '!..1..', '..0.sp', '.....#', '###..#'],
    []
  )
);

export default stageMix;
