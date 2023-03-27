import { randomized } from '../../../../../utils/term';
import { Stage } from '../../../gamemap';

/*
1 コメを置くだけ。中身は見れない
(locked) Lam 0 (Var 0)
--
(locked) Lam 0 (Var 0)
(locked) Lam 1 (Lam 0 (Var 0)
(locked) Lam 2 (Lam 1 (Lam 0 (Var 0)))
*/

const stage0: Stage = {
  name: '0. place it',
  tests: [
    {
      input: [],
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
  terms: [
    {
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
    },
    {
      Atype: 'term',
      term: randomized({
        Atype: 'lam',
        var: '1',
        ret: {
          Atype: 'lam',
          var: '0',
          ret: { Atype: 'var', var: '0' }
        }
      }),
      name: [],
      movable: true,
      collidable: true,
      locked: true,
      image: []
    },
    {
      Atype: 'term',
      term: randomized({
        Atype: 'lam',
        var: '2',
        ret: {
          Atype: 'lam',
          var: '1',
          ret: {
            Atype: 'lam',
            var: '0',
            ret: { Atype: 'var', var: '0' }
          }
        }
      }),
      name: [],
      movable: true,
      collidable: true,
      locked: true,
      image: []
    }
  ]
};

export default stage0;
