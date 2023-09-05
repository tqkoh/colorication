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
  locked: true,
  image: []
};

const stageSokoban: Stage = new Stage(
  '1. Sokoban',
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
    [p(), s(), a(), w(), a(), a(), a()],
    [a(), a(), a(), a(), a(), a(), a()],
    [a(), a(), a(), a(), w(), w(), w()],
    [u(), a(), w(), a(), a(), a(), a()],
    [w(), w(), w(), a(), ids, a(), a()],
    [w(), w(), w(), w(), w(), a(), a()]
  ]
);

export default stageSokoban;