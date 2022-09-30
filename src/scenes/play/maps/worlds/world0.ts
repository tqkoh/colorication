import {
	airSquare as air,
	parentSquare as par,
	Square,
	squaresFrom,
} from "../../map";
import { stage0 } from "./world0/stage0";

const t = squaresFrom(stage0);
console.log(t);

const s_0: Square = {
	_type: "stage",
	stage: stage0,
	name: stage0.name,
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
