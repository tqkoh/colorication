import { Square } from '../../scenes/play/gamemap';
import {
  airSquare as a,
  parentSquare as p,
  startSquare as s,
  submitSquare as u,
  wallSquare as w
} from '../../scenes/play/squares';
import { Stage } from '../../scenes/play/stage';
import { randomized } from '../../utils/term';

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
  [
    [p(), s(), a(), w(), a(), a(), a()],
    [a(), a(), a(), a(), a(), a(), a()],
    [u(), a(), a(), a(), w(), w(), w()],
    [a(), a(), w(), a(), a(), a(), a()],
    [w(), w(), w(), a(), ids, a(), a()],
    [w(), w(), w(), w(), w(), a(), a()]
  ]
);

export default stageSokoban;
