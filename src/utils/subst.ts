import { match, P } from "ts-pattern";

type Term =
	| { _type: "var"; var: number }
	| { _type: "app"; lam: Term; param: Term }
	| { _type: "lam"; var: number; ret: Term };

export const t: Term = {
	_type: "app",
	lam: {
		_type: "lam",
		var: 0,
		ret: {
			_type: "var",
			var: 0,
		},
	},
	param: {
		_type: "var",
		var: 1,
	},
};

function freeValue(t: Term): number[] {
	return match(t)
		.with({ _type: "var" }, (v) => {
			return [v.var];
		})
		.with({ _type: "app" }, (a) => {
			return [...new Set([...freeValue(a.lam), ...freeValue(a.param)])];
		})
		.with({ _type: "lam" }, (l) => {
			let a = freeValue(l.ret);
			return a.reduce((acc: number[], e: number) => {
				if (e != l.var) acc.push(e);
				return acc;
			}, []);
		})
		.exhaustive();
}

export const fv = freeValue(t);

function substInternal(
	acc: Term[], // ref
	b: number,
	a: Term,
	last_var: number
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
					acc.push({
						_type: "lam",
						var: last_var,
						ret: subst(
							substInternal(
								[la.ret],
								la.var,
								{ _type: "var", var: last_var },
								last_var + 1
							),
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

export function subst(ts: Term[], b: number, a: Term): Term[] {
	return substInternal(
		ts,
		b,
		a,
		freeValue(ts.slice(-1)[0])
			.concat(freeValue({ _type: "var", var: b }))
			.concat(freeValue(a))
			.reduce((acc: number, e: number) => {
				return acc < e ? e : acc;
			}, 0) + 1
	);
}

export const s = subst([t], 1, { _type: "var", var: 2 });

export default Term;
