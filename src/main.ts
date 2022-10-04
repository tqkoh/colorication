import Phaser from "phaser";
import { defaultKeyConfig } from "./data/keyConfig";
import Load from "./scenes/load";
import Play from "./scenes/play";
import Title from "./scenes/title";
import { keyConfigCodec } from "./utils/storageCodecs";
import { baseStorage, createTypedStorage } from "./utils/typedStorage";

globalThis.storage = createTypedStorage(
	{
		keyConfig: keyConfigCodec,
	},
	new baseStorage(localStorage)
);

globalThis.keyConfig = defaultKeyConfig;

{
	let keyConfigFromStorage = globalThis.storage.get("keyConfig");
	if (keyConfigFromStorage == null) {
		globalThis.keyConfig = defaultKeyConfig;
		globalThis.storage.set("keyConfig", globalThis.keyConfig);
	} else {
		globalThis.keyConfig = {
			...globalThis.keyConfig,
			...keyConfigFromStorage,
		};
		globalThis.storage.set("keyConfig", globalThis.keyConfig);
	}
}

globalThis.screenh = 255;
globalThis.screenw = 340;

let config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	height: globalThis.screenh,
	width: globalThis.screenw,
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	scene: [Load, Title, Play],
	pixelArt: true,
};

// new Phaser.Game(config);
// {
// 	let e = document.querySelector("canvas");
// 	if (e) {
// 		console.log("a");
// 		e.style.display = "none";
// 	}
// }

new Phaser.Game(config);
