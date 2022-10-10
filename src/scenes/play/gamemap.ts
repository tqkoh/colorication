import * as lodash from "lodash";
import Term from "../../utils/term";

export type Block =
	| "start"
	| "parent"
	| "reset"
	| "submit"
	| "apply"
	| "equal"
	| "place"
	| "down"
	| "wall";

export type Test = {
	input: Term[];
	output: Term;
};

export type Stage = {
	tests: Test[];
	terms: Square[];
	name: string;
};

export type Square = (
	| { _type: "air" }
	| { _type: "term"; term: Term; map?: GameMap }
	| { _type: "map"; map: GameMap }
	| { _type: "stage"; stage: Stage; map?: GameMap }
	| { _type: "block"; block: Block }
) & {
	name: string;
	movable: boolean;
	collidable: boolean;
	locked: boolean;
	image?: Phaser.GameObjects.Image;

	testString?: string;
};

export const airSquareI: Square = {
	_type: "air",
	name: "",
	movable: false,
	collidable: false,
	locked: false,
};

export function airSquare() {
	return lodash.cloneDeep(airSquareI);
}

export const parentSquareI: Square = {
	_type: "block",
	block: "parent",
	name: "..",
	movable: false,
	collidable: true,
	locked: false,
};

export function parentSquare() {
	return lodash.cloneDeep(parentSquareI);
}

export const startSquareI: Square = {
	_type: "block",
	block: "start",
	name: "",
	movable: false,
	collidable: false,
	locked: false,
};

export function startSquare() {
	return lodash.cloneDeep(startSquareI);
}

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

export class GameMap {
	parentMap: GameMap | undefined;
	squares: Square[][];
	h: number;
	w: number;
	starti: number;
	startj: number;
	constructor(squares: Square[][]) {
		this.starti = -1;
		this.startj = -1;
		this.squares = squares;
		this.h = squares.length;
		this.w = this.h ? squares[0].length : 0;
		for (let i = 0; i < squares.length; ++i) {
			if (squares[i].length != this.w) {
				throw new Error("width does not match");
			}
			for (let j = 0; j < squares[i].length; ++j) {
				if (
					squares[i][j]._type === "block" &&
					(squares[i][j] as { _type: "block"; block: Block })
						.block === "start"
				) {
					this.starti = i;
					this.startj = j;
					this.squares[i][j] = airSquare();
				}
			}
		}
		if (this.starti === -1) throw new Error("start does not exist");
	}
	setParent(parent: GameMap) {
		this.parentMap = parent;
	}
}

export function squaresFromStage(s: Stage): Square[][] {
	const h = Math.max(8 + s.tests.length, 11),
		w = 11;
	let ret = new Array<Square[]>(h).fill(
		new Array<Square>(w).fill(airSquare())
	);
	ret[0][0] = {
		_type: "block",
		block: "parent",
		name: "..",
		movable: false,
		collidable: true,
		locked: false,
	};
	ret[0][1] = startSquare();
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
		collidable: true,
		locked: false,
	};
	ret[6][5] = {
		_type: "block",
		block: "down",
		name: "",
		movable: false,
		collidable: false,
		locked: false,
	};

	for (let k = 0; k < s.terms.length; ++k) {
		let i = 1 + (k / 2) * 2,
			j = 2 + (k % 4) * 2;
		ret[i][j] = s.terms[k];
	}

	return ret;
}

export function squaresFromLam(_t: Term): Square[][] {
	let ret = new Array<Square[]>(7).fill(
		new Array<Square>(6).fill(airSquare())
	);
	return ret;
}
