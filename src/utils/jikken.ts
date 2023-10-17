import { cloneDeep } from 'lodash';
import { recSquare } from '../scenes/play/squares';
import { log } from './deb';
import Term from './term';

export default function jikken() {
  log(9, 'jikken');
  const newSquare = recSquare();
  const squares = [[newSquare]];
  const s = squares[0][0];
  const modi: Term[] = [
    {
      Atype: 'var',
      var: '1'
    }
  ];
  if (s.Atype === 'term') {
    if (s.term.Atype === 'lam') {
      const r = s.term.ret.Atype === 'ref' ? s.term.ret.ref : s.term.ret;
      log(9, cloneDeep(r), cloneDeep(s.term));
      s.term.var = '0';
      [s.term.ret] = modi;
      log(9, cloneDeep(r), cloneDeep(s.term));
    }
  }
}
