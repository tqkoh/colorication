import Phaser from "phaser";
import Title from "./scenes/title";

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.AUTO,
	width: 800,
	height: 600,
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	physics: {
		default: "arcade",
		arcade: {
			gravity: { y: 200 },
		},
	},
	scene: Title,
};
new Phaser.Game(config);
