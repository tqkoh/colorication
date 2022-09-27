import Phaser from "phaser";

export default class Play extends Phaser.Scene {
	constructor() {
		super({ key: "play" });
	}

	preload() {
		console.log("Play.preload");
	}

	create() {
		console.log("Play.create");
	}

	update() {}
}
