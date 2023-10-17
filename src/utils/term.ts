import objectHash from 'object-hash';
import { match, P } from 'ts-pattern';
import { v4 as uuid } from 'uuid';
import { log } from './deb';

const MAX_COMPLETE_SUBST = 2000;
const LOG_SUBST_COUNT_EVERY = 10;
const MAX_SUBST_COUNT_COMPLETE = 2000;
const MAX_SUBST_TIME_COMPLETE = 1000;

type Term =
  | { Atype: 'var'; var: string }
  | { Atype: 'app'; lam: Term; param: Term }
  | { Atype: 'lam'; var: string; ret: Term }
  | { Atype: 'ref'; var: string; ref: Term | undefined };

const termMap: Map<string, Term> = new Map<string, Term>();

export function normalized(
  t: Term, // ref
  idMap: Map<string, number> = new Map<string, number>(),
  refTmpMap: Map<number, Term> = new Map<number, Term>()
): Term {
  return match(t)
    .with({ Atype: 'var' }, (v) => {
      const id: number | undefined = idMap.get(v.var);
      if (id === undefined) {
        const newId: number = idMap.size;
        idMap.set(v.var, newId);
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
        lam: normalized(a.lam, idMap, refTmpMap),
        param: normalized(a.param, idMap, refTmpMap)
      };
      return ret;
    })
    .with({ Atype: 'lam' }, (l) => {
      const newId: number = idMap.size;
      idMap.set(l.var, newId);
      termMap.set(l.var, l);
      const ret: Term = {
        Atype: 'lam',
        var: newId.toString(),
        ret: normalized(l.ret, idMap, refTmpMap)
      };
      const term = refTmpMap.get(newId);
      if (term && term.Atype === 'ref') {
        term.ref = ret;
      }
      return ret;
    })
    .with({ Atype: 'ref' }, (r) => {
      const id: number | undefined = idMap.get(r.var);
      if (id === undefined) {
        const newId: number = idMap.size;
        idMap.set(r.var, newId);
        const ret: Term = {
          Atype: 'ref',
          var: newId.toString(),
          ref: {
            Atype: 'var',
            var: '0'
          }
        };
        return ret;
      }
      const ret: Term = {
        Atype: 'ref',
        var: id.toString(),
        ref: undefined
      };
      refTmpMap.set(id, ret);
      return ret;
    })
    .exhaustive();
}

export function randomized(
  t: Term, // ref
  idMap: Map<string, string> = new Map<string, string>(),
  refTmpMap: Map<string, Term> = new Map<string, Term>()
): Term {
  return match(t)
    .with({ Atype: 'var' }, (v) => {
      const id: string | undefined = idMap.get(v.var);
      if (id === undefined) {
        const newId: string = uuid();
        idMap.set(v.var, newId);
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
        lam: randomized(a.lam, idMap, refTmpMap),
        param: randomized(a.param, idMap, refTmpMap)
      };
      return ret;
    })
    .with({ Atype: 'lam' }, (l) => {
      const newId = uuid();
      idMap.set(l.var, newId);
      log(33, l.var, newId);
      termMap.set(l.var, l);
      termMap.set(newId, l);
      const ret: Term = {
        Atype: 'lam',
        var: newId,
        ret: randomized(l.ret, idMap, refTmpMap)
      };
      const term = refTmpMap.get(newId);
      if (term && term.Atype === 'ref') {
        term.ref = ret;
      }
      log(33, 'lam', ret);
      return ret;
    })
    .with({ Atype: 'ref' }, (r) => {
      const id: string | undefined = idMap.get(r.var);
      if (id === undefined) {
        const term = termMap.get(r.var);
        if (term !== undefined && term.Atype === 'lam') {
          return t;
        }
        log(33, 'No id');
        const newId: string = uuid();
        idMap.set(r.var, newId);
        const ret: Term = {
          Atype: 'ref',
          var: newId,
          ref: {
            Atype: 'var',
            var: '0'
          }
        };
        return ret;
      }
      const ret: Term = {
        Atype: 'ref',
        var: id,
        ref: undefined
      };
      refTmpMap.set(id, ret);
      log(33, 'ref', ret);
      return ret;
    })
    .exhaustive();
}

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
    .with({ Atype: 'ref' }, (r) => [r.var])
    .exhaustive();
}

let substCount = 0;
let startTime = performance.now();
let lastSubstTime = performance.now();
let maxSubstCount = MAX_SUBST_COUNT_COMPLETE;
let maxSubstTime = MAX_SUBST_TIME_COMPLETE;

type SubstStatus = 'ok' | 'muri' | 'compromise';

