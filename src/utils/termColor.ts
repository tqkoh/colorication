import hash from "object-hash";
import { Square } from "../scenes/play/gamemap";
import Term from "./term";

export function squareHash(s: Square): string {
	return hash(s);
}

export function coloredHandleFrom(t: Term, hsh: string): string {
	return t._type + "#" + hsh.substring(0, 2);
}

export function deltaHFrom(hsh: string): number {
	const h = parseInt(hsh.substring(0, 2), 16);
	if (h < 0 || 256 <= h) return 0;
	return h / 255;
}
