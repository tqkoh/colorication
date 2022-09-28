import { KeyConfig } from "../data/defaultKeyConfig";
import { Codec } from "./createTypedStorage";

export const stringCodec: Codec<string> = {
	encode: (s: string) => s,
	decode: (s: string) => s,
};

export const numberCodec: Codec<number> = {
	encode: (n: number) => n.toString(),
	decode: (s: string) => {
		const n = Number(s);
		if (isNaN(n)) {
			throw new Error("input is not decodable as number");
		}
		return n;
	},
};

export const keyConfigCodec: Codec<KeyConfig> = {
	encode: (k: KeyConfig) => JSON.stringify(k),
	decode: (s: string) => {
		return JSON.parse(s) as KeyConfig;
	},
};
