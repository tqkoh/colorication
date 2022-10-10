import {
	airSquare as a,
	parentSquare as p,
	Square,
	startSquare as s,
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
	[p(), s(), a(), a(), a(), a(), a(), a(), a(), a(), a()],
	[a(), a(), a(), a(), a(), a(), a(), a(), a(), a(), a()],
	[a(), s_0, a(), a(), a(), a(), a(), a(), a(), a(), a()],
	[a(), a(), a(), a(), a(), a(), a(), a(), a(), a(), a()],
	[a(), a(), a(), a(), a(), a(), a(), a(), a(), a(), a()],
	[a(), a(), a(), a(), a(), a(), a(), a(), a(), a(), a()],
];
