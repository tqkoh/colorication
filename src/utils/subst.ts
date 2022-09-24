import { match } from "ts-pattern";

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

function subst(ts: Term[], b: Term, a: Term, last_var: Term): Term[] {
	// return match(ts)
	// 	.with([{ type: "App" }, (a) => {
	// 		return match(a)
	// 	}])
	// 	.with([{ type: "Var" }, (v) => {}])
	// 	.with([{ type: "Lam" }, (l) => {}])
	// 	.exhaustive();
}

export default Term;
