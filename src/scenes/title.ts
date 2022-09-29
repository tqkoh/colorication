import Phaser from "phaser";
import { justDown, keysFrom } from "../data/keyConfig";

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

		this.input.keyboard.addKey(3);
		this.keys.next = keysFrom(this, globalThis.keyConfig.Enter);
		// if (localStorage.getItem("played") == null) {
		// 	this.scene.start("game");
		// }
	}

	update() {
		if (justDown(this.keys.next)) {
			console.log("enter");
			this.scene.start("play");
		}
	}
}
