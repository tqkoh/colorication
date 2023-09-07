import {
  Square,
  airSquare as a,
  parentSquare as p,
  startSquare as s,
  submitSquare as u
} from '../../scenes/play/gamemap';
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

const ins: Square = {
  Atype: 'term',
  term: randomized({
    Atype: 'var',
    var: '0'
  }),
  name: [],
  movable: false,
  collidable: true,
  locked: false,
  image: []
};

const stageExample = new Stage(
  9,
  'ex',
  [
    {
      input: [
        {
          Atype: 'term',
          term: {
            Atype: 'lam',
            var: '0',
            ret: {
              Atype: 'lam',
              var: '1',
              ret: { Atype: 'var', var: '1' }
            }
          },
          name: [],
          movable: false,
          collidable: true,
          locked: true,
          image: []
        },
        {
          Atype: 'term',
          term: {
            Atype: 'lam',
            var: '0',
            ret: {
              Atype: 'lam',
              var: '1',
              ret: { Atype: 'var', var: '1' }
            }
          },
          name: [],
          movable: false,
          collidable: true,
          locked: true,
          image: []
        }
      ],
      output: {
        Atype: 'term',
        term: {
          Atype: 'lam',
          var: '0',
          ret: {
            Atype: 'lam',
            var: '1',
            ret: { Atype: 'var', var: '1' }
          }
        },
        name: [],
        movable: false,
        collidable: true,
        locked: false,
        image: []
      }
    },
    {
      input: [
        {
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
        },
        {
          Atype: 'term',
          term: {
            Atype: 'lam',
            var: '0',
            ret: {
              Atype: 'lam',
              var: '1',
              ret: { Atype: 'var', var: '1' }
            }
          },
          name: [],
          movable: false,
          collidable: true,
          locked: false,
          image: []
        }
      ],
      output: {
        Atype: 'term',
        term: {
          Atype: 'lam',
          var: '0',
          ret: {
            Atype: 'lam',
            var: '1',
            ret: { Atype: 'var', var: '1' }
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
    [a(), a(), a(), ids, a()],
    [u(), a(), a(), a(), ins],
    [a(), a(), a(), zrs, a()],
    [a(), a(), a(), a(), a()]
  ]
);

export default stageExample;