import { randomized } from '../../../utils/term';
import {
  Square,
  airSquare as a,
  parentSquare as p,
  startSquare as s,
  submitSquare as u
} from '../gamemap';
import { Stage } from '../stage';

const ids: Square = {
  Atype: 'term',
  term: randomized({
    Atype: 'lam',
    var: '0',
    ret: { Atype: 'var', var: '0' }
  }),
  name: [],
  movable: true,
  collidable: true,
  locked: false,
  image: []
};

const stageRegulation: Stage = new Stage(
  '0. Regulation             press R to reset!',
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
  [
    [p(), s(), a(), a(), a()],
    [a(), a(), a(), a(), a()],
    [u(), a(), a(), ids, a()],
    [a(), a(), a(), a(), a()],
    [a(), a(), a(), a(), a()]
  ]
);

export default stageRegulation;
