import {
	airSquare as air,
	parentSquare as par,
	Square,
	startSquare as sta,
} from "../../gamemap";
import { stage0 } from "./world0/stage0";

const s_0: Square = {
	_type: "stage",
	stage: stage0,
	name: stage0.name,
	movable: false,
	collidable: true,
	locked: false,
};

export const mapWorld0: Square[][] = [
	[par, sta, air, air, air, air, air, air, air, air],
	[air, air, air, air, air, air, air, air, air, air],
	[air, s_0, air, air, air, air, air, air, air, air],
	[air, air, air, air, air, air, air, air, air, air],
	[air, air, air, air, air, air, air, air, air, air],
	[air, air, air, air, air, air, air, air, air, air],
];
