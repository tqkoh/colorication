import Phaser from "phaser";
import { justDown, keysFrom } from "../data/keyConfig";
import { deb } from "../utils/deb";
import { FontForPhaser } from "../utils/fontForPhaser";

const WHITE2 = [255, 239, 215];
const BLACK = [84, 75, 64];

export default class Load extends Phaser.Scene {
	keys: {
		next: Phaser.Input.Keyboard.Key[];
	};

	font: FontForPhaser | undefined;

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
		this.load.image("font", "assets/images/font.png");
		// this.load.image("load", "assets/images/load.png");
	}

	create() {
		deb("Load.create");

		// {
		// 	let y = 0,
		// 		x = 0;
		// 	y = y + globalThis.screenh / 2;
		// 	x = x + globalThis.screenw / 2;
		// 	this.add.image(x, y, "load");
		// }
		{
			let g = this.add.graphics();
			g.fillStyle(
				Phaser.Display.Color.GetColor(BLACK[0], BLACK[1], BLACK[2]),
				255
			);
			g.fillRect(0, 0, globalThis.screenw, globalThis.screenh);
		}

		this.keys.next = keysFrom(this, globalThis.keyConfig.Enter);

		this.font = new FontForPhaser(this.textures, "font", 10);
		this.font.loadImageFrom(
			"press enter to start...",
			"loading",
			...WHITE2
		);
		{
			const y = globalThis.screenh - 12,
				x = globalThis.screenw - 70;
			this.add.image(x, y, "loading");
		}
	}

	update() {
		if (justDown(this.keys.next)) {
			deb("enter");
			this.scene.start("title");
		}
	}
}
