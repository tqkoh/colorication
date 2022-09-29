import Term from "../../utils/subst";

export type Block =
	| "parent"
	| "reset"
	| "submit"
	| "apply"
	| "equal"
	| "place"
	| "wall";

export type Test = {
	input: Term[];
	output: Term;
};

export interface Stage {
	tests: Test[];
	terms: Term[];
	init(): Square[][];
}

export type Square = (
	| { _type: "air" }
	| { _type: "term"; term: Term }
	| { _type: "map"; map: Map }
	| { _type: "stage"; stage: Stage; map?: Map }
	| { _type: "block"; block: Block }
) & {
	name: string;
	movable: boolean;
	collidable: boolean;
	locked: boolean;
};

export const airSquare: Square = {
	_type: "air",
	name: "",
	movable: false,
	collidable: false,
	locked: false,
};

export const parentSquare: Square = {
	_type: "block",
	block: "parent",
	name: "..",
	movable: false,
	collidable: false,
	locked: false,
};

// export function squaresFrom(s: string[]): Square[][] {
// 	const h = s.length;
// 	if (!h) return [];
// 	const w = s[0].length;
// 	let ret = new Array<Square[]>(h).fill(
// 		new Array<Square>(w).fill(airSquare)
// 	);
// 	for (let i = 0; i < h; ++i){
// 		if (s[i].length != w) throw new Error("not same width");
// 		for (let j = 0; j < w; ++j){
// 			switch (s[i][j]) {
// 				case '.':

// 					break;

// 				default:
// 					break;
// 			}
// 		}
// 	}
// 	return ret;
// }

// todo: History

export class Map {
	squares: Square[][];
	constructor(squares: Square[][]) {
		this.squares = squares;
	}
}

export function squaresFrom(s: Stage): Square[][] {
	const h = Math.max(8 + s.tests.length, 11),
		w = 11;
	let ret = new Array<Square[]>(h).fill(new Array<Square>(w).fill(airSquare));
	for (let j = 0; j < w; ++j) {
		ret[5][j] = {
			_type: "block",
			block: "wall",
			name: "",
			movable: false,
			collidable: true,
			locked: false,
		};
	}
	ret[5][5] = {
		_type: "block",
		block: "submit",
		name: "submit",
		movable: false,
		collidable: false,
		locked: false,
	};
	// for(let i in s.terms){}...
	return ret;
}
