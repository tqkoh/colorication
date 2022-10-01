import {
	airSquare as air,
	GameMap,
	Square,
	startSquare as sta,
} from "../gamemap";
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
	[sta, air, air, air, air, air, air, air, air, air],
	[air, air, air, air, air, air, air, air, air, air],
	[air, w_0, air, air, air, air, air, air, air, air],
	[air, air, air, air, air, air, air, air, air, air],
	[air, air, air, air, air, air, air, air, air, air],
];
