import { squaresFromAA } from '../../scenes/play/squares';
import { Stage } from '../../scenes/play/stage';

const stageCombination: Stage = new Stage(
  2,
  '2.',
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
  squaresFromAA(['#....##', '#......', '!..#iii', '#..#..#', '####.sp'], [])
);

export default stageCombination;
