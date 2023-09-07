import {
  Square,
  airSquare as a,
  parentSquare as p,
  startSquare as s,
  submitSquare as u,
  wallSquare as w
} from '../../../scenes/play/gamemap';
import { Stage } from '../../../scenes/play/stage';
import { randomized } from '../../../utils/term';

const ons: Square = {
  Atype: 'term',
  term: randomized({
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
  }),
  name: [],
  movable: true,
  collidable: true,
  locked: false,
  image: []
};

const zrs: Square = {
  Atype: 'term',
  term: randomized({
    Atype: 'lam',
    var: '0',
    ret: {
      Atype: 'lam',
      var: '1',
      ret: { Atype: 'var', var: '1' }
    }
  }),
  name: [],
  movable: true,
  collidable: true,
  locked: false,
  image: []
};

const stageColorication: Stage = new Stage(
  10,
  '0. Colorication',
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
    [w(), s(), a(), w(), w(), w()],
    [w(), a(), a(), a(), a(), a()],
    [u(), a(), a(), ons, a(), a()],
    [a(), a(), zrs, a(), s(), p()],
    [a(), a(), a(), a(), a(), w()],
    [w(), w(), w(), a(), a(), w()]
  ]
);

export default stageColorication;
