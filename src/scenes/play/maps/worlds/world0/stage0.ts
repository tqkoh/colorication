import { randomized } from "../../../../../utils/term";
import { Stage } from "../../../gamemap";

export const stage0: Stage = {
	name: "0. place it",
	tests: [
		{
			input: [],
			output: {
				_type: "lam",
				var: "0",
				ret: { _type: "var", var: "0" },
			},
		},
	],
	terms: [
		{
			_type: "term",
			term: randomized({
				_type: "lam",
				var: "0",
				ret: { _type: "var", var: "0" },
			}),
			name: "",
			movable: true,
			collidable: true,
			locked: true,
		},
		{
			_type: "term",
			term: randomized({
				_type: "lam",
				var: "1",
				ret: {
					_type: "lam",
					var: "0",
					ret: { _type: "var", var: "0" },
				},
			}),
			name: "",
			movable: true,
			collidable: true,
			locked: true,
		},
		{
			_type: "term",
			term: randomized({
				_type: "lam",
				var: "2",
				ret: {
					_type: "lam",
					var: "1",
					ret: {
						_type: "lam",
						var: "0",
						ret: { _type: "var", var: "0" },
					},
				},
			}),
			name: "",
			movable: true,
			collidable: true,
			locked: true,
		},
	],
};
