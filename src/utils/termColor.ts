import hash from "object-hash";
import { Square } from "../scenes/play/gamemap";
import Term, { normalized } from "./term";

export function squareHash(s: Square): string {
	if (s._type === "term") {
		const ns: Square = {
			...s,
			term: normalized(s.term),
		};
		return hash(ns);
	}
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
