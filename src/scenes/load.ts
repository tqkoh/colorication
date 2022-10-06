import Phaser from "phaser";
import { justDown, keysFrom } from "../data/keyConfig";
import { deb } from "../utils/deb";

const BLACK = [84, 75, 64];

export default class Load extends Phaser.Scene {
	private keys: {
		next: Phaser.Input.Keyboard.Key[];
	};

	constructor() {
		super({ key: "load" });
		this.keys = {
			next: [],
		};
	}

	preload() {
		deb("Load.preload");
		this.cameras.main.setBackgroundColor(
			"rgba(" + BLACK[0] + "," + BLACK[1] + "," + BLACK[2] + "," + "1)"
		);
		this.load.image("load", "assets/images/load.png");
	}

	create() {
		deb("Load.create");

		{
			let y = 0,
				x = 0;
			y = y + globalThis.screenh / 2;
			x = x + globalThis.screenw / 2;
			this.add.image(x, y, "load");
		}
		this.keys.next = keysFrom(this, globalThis.keyConfig.Enter);
	}

	update() {
		if (justDown(this.keys.next)) {
			deb("enter");
			this.scene.start("title");
		}
	}
}
