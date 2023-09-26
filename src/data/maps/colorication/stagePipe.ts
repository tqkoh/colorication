import { squaresFromAA } from '../../../scenes/play/squares';
import { Stage } from '../../../scenes/play/stage';

const stagePipe: Stage = new Stage(
  12,
  '0.',
  [
    {
      input: [],
      output: {
        Atype: 'term',
        term: {
          Atype: 'lam',
          var: '0',
          ret: {
            Atype: 'lam',
            var: '1',
            ret: {
              Atype: 'app',
              lam: { Atype: 'var', var: '0' },
              param: { Atype: 'var', var: '1' }
            }
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
  // prettier-ignore
  squaresFromAA(
    [
      '.b..##..#',
      '#b#.##i.#',
      '!.iiii0sp',
      '#b####1.#',
      '#i......#',
      '#..######'
    ],
    []
  )
);

export default stagePipe;