function substI(
  t: Term, // ref
  before: string = '',
  after: Term = {
    Atype: 'var',
    var: before
  }
): [Term, SubstStatus] {
  // 最後までできたがどうか
  substCount += 1;
  {
    const now = performance.now();
    log(101, now - lastSubstTime, 'ms', (now - startTime) / 1000, 's');
    lastSubstTime = now;
    if (substCount % LOG_SUBST_COUNT_EVERY === 0) {
      log(5, `substCount: ${substCount}`);
    }
    if (substCount >= maxSubstCount || now - startTime >= maxSubstTime) {
      log(101, 'muri');
      return [t, 'muri'];
    }
  }
  const sid = uuid();
  log(100, `subst-${sid}: {`); // , cloneDeep(acc), before, after

  const ret = match<[Term, Term], [Term, SubstStatus]>([t, after])
    // app の場合、subst した後適用する。(lam の返り値の中の引数を、適用するものでさらに subst する)
    .with(
      // before と after が同じな場合、適用だけする
      [
        { Atype: 'app', lam: { Atype: 'lam' } },
        { Atype: 'var', var: before }
      ],
      ([ap]) => {
        log(100, 'subst', 0);

        const substRet = substI(ap.lam.ret, ap.lam.var, ap.param);
        if (substRet[1] === 'muri') {
          // ap.lam.var を消しかけているけどやめないと未定義な変数として残っちゃう
          return [t, 'compromise'];
        }
        if (substRet[0].Atype === 'app') {
          const app = substI(substRet[0]);
          return app[1] === 'muri' ? [t, 'compromise'] : app;
          // log(200, 't2: ', t2);
        }
        return substRet;
      }
    )
    .with([{ Atype: 'app', lam: { Atype: 'lam' } }, P._], ([ap, a]) => {
      log(100, 'subst', 1);

      const substLam = substI(ap.lam, before, a);
      if (substLam[1] === 'muri') {
        return [t, 'compromise'];
      }
      const substParam = substI(ap.param, before, a);
      if (substParam[1] === 'muri') {
        return [
          {
            Atype: 'app',
            lam: substLam[0],
            param: ap.param
          },
          'compromise'
        ];
      }
      const app0: Term = {
        Atype: 'app',
        lam: substLam[0],
        param: substParam[0]
      };
      // acc.push(app);
      const applied = substI(app0); // 0
      // acc.push(
      //   subst(
      //     [subst([ap.lam.ret], before, a)],
      //     ap.lam.var,
      //     substParam
      //   )
      // );
      return applied[1] === 'muri' ? [app0, 'compromise'] : applied;
    })
    .with([{ Atype: 'app' }, P._], ([ap, a]) => {
      log(100, 'subst', 1.5);

      log(102, sid, ap.lam);
      const substLam: [Term, SubstStatus] =
        ap.lam.Atype === 'ref' ? [ap.lam, 'ok'] : substI(ap.lam, before, a);
      if (substLam[1] === 'muri') {
        return [t, 'compromise'];
      }
      log(103, sid, substLam[0]);
      const substParam: [Term, SubstStatus] =
        ap.param.Atype === 'ref'
          ? [ap.param, 'ok']
          : substI(ap.param, before, a);
      return substParam[1] === 'muri'
        ? [
            {
              Atype: 'app',
              lam: substLam[0],
              param: ap.param
            },
            'compromise'
          ]
        : [
            {
              Atype: 'app',
              lam: substLam[0],
              param: substParam[0]
            },
            'ok'
          ];
    })
    // 適用だけ
    .with([{ Atype: 'lam' }, { Atype: 'var', var: before }], ([la]) => {
      log(100, 'subst', 2);

      const applyRet = substI(la.ret);
      return applyRet[1] === 'muri'
        ? [
            {
              Atype: 'lam',
              var: la.var,
              ret: la.ret
            },
            'compromise'
          ]
        : [
            {
              Atype: 'lam',
              var: la.var,
              ret: applyRet[0]
            },
            applyRet[1]
          ];
    })
    .with([P._, { Atype: 'var', var: before }], () => {
      log(100, 'subst', 3);

      return [t, 'ok'];
    })
    // Var
    .with([{ Atype: 'var' }, P._], ([va, a]) => {
      log(100, 'subst', 4);

      if (va.var === before) return [a, 'ok'];
      return [va, 'ok'];
    })
    .with([{ Atype: 'lam' }, P._], ([la, a]) => {
      log(100, 'subst', 5);

      if (before === la.var) return [t, 'ok'];
      if (!freeValue(la.ret).includes(before)) return [t, 'ok'];
      // これは before がないとき簡単に返してるだけ

      // これ uuid にしたのでいらなく内科 la のなかで定義されている var が after に入っていることはない
      // if (freeValue(a).includes(la.var)) {
      // }
      const t1 = substI(la.ret, before, a);
      return t1[1] === 'muri'
        ? [t, 'compromise']
        : [
            {
              Atype: 'lam',
              var: la.var,
              ret: t1[0]
            },
            t1[1]
          ];
    })
    .with([{ Atype: 'ref' }, P._], ([re]) => {
      log(100, 'subst', 6);

      return [re.ref || { Atype: 'var', var: '0' }, 'ok'];
    })
    .with([P._, P._], () => {
      log(100, 'subst', 6);

      return [t, 'ok'];
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

export function subst(
  t: Term,
  maxCount: number = 100,
  maxTimeMs: number = 100
) {
  maxSubstCount = maxCount;
  maxSubstTime = maxTimeMs;
  substCount = 0;
  startTime = performance.now();
  return substI(t);
}

export function completeSubst(t: Term): Term[] {
  substCount = 0;
  startTime = performance.now();
  maxSubstCount = MAX_SUBST_COUNT_COMPLETE;
  maxSubstTime = MAX_SUBST_TIME_COMPLETE;
  let count = 0;
  const acc: Term[] = [t];
  const hashAcc: string[] = [objectHash(t)];

  while (
    count < MAX_COMPLETE_SUBST &&
    (hashAcc.length < 2 || hashAcc.slice(-1)[0] !== hashAcc.slice(-2)[0])
  ) {
    // log(100, count, cloneDeep(acc));
    const last: Term = acc.slice(-1)[0];
    const t1 = substI(last);
    const next: Term = t1[1] === 'muri' ? last : t1[0];
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
