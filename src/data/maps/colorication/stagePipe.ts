import {
  airSquare as a,
  blockSquare as b, idSquare as i, oneSquare as o,
  parentSquare as p,
  startSquare as s,
  submitSquare as u,
  wallSquare as w,
  zeroSquare as z
} from "../../../scenes/play/squares";
import { Stage } from '../../../scenes/play/stage';

const stagePipe: Stage = new Stage(
  12,
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
    [w(), a(), a(), a(), a(), a(), a(), a(), w()],
    [w(), b(), w(), w(), w(), w(), z(), a(), w()],
    [u(), a(), a(), i(), i(), i(), i(), s(), p()],
    [w(), b(), w(), w(), w(), w(), o(), a(), w()],
    [w(), a(), a(), a(), a(), a(), a(), a(), w()]
  ]
);

export default stagePipe;
