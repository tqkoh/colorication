import { Howl } from "howler";
import Phaser from "phaser";
import { justDown, keysFrom } from "../data/keyConfig";

export default class Title extends Phaser.Scene {
	private keys: {
		next: Phaser.Input.Keyboard.Key[];
	};

	sTitleIntroH: Howl;
	sTitleLoopH: Howl;

	constructor() {
		super({ key: "title" });
		this.keys = {
			next: [],
		};
		this.sTitleIntroH = new Howl({
			src: ["assets/sounds/title_intro.mp3"],
		});
		this.sTitleLoopH = new Howl({
			src: ["assets/sounds/title_loop.mp3"],
			loop: true,
		});
		this.sTitleIntroH.on("end", () => {
			this.sTitleLoopH.play();
		});
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
		this.sTitleIntroH.play();
	}

	update() {
		if (justDown(this.keys.next)) {
			console.log("enter");
			this.scene.start("play");
			this.sTitleIntroH.stop();
			this.sTitleLoopH.stop();
		}
	}
}
