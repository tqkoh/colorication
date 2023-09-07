import {
  Square,
  airSquare as a,
  parentSquare as p,
  startSquare as s,
  submitSquare as u,
  wallSquare as w
} from '../../scenes/play/gamemap';
import { Stage } from '../../scenes/play/stage';
import { randomized } from '../../utils/term';

function i(): Square {
  return {
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
}

const stageCombination: Stage = new Stage(
  2,
  '2.',
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
    [w(), a(), a(), a(), a(), w(), w()],
    [w(), a(), a(), a(), a(), a(), a()],
    [u(), a(), a(), w(), i(), i(), i()],
    [w(), a(), a(), w(), a(), a(), w()],
    [w(), w(), w(), w(), a(), s(), p()]
  ]
);

export default stageCombination;
