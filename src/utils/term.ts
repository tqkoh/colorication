import { cloneDeep } from 'lodash';
import objectHash from 'object-hash';
import { match, P } from 'ts-pattern';
import { v4 as uuid } from 'uuid';
import { log } from './deb';

const MAX_SUBST = 20;

type Term =
  | { Atype: 'var'; var: string }
  | { Atype: 'app'; lam: Term; param: Term }
  | { Atype: 'lam'; var: string; ret: Term };

export function normalized(
  t: Term, // ref
  m: Map<string, number> = new Map<string, number>()
): Term {
  return match(t)
    .with({ Atype: 'var' }, (v) => {
      const id: number | undefined = m.get(v.var);
      if (id === undefined) {
        const newId: number = m.size;
        m.set(v.var, newId);
        const ret: Term = {
          Atype: 'var',
          var: newId.toString()
        };
        return ret;
      }
      const ret: Term = {
        Atype: 'var',
        var: id.toString()
      };
      return ret;
    })
    .with({ Atype: 'app' }, (a) => {
      const ret: Term = {
        Atype: 'app',
        lam: normalized(a.lam, m),
        param: normalized(a.param, m)
      };
      return ret;
    })
    .with({ Atype: 'lam' }, (l) => {
      const newId: number = m.size;
      m.set(l.var, newId);
      const ret: Term = {
        Atype: 'lam',
        var: newId.toString(),
        ret: normalized(l.ret, m)
      };
      return ret;
    })
    .exhaustive();
}

export function randomized(
  t: Term, // ref
  m: Map<string, string> = new Map<string, string>()
): Term {
  return match(t)
    .with({ Atype: 'var' }, (v) => {
      const id: string | undefined = m.get(v.var);
      if (id === undefined) {
        const newId: string = uuid();
        m.set(v.var, newId);
        const ret: Term = {
          Atype: 'var',
          var: newId
        };
        return ret;
      }
      const ret: Term = {
        Atype: 'var',
        var: id
      };
      return ret;
    })
    .with({ Atype: 'app' }, (a) => {
      const ret: Term = {
        Atype: 'app',
        lam: randomized(a.lam, m),
        param: randomized(a.param, m)
      };
      return ret;
    })
    .with({ Atype: 'lam' }, (l) => {
      const newId = uuid();
      m.set(l.var, newId);
      const ret: Term = {
        Atype: 'lam',
        var: newId,
        ret: randomized(l.ret, m)
      };
      return ret;
    })
    .exhaustive();
}

export const termExample: Term = randomized({
  Atype: 'app',
  lam: {
    Atype: 'lam',
    var: '0',
    ret: {
      Atype: 'var',
      var: '0'
    }
  },
  param: {
    Atype: 'var',
    var: '1'
  }
});

export function freeValue(t: Term): string[] {
  return match(t)
    .with({ Atype: 'var' }, (v) => [v.var])
    .with({ Atype: 'app' }, (a) => [
      ...new Set([...freeValue(a.lam), ...freeValue(a.param)])
    ])
    .with({ Atype: 'lam' }, (l) => {
      const a = freeValue(l.ret);
      return a.reduce((acc: string[], e: string) => {
        if (e !== l.var) acc.push(e);
        return acc;
      }, []);
    })
    .exhaustive();
}

