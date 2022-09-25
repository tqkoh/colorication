import { match, P } from "ts-pattern";
import { select } from "ts-pattern/dist/patterns";

type Term =
	| { type: "Var"; var: number }
	| { type: "App"; lam: Term; param: Term }
	| { type: "Lam"; var: number; ret: Term };

export const t: Term = {
	type: "App",
	lam: {
		type: "Lam",
		var: 0,
		ret: {
			type: "Var",
			var: 0,
		},
	},
	param: {
		type: "Var",
		var: 1,
	},
};

function freeValue(t: Term): number[] {
	return match(t)
		.with({ type: "Var" }, (v) => {
			return [v.var];
		})
		.with({ type: "App" }, (a) => {
			return [...new Set([...freeValue(a.lam), ...freeValue(a.param)])];
		})
		.with({ type: "Lam" }, (l) => {
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
				{ type: "App", lam: { type: "Lam" } },
				{ type: "Var", var: b },
			],
			([ap, a]) => {
				acc.push(subst([ap.lam.ret], ap.lam.var, a).slice(-1)[0]);
				return acc;
			}
		)
		.with([{ type: "App", lam: { type: "Lam" } }, P._], ([ap, a]) => {
			let substLam = subst([ap.lam], b, a).slice(-1)[0];
			let substParam = subst([ap.param], b, a).slice(-1)[0];
			acc.push({
				type: "App",
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
		// App の lam が App nanka nanka の結果の lam のこともあるのでこれはいる
		.with([{ type: "App" }, P._], ([ap, a]) => {
			let substLam = subst([ap.lam], b, a).slice(-1)[0];
			let substParam = subst([ap.param], b, a).slice(-1)[0];
			acc.push({
				type: "App",
				lam: substLam,
				param: substParam,
			});
			return acc;
		})
		// Var
		.with([P._, { type: "Var", var: b }], ([_t, _a]) => {
			return acc;
		})
		.with([{ type: "Var" }, P._], ([va, a]) => {
			if (va.var == b) acc.push(a);
			return acc;
		})
		.with([{ type: "Lam" }, P._], ([la, a]) => {
			if (b == la.var) return acc;
			else if (!freeValue(la.ret).includes(b)) return acc;
			else {
				if (freeValue(a).includes(la.var)) {
					acc.push({
						type: "Lam",
						var: last_var,
						ret: subst(
							substInternal(
								[la.ret],
								la.var,
								{ type: "Var", var: last_var },
								last_var + 1
							),
							b,
							a
						).slice(-1)[0],
					});
				} else {
					acc.push({
						type: "Lam",
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

function subst(ts: Term[], b: number, a: Term): Term[] {
	return substInternal(
		ts,
		b,
		a,
		freeValue(ts.slice(-1)[0])
			.concat(freeValue({ type: "Var", var: b }))
			.concat(freeValue(a))
			.reduce((acc: number, e: number) => {
				return acc < e ? e : acc;
			}, 0) + 1
	);
}

export const s = subst([t], 1, { type: "Var", var: 2 });

export default Term;
