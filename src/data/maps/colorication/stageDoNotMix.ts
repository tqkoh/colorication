import { cloneDeep } from 'lodash';
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

const ids: Square = {
  Atype: 'term',
  term: randomized({
    Atype: 'lam',
    var: '0',
    ret: {
      Atype: 'var',
      var: '0'
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

const blk: Square = {
  Atype: 'block',
  block: 'solid',
  name: [],
  movable: true,
  collidable: true,
  locked: false,
  image: []
};

function z(): Square {
  return cloneDeep(zrs);
}
function i(): Square {
  return cloneDeep(ids);
}
function o(): Square {
  return cloneDeep(ons);
}
function b(): Square {
  return cloneDeep(blk);
}

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
