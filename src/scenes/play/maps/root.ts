import { airSquare as air, Map, Square } from "../map";
import { mapWorld0 } from "./worlds/world0";

const w_0: Square = {
	_type: "map",
	map: new Map(mapWorld0),
	name: "",
	movable: false,
	collidable: false,
	locked: false,
};

export const mapRoot: Square[][] = [
	[air, air, air, air, air, air, air, air, air, air],
	[air, air, air, air, air, air, air, air, air, air],
	[air, w_0, air, air, air, air, air, air, air, air],
	[air, air, air, air, air, air, air, air, air, air],
	[air, air, air, air, air, air, air, air, air, air],
	[air, air, air, air, air, air, air, air, air, air],
];
