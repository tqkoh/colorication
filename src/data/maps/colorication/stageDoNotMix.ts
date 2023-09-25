import {
  airSquare as a,
  blockSquare as b,
  idSquare as i,
  oneSquare as o,
  parentSquare as p,
  startSquare as s,
  submitSquare as u,
  wallSquare as w,
  zeroSquare as z
} from '../../../scenes/play/squares';
import { Stage } from '../../../scenes/play/stage';

const stageDoNotMix: Stage = new Stage(
  11,
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
  [
    [w(), w(), w(), a(), b(), a(), w(), w(), w()],
    [w(), a(), a(), w(), z(), o(), a(), a(), w()],
    [w(), a(), a(), a(), i(), a(), w(), a(), w()],
    [u(), a(), a(), a(), a(), w(), w(), s(), p()],
    [w(), a(), a(), a(), i(), a(), w(), a(), w()],
    [w(), a(), a(), w(), z(), o(), a(), a(), w()],
    [w(), w(), w(), a(), b(), a(), w(), w(), w()]
  ]
);

export default stageDoNotMix;
