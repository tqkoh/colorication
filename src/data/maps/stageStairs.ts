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

const stageStairs: Stage = new Stage(
  3,
  '3. Stairs',
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
    [w(), a(), i(), i(), i(), w(), a(), p()],
    [u(), a(), a(), i(), i(), w(), a(), s()],
    [w(), i(), a(), a(), i(), w(), a(), a()],
    [w(), i(), i(), a(), a(), a(), a(), a()]
  ]
);

export default stageStairs;
