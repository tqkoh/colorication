import { randomized } from '../../../../../utils/term';
import { Stage } from '../../../gamemap';

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
