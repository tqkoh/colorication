import { squaresFromAA } from '../../scenes/play/squares';
import { Stage } from '../../scenes/play/stage';

const stageSokoban: Stage = new Stage(
  1,
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
        locked: false,
        image: []
      }
    }
  ],
  // prettier-ignore
  squaresFromAA(
    [
      'ps.#...',
      '.......',
      '!...###',
      '..#....',
      '###.i..',
      '#####..'
    ],
    []
  )
);

export default stageSokoban;
