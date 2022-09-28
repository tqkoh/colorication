import Phaser from "phaser";

export default class Play extends Phaser.Scene {
	private keys: {
		Enter: Phaser.Input.Keyboard.Key[];
		W: Phaser.Input.Keyboard.Key[];
		A: Phaser.Input.Keyboard.Key[];
		S: Phaser.Input.Keyboard.Key[];
		D: Phaser.Input.Keyboard.Key[];
		Ctrl: Phaser.Input.Keyboard.Key[];
	};

	constructor() {
		super({ key: "play" });
		this.keys = {
			Enter: [],
			W: [],
			A: [],
			S: [],
			D: [],
			Ctrl: [],
		};
	}

	preload() {
		console.log("Play.preload");
	}

	create() {
		console.log("Play.create");
	}

	update() {}
}
