import hash from 'object-hash';
import { match } from 'ts-pattern';
import { log } from './deb';
import { codesFrom } from './font';
import Term, { normalized, randomized, subst } from './term';

import { Square } from '../scenes/play/gamemap';

const MAX_ISTIMES_COUNT = 999;
const MAX_REDUCE_TERM_DEPTH = 20;
const MAX_REDUCE_TERM_COUNT = 500;
let depth = 0;
let count = 0;

function reduceTerm(t: Term): Term {
  depth += 1;
  log(100, 'reduceTerm', depth, count);
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

export function equal(l: Term, r: Term): boolean {
  // return eq(normalized(l), normalized(r));
  const hashl = hash(normalized(reduceTerm(l)));
  const hashr = hash(normalized(reduceTerm(r)));
  return hashl === hashr;
}

export function completeEqual(l: Term, r: Term): boolean {
  // return eq(normalized(l), normalized(r));
  const hashl = hash(normalized(l));
  const hashr = hash(normalized(r));
  return hashl === hashr;
}

export function id() {
  return randomized({
    Atype: 'lam',
    var: '0',
    ret: { Atype: 'var', var: '0' }
  });
}

export function zero() {
  return randomized({
    Atype: 'lam',
    var: '1',
    ret: { Atype: 'lam', var: '2', ret: { Atype: 'var', var: '2' } }
  });
}

let isTimesCount = 0;

function isTimes(t: Term, f: string, x: string): number {
  // n < 0: n f x である, =-1: 違う, =-2: デカすぎる(MAX_NUMBER_RECOGNIZE 以上), <-2: デカすぎる(処理が重すぎる、-3-ret 以上)
  log(200, 'isTimes', isTimesCount, t);
  isTimesCount += 1;
  if (MAX_ISTIMES_COUNT < isTimesCount) return -2;
  if (t.Atype === 'lam') return -1;
  if (t.Atype === 'var' && t.var === x) return 0;
  if (t.Atype === 'app' && t.lam.Atype === 'var' && t.lam.var === f) {
    const p = isTimes(t.param, f, x);
    if (p < -2) return p - 1;
    return p < 0 ? p : p + 1;
  }

  isTimesCount += 9;
  const sub = subst(t);
  if (sub[1] === 'muri' || sub[1] === 'compromise') {
    // わからない
    log(200, 'isTimes -3');
    return -3;
  }
  // if (equal(t, sub[0])) {
  // ある程度の深さまでしか見ずに等しいと言ってるので、ダメ
  if (completeEqual(t, sub[0])) {
    // subst が最後までできたくらいのデカさなので、最後まで見ていい(:honmaka:)
    log(200, 'isTimes -1');
    return -1;
  }
  if (sub[0].Atype === 'var' && sub[0].var !== x) {
    return -1;
  }

  log(200, 'isTimes sub');
  return isTimes(sub[0], f, x);
}

export function asNumber(t: Term): number {
  log(200, 'asNumber', t);
  if (t.Atype !== 'lam') return -1;
  const f = t.var;
  log(200, `f: ${f}`);
  if (t.ret.Atype !== 'lam') return -1;
  const x = t.ret.var;
  log(200, `x: ${x}`);
  isTimesCount = 0;
  return isTimes(t.ret.ret, f, x);
}

export function asCodes(t: Term): number[] {
  log(200, 'asString');
  const n = asNumber(t);
  if (n === -2) {
    log(103, 'asCodes', -2);
    return codesFrom(`#${MAX_ISTIMES_COUNT}+`);
  }
  if (n < -2) {
    const moreThan = -3 - n;
    return codesFrom(`#${moreThan}+`);
  }
  if (n < 0) {
    return [];
  }
  return [n];
}
