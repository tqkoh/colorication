import Phaser from "phaser";

export default class Title extends Phaser.Scene {
	private keys: {
		next: Phaser.Input.Keyboard.Key[];
	};

	constructor() {
		super({ key: "title" });
		this.keys = {
			next: [],
		};
	}

	preload() {
		console.log("Title.preload");
	}

	create() {
		console.log("Title.create");

		// this.keys.next = this.game.config.keyConfig.map(...)

		this.registry.set("test", "test");
		// if (localStorage.getItem("played") == null) {
		// 	this.scene.start("game");
		// }
	}

	update() {
		// if (Phaser.Input.Keyboard.JustDown(this.keys!.Enter)) {
		// 	console.log("enter");
		// 	this.scene.start("play");
		// }
	}
}
