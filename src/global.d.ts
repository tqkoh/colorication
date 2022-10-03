import { KeyConfig } from "./data/keyConfig";
import { Codec, TypedStorage } from "./utils/typedStorage";

declare global {
	var storage: TypedStorage<{
		keyConfig: Codec<KeyConfig>;
	}>;
	var keyConfig: KeyConfig;
	var screenh: number;
	var screenw: number;
	var game: Phaser.Game;
	var start: () => void;
}
