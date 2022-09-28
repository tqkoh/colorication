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

		this.keys.next = globalThis.keyConfig.Enter.map((k: number) => {
			return this.input.keyboard.addKey(k);
		});
		// if (localStorage.getItem("played") == null) {
		// 	this.scene.start("game");
		// }
	}

	update() {
		if (Phaser.Input.Keyboard.JustDown(this.keys.next[0])) {
			console.log("enter");
			this.scene.start("play");
		}
	}
}
