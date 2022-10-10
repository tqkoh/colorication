import { airSquare as a, GameMap, Square, startSquare as s } from "../gamemap";
import { mapWorld0 } from "./worlds/world0";

const w_0: Square = {
	_type: "map",
	map: new GameMap(mapWorld0),
	name: "0. welcome",
	movable: false,
	collidable: true,
	locked: false,
};

export const mapRoot: Square[][] = [
	[s(), a(), a(), a(), a(), a(), a(), a(), a(), a(), a()],
	[a(), a(), a(), a(), a(), a(), a(), a(), a(), a(), a()],
	[a(), w_0, a(), a(), a(), a(), a(), a(), a(), a(), a()],
	[a(), a(), a(), a(), a(), a(), a(), a(), a(), a(), a()],
	[a(), a(), a(), a(), a(), a(), a(), a(), a(), a(), a()],
	[a(), a(), a(), a(), a(), a(), a(), a(), a(), a(), a()],
];
