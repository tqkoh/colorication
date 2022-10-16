import { log } from './deb';
import Term, { randomized } from './term';

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

function isTimes(t: Term, f: string, x: string): number {
  log(200, 'isTimes', t);
  if (t.Atype === 'var' && t.var === x) return 0;
  if (t.Atype === 'app' && t.lam.Atype === 'var' && t.lam.var === f) {
    const p = isTimes(t.param, f, x);
    return p < 0 ? p : p + 1;
  }
  log(200, 'isTimes -1');
  return -1;
}

export function asNumber(t: Term): number {
  log(200, 'asNumber', t);
  if (t.Atype !== 'lam') return -1;
  const f = t.var;
  log(200, `f: ${f}`);
  if (t.ret.Atype !== 'lam') return -1;
  const x = t.ret.var;
  log(200, `x: ${x}`);
  return isTimes(t.ret.ret, f, x);
}

export function asCodes(t: Term): number[] {
  log(200, 'asString');
  const n = asNumber(t);
  if (n < 0) {
    return [];
  }
  return [n];
}
