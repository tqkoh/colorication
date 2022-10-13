import { match, P } from 'ts-pattern';
import { v4 as uuid } from 'uuid';

type Term =
  | { type: 'var'; var: string }
  | { type: 'app'; lam: Term; param: Term }
  | { type: 'lam'; var: string; ret: Term };

export function normalized(
  t: Term, // ref
  m: Map<string, number> = new Map<string, number>()
): Term {
  return match(t)
    .with({ type: 'var' }, (v) => {
      const id: number | undefined = m.get(v.var);
      if (id === undefined) {
        const newId: number = m.size;
        m.set(v.var, newId);
        const ret: Term = {
          type: 'var',
          var: newId.toString()
        };
        return ret;
      }
      const ret: Term = {
        type: 'var',
        var: id.toString()
      };
      return ret;
    })
    .with({ type: 'app' }, (a) => {
      const ret: Term = {
        type: 'app',
        lam: normalized(a.lam, m),
        param: normalized(a.param, m)
      };
      return ret;
    })
    .with({ type: 'lam' }, (l) => {
      const newId: number = m.size;
      m.set(l.var, newId);
      const ret: Term = {
        type: 'lam',
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
    .with({ type: 'var' }, (v) => {
      const id: string | undefined = m.get(v.var);
      if (id === undefined) {
        const newId: string = uuid();
        m.set(v.var, newId);
        const ret: Term = {
          type: 'var',
          var: newId
        };
        return ret;
      }
      const ret: Term = {
        type: 'var',
        var: id
      };
      return ret;
    })
    .with({ type: 'app' }, (a) => {
      const ret: Term = {
        type: 'app',
        lam: randomized(a.lam, m),
        param: randomized(a.param, m)
      };
      return ret;
    })
    .with({ type: 'lam' }, (l) => {
      const newId = uuid();
      m.set(l.var, newId);
      const ret: Term = {
        type: 'lam',
        var: newId,
        ret: randomized(l.ret, m)
      };
      return ret;
    })
    .exhaustive();
}

export const termExample: Term = randomized({
  type: 'app',
  lam: {
    type: 'lam',
    var: '0',
    ret: {
      type: 'var',
      var: '0'
    }
  },
  param: {
    type: 'var',
    var: '1'
  }
});

function freeValue(t: Term): string[] {
  return match(t)
    .with({ type: 'var' }, (v) => [v.var])
    .with({ type: 'app' }, (a) => [
      ...new Set([...freeValue(a.lam), ...freeValue(a.param)])
    ])
    .with({ type: 'lam' }, (l) => {
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
  before: string,
  after: Term
): Term[] {
  const ret = match<[Term, Term], Term[]>([acc.slice(-1)[0], after])
    // app の場合、subst した後適用する。(lam の返り値の中の引数を、適用するものでさらに subst する)
    .with(
      [
        { type: 'app', lam: { type: 'lam' } },
        { type: 'var', var: before }
      ],
      ([ap, a]) => {
        acc.push(subst([ap.lam.ret], ap.lam.var, a).slice(-1)[0]);
        return acc;
      }
    )
    .with([{ type: 'app', lam: { type: 'lam' } }, P._], ([ap, a]) => {
      const substLam = subst([ap.lam], before, a).slice(-1)[0];
      const substParam = subst([ap.param], before, a).slice(-1)[0];
      acc.push({
        type: 'app',
        lam: substLam,
        param: substParam
      });
      acc.push(
        subst(
          [subst([ap.lam.ret], before, a).slice(-1)[0]],
          ap.lam.var,
          substParam
        ).slice(-1)[0]
      );
      return acc;
    })
    // App の lam が lam 以外のこともあるのでこれはいる
    .with([{ type: 'app' }, P._], ([ap, a]) => {
      const substLam = subst([ap.lam], before, a).slice(-1)[0];
      const substParam = subst([ap.param], before, a).slice(-1)[0];
      acc.push({
        type: 'app',
        lam: substLam,
        param: substParam
      });
      return acc;
    })
    // Var
    .with([P._, { type: 'var', var: before }], () => acc)
    .with([{ type: 'var' }, P._], ([va, a]) => {
      if (va.var === before) acc.push(a);
      return acc;
    })
    .with([{ type: 'lam' }, P._], ([la, a]) => {
      if (before === la.var) return acc;
      if (!freeValue(la.ret).includes(before)) return acc;

      if (freeValue(a).includes(la.var)) {
        const newId = uuid();
        acc.push({
          type: 'lam',
          var: newId,
          ret: subst(
            subst([la.ret], la.var, {
              type: 'var',
              var: newId
            }),
            before,
            a
          ).slice(-1)[0]
        });
      } else {
        acc.push({
          type: 'lam',
          var: la.var,
          ret: subst([la.ret], before, a).slice(-1)[0]
        });
      }
      return acc;
    })
    .with([P._, P._], () => acc)
    .exhaustive();
  // console.log('subst---------------------')
  // console.log('acc', acc)
  // console.log('b', before)
  // console.log('a', after)
  // console.log('-----------return: ', ret)
  return ret;
}

export default Term;
