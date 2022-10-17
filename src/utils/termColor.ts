import hash from 'object-hash';
import { match } from 'ts-pattern';
import { Square } from '../scenes/play/gamemap';
import { log } from './deb';
import Term, { normalized } from './term';

const MAX_REDUCE_TERM_DEPTH = 20;
const MAX_REDUCE_TERM_COUNT = 500;
let depth = 0;
let count = 0;

function reduceTerm(t: Term): Term {
  depth += 1;
  log(100, depth, count);
  if (MAX_REDUCE_TERM_DEPTH < depth || MAX_REDUCE_TERM_COUNT < count) {
    depth -= 1;
    return {
      Atype: 'var',
      var: 'omitted'
    };
  }
  count += 1;

  return match<Term, Term>(t)
    .with({ Atype: 'var' }, (va) => {
      depth -= 1;
      return {
        Atype: 'var',
        var: va.var
      };
    })
    .with({ Atype: 'app' }, (ap) => {
      const reducedLam = reduceTerm(ap.lam);
      const reducedParam = reduceTerm(ap.param);
      depth -= 1;
      return {
        Atype: 'app',
        lam: reducedLam,
        param: reducedParam
      };
    })
    .with({ Atype: 'lam' }, (la) => {
      const reducedRet = reduceTerm(la.ret);
      depth -= 1;
      return {
        Atype: 'lam',
        var: la.var,
        ret: reducedRet
      };
    })
    .exhaustive();
}

export function squareHash(s: Square): string {
  if (s.Atype === 'term') {
    // const ns: Square = {
    //   ...s,
    //   term: normalized(s.term)
    // };
    if (s.term.Atype === 'var') {
      return hash({ term: s.term });
    }
    depth = 0;
    count = 0;
    return hash({ term: normalized(reduceTerm(s.term)) });
  }
  return hash(s);
}

export function coloredHandleFrom(t: Term, hsh: string): string {
  return `${t.Atype}#${hsh.substring(0, 2)}`;
}

export function deltaHFrom(hsh: string): number {
  const h = parseInt(hsh.substring(0, 2), 16);
  if (h < 0 || h >= 256) return 0;
  return h / 255;
}