export function subst(
  acc: Term[], // ref
  before: string = '',
  after: Term = {
    Atype: 'var',
    var: before
  }
): Term[] {
  const sid = uuid();
  log(100, `subst-${sid}: {`, cloneDeep(acc), before, after);
  const ret = match<[Term, Term], Term[]>([acc.slice(-1)[0], after])
    // app の場合、subst した後適用する。(lam の返り値の中の引数を、適用するものでさらに subst する)
    .with(
      // before と after が同じな場合、適用だけする
      [
        { Atype: 'app', lam: { Atype: 'lam' } },
        { Atype: 'var', var: before }
      ],
      ([ap]) => {
        log(100, 'subst', 0);

        log(100, 't1 motomemasu');
        const t1 = subst([ap.lam.ret], ap.lam.var, ap.param);
        log(100, 't1', t1);
        // for (let i = 0; i < t1.length; i += 1) {
        //   acc.push(t1[i]);
        // }
        acc.push(t1.slice(-1)[0]);
        if (t1.slice(-1)[0].Atype === 'app') {
          log(100, 't2 motomemasu');
          const t2 = subst([t1.slice(-1)[0]]);
          // for (let i = 1; i < t2.length; i += 1) {
          //   acc.push(t2[i]);
          // }
          acc.push(t2.slice(-1)[0]);
          log(100, 't2: ', t2);
        }
        return acc;
      }
    )
    .with([{ Atype: 'app', lam: { Atype: 'lam' } }, P._], ([ap, a]) => {
      log(100, 'subst', 1);

      const substLam = subst([ap.lam], before, a).slice(-1)[0];
      const substParam = subst([ap.param], before, a).slice(-1)[0];
      const app: Term = {
        Atype: 'app',
        lam: substLam,
        param: substParam
      };
      acc.push(app);
      acc.push(subst([app]).slice(-1)[0]);
      // acc.push(
      //   subst(
      //     [subst([ap.lam.ret], before, a).slice(-1)[0]],
      //     ap.lam.var,
      //     substParam
      //   ).slice(-1)[0]
      // );
      return acc;
    })
    // App の lam が lam 以外のこともあるのでこれはいる
    .with([{ Atype: 'app' }, P._], ([ap, a]) => {
      log(100, 'subst', 2);

      const substLam = subst([ap.lam], before, a).slice(-1)[0];
      const substParam = subst([ap.param], before, a).slice(-1)[0];
      const app: Term = {
        Atype: 'app',
        lam: substLam,
        param: substParam
      };
      acc.push(app);
      // acc.push(subst([app]).slice(-1)[0]);
      return acc;
    })
    // Var
    .with([P._, { Atype: 'var', var: before }], () => {
      log(100, 'subst', 3);

      return acc;
    })
    .with([{ Atype: 'var' }, P._], ([va, a]) => {
      log(100, 'subst', 4);

      if (va.var === before) acc.push(a);
      if (a.Atype === 'app') {
        acc.push(subst([a]).slice(-1)[0]);
      }
      return acc;
    })
    .with([{ Atype: 'lam' }, P._], ([la, a]) => {
      log(100, 'subst', 5);

      if (before === la.var) return acc;
      if (!freeValue(la.ret).includes(before)) return acc;

      if (freeValue(a).includes(la.var)) {
        const newId = uuid();
        acc.push({
          Atype: 'lam',
          var: newId,
          ret: subst(
            subst([la.ret], la.var, {
              Atype: 'var',
              var: newId
            }),
            before,
            a
          ).slice(-1)[0]
        });
      } else {
        acc.push({
          Atype: 'lam',
          var: la.var,
          ret: subst([la.ret], before, a).slice(-1)[0]
        });
      }
      return acc;
    })
    .with([P._, P._], () => {
      log(100, 'subst', 6);

      return acc;
    })
    .exhaustive();
  // console.log('subst---------------------')
  // console.log('acc', acc)
  // console.log('b', before)
  // console.log('a', after)
  // console.log('-----------return: ', ret)
  log(100, cloneDeep(ret), `} subst-${sid}`);
  return ret;
}

export function equal(l: Term, r: Term): boolean {
  // return eq(normalized(l), normalized(r));
  const hashl = objectHash(l);
  const hashr = objectHash(r);
  return hashl === hashr;
}

export function completeSubst(acc: Term[]) {
  let count = 0;
  const hashAcc: string[] = [];
  for (let i = 0; i < acc.length; i += 1) {
    hashAcc.push(objectHash(acc[i]));
  }

  while (
    count < MAX_SUBST &&
    (hashAcc.length < 2 || hashAcc.slice(-1)[0] !== hashAcc.slice(-2)[0])
  ) {
    log(100, count, cloneDeep(acc));
    const next = subst([acc.slice(-1)[0]]);
    for (let i = 0; i < next.length; i += 1) {
      acc.push(next[i]);
      hashAcc.push(objectHash(next[i]));
    }
    count += 1;
  }

  const ret: Term[] = [];
  for (let i = 0; i < acc.length - 1; i += 1) {
    if (hashAcc[i] !== hashAcc[i + 1]) {
      ret.push(acc[i]);
    }
  }
  ret.push(acc.slice(-1)[0]);
  log(100, count, cloneDeep(ret));
  return ret;
}

export default Term;
