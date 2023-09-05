import { randomized } from '../../../../../utils/term';
import {
  Square,
  airSquare as a,
  parentSquare as p,
  startSquare as s,
  submitSquare as u,
  wallSquare as w
} from '../../../gamemap';
import { Stage } from '../../../stage';

function i(): Square {
  return {
    Atype: 'term',
    term: randomized({
      Atype: 'lam',
      var: '0',
      ret: { Atype: 'var', var: '0' }
    }),
    name: [],
    movable: true,
    collidable: true,
    locked: true,
    image: []
  };
}

const stage2: Stage = new Stage(
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
        locked: true,
        image: []
      }
    }
  ],
  [
    [w(), a(), i(), i(), i(), w(), a(), p()],
    [u(), a(), a(), i(), i(), w(), a(), s()],
    [w(), i(), a(), a(), i(), w(), a(), a()],
    [w(), i(), i(), a(), a(), a(), a(), a()]
  ]
);

export default stage2;
