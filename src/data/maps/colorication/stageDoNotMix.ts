import { squaresFromAA } from '../../../scenes/play/squares';
import { Stage } from '../../../scenes/play/stage';

const stageDoNotMix: Stage = new Stage(
  11,
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
  squaresFromAA(
    [
      '###.b.###',
      '#..#01..#',
      '#...i.#.#',
      '!....##sp',
      '#...i.#.#',
      '#..#01..#',
      '###.b.###'
    ],
    []
  )
);

export default stageDoNotMix;
