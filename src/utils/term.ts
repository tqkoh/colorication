import objectHash from 'object-hash';
import { match, P } from 'ts-pattern';
import { v4 as uuid } from 'uuid';
import { log } from './deb';

const MAX_COMPLETE_SUBST = 2000;
const MAX_SUBST = 2000;
const LOG_SUBST_COUNT_EVERY = 10;
const MAX_SUBST_TIME = 1000;

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

let substCount = 0;
let startTime = performance.now();
let lastSubstTime = performance.now();

export function subst(
  t: Term, // ref
  before: string = '',
  after: Term = {
    Atype: 'var',
    var: before
  }
): Term | 'muri' {
  substCount += 1;
  {
    const now = performance.now();
    log(101, now - lastSubstTime, 'ms', (now - startTime) / 1000, 's');
    lastSubstTime = now;
    if (substCount % LOG_SUBST_COUNT_EVERY === 0) {
      log(5, `substCount: ${substCount}`);
    }
    if (substCount >= MAX_SUBST || now - startTime >= MAX_SUBST_TIME) {
      log(101, 'muri');
      return 'muri';
    }
  }
  const sid = uuid();
  log(100, `subst-${sid}: {`); // , cloneDeep(acc), before, after

  const ret = match<[Term, Term], Term>([t, after])
    // app の場合、subst した後適用する。(lam の返り値の中の引数を、適用するものでさらに subst する)
    .with(
      // before と after が同じな場合、適用だけする
      [
        { Atype: 'app', lam: { Atype: 'lam' } },
        { Atype: 'var', var: before }
      ],
      ([ap]) => {
        log(100, 'subst', 0);

        const substRet = subst(ap.lam.ret, ap.lam.var, ap.param);
        if (substRet === 'muri') {
          // ap.lam.var を消しかけているけどやめないと未定義な変数として残っちゃう
          return t;
        }
        if (substRet.Atype === 'app') {
          const app = subst(substRet);
          return app === 'muri' ? substRet : app;
          // log(200, 't2: ', t2);
        }
        return substRet;
      }
    )
    .with([{ Atype: 'app', lam: { Atype: 'lam' } }, P._], ([ap, a]) => {
      log(100, 'subst', 1);

      const substLam = subst(ap.lam, before, a);
      if (substLam === 'muri') {
        return t;
      }
      const substParam = subst(ap.param, before, a);
      if (substParam === 'muri') {
        return {
          Atype: 'app',
          lam: substLam,
          param: ap.param
        };
      }
      const app: Term = {
        Atype: 'app',
        lam: substLam,
        param: substParam
      };
      // acc.push(app);
      const substApp = subst(app);
      // acc.push(
      //   subst(
      //     [subst([ap.lam.ret], before, a)],
      //     ap.lam.var,
      //     substParam
      //   )
      // );
      return substApp === 'muri' ? app : substApp;
    })
    .with([{ Atype: 'app' }, P._], ([ap, a]) => {
      log(100, 'subst', 2);

      log(102, sid, ap.lam);
      const substLam = subst(ap.lam, before, a);
      if (substLam === 'muri') return t;
      log(103, sid, substLam);
      const substParam = subst(ap.param, before, a);
      const app: Term = {
        Atype: 'app',
        lam: substLam,
        param: substParam === 'muri' ? ap.param : substParam
      };
      // acc.push(subst([app]));
      return app;
    })
    // 適用だけ
    .with([{ Atype: 'lam' }, { Atype: 'var', var: before }], ([la]) => {
      log(100, 'subst', 3);

      const applyRet = subst(la.ret);
      return {
        Atype: 'lam',
        var: la.var,
        ret: applyRet === 'muri' ? la.ret : applyRet
      };
    })
    .with([{ Atype: 'var' }, { Atype: 'var', var: before }], () => {
      log(100, 'subst', 3.5);

      return t;
    })
    .with([P._, { Atype: 'var', var: before }], () => {
      log(100, 'subst', 3);

      return t;
    })
    // Var
    .with([{ Atype: 'var' }, P._], ([va, a]) => {
      log(100, 'subst', 4);

      if (va.var === before) return a;
      return va;
    })
    .with([{ Atype: 'lam' }, P._], ([la, a]) => {
      log(100, 'subst', 5);

      if (before === la.var) return t;
      if (!freeValue(la.ret).includes(before)) return t;
      // これは before がないとき簡単に返してるだけ

      // これ uuid にしたのでいらなく内科 la のなかで定義されている var が after に入っていることはない
      // if (freeValue(a).includes(la.var)) {
      // }
      const t1 = subst(la.ret, before, a);
      return t1 === 'muri'
        ? t
        : {
            Atype: 'lam',
            var: la.var,
            ret: t1
          };
    })
    .with([P._, P._], () => {
      log(100, 'subst', 6);

      return t;
    })
    .exhaustive();
  // console.log('subst---------------------')
  // console.log('acc', acc)
  // console.log('b', before)
  // console.log('a', after)
  // console.log('-----------return: ', ret)
  log(100, `} subst-${sid}`); // , cloneDeep(ret)
  return ret;
}

export function equal(l: Term, r: Term): boolean {
  // return eq(normalized(l), normalized(r));
  const hashl = objectHash(l);
  const hashr = objectHash(r);
  return hashl === hashr;
}

export function completeSubst(t: Term): Term[] {
  substCount = 0;
  startTime = performance.now();
  let count = 0;
  const acc: Term[] = [t];
  const hashAcc: string[] = [objectHash(t)];

  while (
    count < MAX_COMPLETE_SUBST &&
    (hashAcc.length < 2 || hashAcc.slice(-1)[0] !== hashAcc.slice(-2)[0])
  ) {
    // log(100, count, cloneDeep(acc));
    const last = acc.slice(-1)[0];
    const t1 = subst(last);
    const next = t1 === 'muri' ? last : t1;
    acc.push(next);
    hashAcc.push(objectHash(next));
    count += 1;
  }

  const ret: Term[] = [];
  for (let i = 0; i < acc.length - 1; i += 1) {
    if (hashAcc[i] !== hashAcc[i + 1]) {
      ret.push(acc[i]);
    }
  }
  ret.push(acc.slice(-1)[0]);
  // log(88, count, cloneDeep(acc));
  // log(100, count, ret);
  return ret;
}

export default Term;
