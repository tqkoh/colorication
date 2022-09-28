import Phaser from "phaser";
import { defaultKeyConfig, KeyConfig } from "./data/defaultKeyConfig";
import Play from "./scenes/play";
import Title from "./scenes/title";
import { keyConfigCodec } from "./utils/storageCodecs";
import {
	baseStorage,
	Codec,
	createTypedStorage,
	TypedStorage,
} from "./utils/typedStorage";

class Game extends Phaser.Game {
	storage;
	keyConfig: KeyConfig;
	constructor(config: Phaser.Types.Core.GameConfig) {
		super(config);
		this.storage = createTypedStorage(
			{
				keyConfig: keyConfigCodec,
			},
			new baseStorage(localStorage)
		);

		let keyConfigFromStorage = this.storage.get("keyConfig");
		if (keyConfigFromStorage == null) {
			this.storage.set("keyConfig", defaultKeyConfig);
			this.keyConfig = defaultKeyConfig;
		} else {
			this.keyConfig = keyConfigFromStorage;
		}
	}
}

type GameConfig = Phaser.Types.Core.GameConfig & {
	storage: TypedStorage<{
		keyConfig: Codec<KeyConfig>;
	}>;
	keyConfig: KeyConfig;
};

let config: GameConfig = {
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	scene: [Title, Play],
	storage: createTypedStorage(
		{
			keyConfig: keyConfigCodec,
		},
		new baseStorage(localStorage)
	),
	keyConfig: defaultKeyConfig,
};
{
	let keyConfigFromStorage = config.storage.get("keyConfig");
	if (keyConfigFromStorage == null) {
		config.storage.set("keyConfig", defaultKeyConfig);
		config.keyConfig = defaultKeyConfig;
	} else {
		config.keyConfig = keyConfigFromStorage;
	}
}
// const game = new Phaser.Game<GameConfig>(config);
// game.config.storage;
