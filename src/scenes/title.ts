import Phaser from "phaser";

export default class Title extends Phaser.Scene {
	private keys:
		| {
				Enter: Phaser.Input.Keyboard.Key;
		  }
		| undefined;

	constructor() {
		super({ key: "title" });
	}

	preload() {
		console.log("Title.preload");
	}

	create() {
		console.log("Title.create");
		this.keys = {
			Enter: this.input.keyboard.addKey(
				Phaser.Input.Keyboard.KeyCodes.ENTER
			),
		};
		// if (localStorage.getItem("played") == null) {
		// 	this.scene.start("game");
		// }
	}

	update() {
		if (Phaser.Input.Keyboard.JustDown(this.keys!.Enter)) {
			console.log("enter");
			this.scene.start("play");
		}
	}
}
