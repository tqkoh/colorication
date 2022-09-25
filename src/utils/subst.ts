import { match, P } from "ts-pattern";

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
				return e == l.var ? acc : [...acc, e];
			}, []);
		})
		.exhaustive();
}

export const fv = freeValue(t);

function substInternal(ts: Term[], b: Term, a: Term, last_var: number): Term[] {
	return match<[Term[], Term, Term], Term[]>([ts, b, a])
		.with(
			[
				[
					{
						type: "App",
						lam: {
							type: "Lam",
						},
					},
					...P.rest(P._),
				],
				{ type: "Var" },
				{ type: "Var" },
			],
			([ts, b, a]) => {
				if (b.var == a.var) {
					return substInternal(
						[ts[0].lam.ret],
						{ type: "Var", var: ts[0].lam.var },
						{ type: "Var", var: a.bar },
						last_var
					);
				}
				return [{ type: "Var", var: 300 }];
			}
		)
		.with([P._, P._, P._], () => [])
		.exhaustive();
}

function subst(ts: Term[], b: Term, a: Term): Term[] {
	return substInternal(
		ts,
		b,
		a,
		freeValue(ts[0])
			.concat(freeValue(b))
			.concat(freeValue(a))
			.reduce((acc: number, e: number) => {
				return acc < e ? e : acc;
			}, 0) + 1
	);
}

export const s = subst(
	[t, t],
	{ type: "Var", var: 1 },
	{ type: "Var", var: 2 }
);

export default Term;
