import { airSquare as air, parentSquare as par, Square } from "../../map";
import { Stage0 } from "./world0/stage0";

const s_0: Square = {
	_type: "stage",
	stage: new Stage0(),
	name: "",
	movable: false,
	collidable: false,
	locked: false,
};

export const mapWorld0: Square[][] = [
	[par, air, air, air, air, air, air, air, air, air],
	[air, air, air, air, air, air, air, air, air, air],
	[air, s_0, air, air, air, air, air, air, air, air],
	[air, air, air, air, air, air, air, air, air, air],
	[air, air, air, air, air, air, air, air, air, air],
	[air, air, air, air, air, air, air, air, air, air],
];
