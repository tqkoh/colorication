import Phaser from "phaser";
import { defaultKeyConfig } from "./data/keyConfig";
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

let config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	scene: [Title, Play],
};

new Phaser.Game(config);
