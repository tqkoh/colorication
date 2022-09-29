import Term from "../../utils/subst";

export type Block = "parent" | "reset" | "submit" | "apply" | "equal" | "place";

export type Square = (
	| { _type: "air" }
	| { _type: "term"; term: Term }
	| { _type: "map"; path: string; map?: Map }
	| { _type: "stage"; path: string; map?: Map }
	| { _type: "block"; block: Block }
) & {
	name: string;
	movable: boolean;
	collidable: boolean;
	locked: boolean;
};

// todo: History

export class Map {
	squares: Square[][];
	constructor(from: "map" | "stage" | "term", path: string) {
		this.squares = [];
	}
}
