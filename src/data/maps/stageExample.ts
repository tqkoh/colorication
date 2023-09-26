import { squaresFromAA } from '../../scenes/play/squares';
import { Stage } from '../../scenes/play/stage';

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
  squaresFromAA(['ps...', '...i.', '!...?', '...0.', '.....'], [])
);

export default stageExample;
