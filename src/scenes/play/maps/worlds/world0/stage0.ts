import {
  Square,
  airSquare as a,
  parentSquare as p,
  startSquare as s,
  submitSquare as u
} from '../../../gamemap';
import { Stage } from '../../../stage';

/*
1 コメを置くだけ。中身は見れない
(locked) Lam 0 (Var 0)
--
(locked) Lam 0 (Var 0)
(locked) Lam 1 (Lam 0 (Var 0)
(locked) Lam 2 (Lam 1 (Lam 0 (Var 0)))
*/

const ids: Square = {
  Atype: 'term',
  term: {
    Atype: 'lam',
    var: '0',
    ret: { Atype: 'var', var: '0' }
  },
  name: [],
  movable: true,
  collidable: true,
  locked: true,
  image: []
};

const zrs: Square = {
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
  movable: true,
  collidable: true,
  locked: true,
  image: []
};

const stage0 = new Stage(
  '0.',
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
        }
      ],
      output: {
        Atype: 'term',
        term: {
          Atype: 'lam',
          var: '0',
          ret: { Atype: 'var', var: '0' }
        },
        name: [],
        movable: false,
        collidable: true,
        locked: true,
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
          ret: { Atype: 'var', var: '0' }
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
    [p(), s(), a(), a(), a()],
    [a(), a(), a(), ids, a()],
    [u(), a(), a(), a(), a()],
    [a(), a(), a(), zrs, a()],
    [a(), a(), a(), a(), a()]
  ]
);

export default stage0;
