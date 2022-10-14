import { randomized } from '../../../../../utils/term';
import { Stage } from '../../../gamemap';

/*
1 コメを置くだけ。中身は見れない
(locked) Lam 0 (Var 0)
--
(locked) Lam 0 (Var 0)
(locked) Lam 1 (Lam 0 (Var 0))
(locked) Lam 2 (Lam 1 (Lam 0 (Var 0)))
*/

const stage0: Stage = {
  name: '0. place it',
  tests: [
    {
      input: [],
      output: {
        type: 'term',
        term: {
          type: 'lam',
          var: '0',
          ret: { type: 'var', var: '0' }
        },
        name: '',
        movable: false,
        collidable: true,
        locked: true
      }
    }
  ],
  terms: [
    {
      type: 'term',
      term: randomized({
        type: 'lam',
        var: '0',
        ret: { type: 'var', var: '0' }
      }),
      name: '',
      movable: true,
      collidable: true,
      locked: true
    },
    {
      type: 'term',
      term: randomized({
        type: 'lam',
        var: '1',
        ret: {
          type: 'lam',
          var: '0',
          ret: { type: 'var', var: '0' }
        }
      }),
      name: '',
      movable: true,
      collidable: true,
      locked: true
    },
    {
      type: 'term',
      term: randomized({
        type: 'lam',
        var: '2',
        ret: {
          type: 'lam',
          var: '1',
          ret: {
            type: 'lam',
            var: '0',
            ret: { type: 'var', var: '0' }
          }
        }
      }),
      name: '',
      movable: true,
      collidable: true,
      locked: true
    }
  ]
};

export default stage0;
