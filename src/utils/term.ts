import { match, P } from "ts-pattern";
import { v4 as uuid } from "uuid";
uuid();

type Term =
	| { _type: "var"; var: string }
	| { _type: "app"; lam: Term; param: Term }
	| { _type: "lam"; var: string; ret: Term };

export const t: Term = randomized({
	_type: "app",
	lam: {
		_type: "lam",
		var: "0",
		ret: {
			_type: "var",
			var: "0",
		},
	},
	param: {
		_type: "var",
		var: "1",
	},
});

export function normalized(
	t: Term,
	m: Map<string, number> = new Map<string, number>()
): Term {
	// ref
	return match(t)
		.with({ _type: "var" }, (v) => {
			const id: number | undefined = m.get(v.var);
			if (id == undefined) {
				const newId: number = m.size;
				m.set(v.var, newId);
				const ret: Term = {
					_type: "var",
					var: newId.toString(),
				};
				return ret;
			} else {
				const ret: Term = {
					_type: "var",
					var: id.toString(),
				};
				return ret;
			}
		})
		.with({ _type: "app" }, (a) => {
			const ret: Term = {
				_type: "app",
				lam: normalized(a.lam, m),
				param: normalized(a.param, m),
			};
			return ret;
		})
		.with({ _type: "lam" }, (l) => {
			const newId: number = m.size;
			m.set(l.var, newId);
			const ret: Term = {
				_type: "lam",
				var: newId.toString(),
				ret: normalized(l.ret, m),
			};
			return ret;
		})
		.exhaustive();
}

export function randomized(
	t: Term,
	m: Map<string, string> = new Map<string, string>()
): Term {
	// ref
	return match(t)
		.with({ _type: "var" }, (v) => {
			const id: string | undefined = m.get(v.var);
			if (id == undefined) {
				const newId: string = uuid();
				m.set(v.var, newId);
				const ret: Term = {
					_type: "var",
					var: newId,
				};
				return ret;
			} else {
				const ret: Term = {
					_type: "var",
					var: id,
				};
				return ret;
			}
		})
		.with({ _type: "app" }, (a) => {
			const ret: Term = {
				_type: "app",
				lam: randomized(a.lam, m),
				param: randomized(a.param, m),
			};
			return ret;
		})
		.with({ _type: "lam" }, (l) => {
			const newId = uuid();
			m.set(l.var, newId);
			const ret: Term = {
				_type: "lam",
				var: newId,
				ret: randomized(l.ret, m),
			};
			return ret;
		})
		.exhaustive();
}

function freeValue(t: Term): string[] {
	return match(t)
		.with({ _type: "var" }, (v) => {
			return [v.var];
		})
		.with({ _type: "app" }, (a) => {
			return [...new Set([...freeValue(a.lam), ...freeValue(a.param)])];
		})
		.with({ _type: "lam" }, (l) => {
			let a = freeValue(l.ret);
			return a.reduce((acc: string[], e: string) => {
				if (e != l.var) acc.push(e);
				return acc;
			}, []);
		})
		.exhaustive();
}

export const fv = freeValue(t);

export function subst(
	acc: Term[], // ref
	b: string,
	a: Term
): Term[] {
	let ret = match<[Term, Term], Term[]>([acc.slice(-1)[0], a])
		// app の場合、subst した後適用する。(lam の返り値の中の引数を、適用するものでさらに subst する)
		.with(
			[
				{ _type: "app", lam: { _type: "lam" } },
				{ _type: "var", var: b },
			],
			([ap, a]) => {
				acc.push(subst([ap.lam.ret], ap.lam.var, a).slice(-1)[0]);
				return acc;
			}
		)
		.with([{ _type: "app", lam: { _type: "lam" } }, P._], ([ap, a]) => {
			let substLam = subst([ap.lam], b, a).slice(-1)[0];
			let substParam = subst([ap.param], b, a).slice(-1)[0];
			acc.push({
				_type: "app",
				lam: substLam,
				param: substParam,
			});
			acc.push(
				subst(
					[subst([ap.lam.ret], b, a).slice(-1)[0]],
					ap.lam.var,
					substParam
				).slice(-1)[0]
			);
			return acc;
		})
		// App の lam が lam 以外のこともあるのでこれはいる
		.with([{ _type: "app" }, P._], ([ap, a]) => {
			let substLam = subst([ap.lam], b, a).slice(-1)[0];
			let substParam = subst([ap.param], b, a).slice(-1)[0];
			acc.push({
				_type: "app",
				lam: substLam,
				param: substParam,
			});
			return acc;
		})
		// Var
		.with([P._, { _type: "var", var: b }], ([_t, _a]) => {
			return acc;
		})
		.with([{ _type: "var" }, P._], ([va, a]) => {
			if (va.var == b) acc.push(a);
			return acc;
		})
		.with([{ _type: "lam" }, P._], ([la, a]) => {
			if (b == la.var) return acc;
			else if (!freeValue(la.ret).includes(b)) return acc;
			else {
				if (freeValue(a).includes(la.var)) {
					let newId = uuid();
					acc.push({
						_type: "lam",
						var: newId,
						ret: subst(
							subst([la.ret], la.var, {
								_type: "var",
								var: newId,
							}),
							b,
							a
						).slice(-1)[0],
					});
				} else {
					acc.push({
						_type: "lam",
						var: la.var,
						ret: subst([la.ret], b, a).slice(-1)[0],
					});
				}
				return acc;
			}
		})
		.with([P._, P._], () => acc)
		.exhaustive();
	console.log("subst---------------------");
	console.log("acc", acc);
	console.log("b", b);
	console.log("a", a);
	console.log("-----------return: ", ret);
	return ret;
}

export default Term;
