type Term =
	| { type: "Var"; var: number }
	| { type: "App"; lam: Term; param: Term }
	| { type: "Lam"; var: number; ret: Term };

const t: Term = {
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

export default Term;
