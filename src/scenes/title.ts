import { Howl } from "howler";
import Phaser from "phaser";
import { justDown, keysFrom } from "../data/keyConfig";
import { deb } from "../utils/deb";

const FADEIN_LENGTH = 200;
const FADEOUT_LENGTH = 1000;
// const WHITE = [255, 239, 215];
const WHITE = [250, 247, 240];
const BLACK = [84, 75, 64];

export default class Title extends Phaser.Scene {
	private keys: {
		next: Phaser.Input.Keyboard.Key[];
	};

	sTitleIntro: Howl;
	sTitleLoop: Howl;
	sStart: Howl;
	sPoint: Howl;
	sEnter: Howl;
	fading: boolean;
	fadingStart: number;

	constructor() {
		super({ key: "title" });
		this.keys = {
			next: [],
		};
		this.sTitleIntro = new Howl({
			src: ["assets/sounds/title_intro.mp3"],
		});
		this.sTitleLoop = new Howl({
			src: ["assets/sounds/title_loop.mp3"],
			loop: true,
		});
		this.sStart = new Howl({
			src: ["assets/sounds/start.mp3"],
		});
		this.sTitleIntro.on("end", () => {
			this.sTitleLoop.play();
		});
		this.sPoint = new Howl({
			src: ["assets/sounds/point.mp3"],
		});
		this.sEnter = new Howl({
			src: ["assets/sounds/enter.mp3"],
		});
		this.fading = false;
		this.fadingStart = 0;
	}

	preload() {
		deb("Title.preload");
		this.cameras.main.setBackgroundColor(
			"rgba(" + BLACK[0] + "," + BLACK[1] + "," + BLACK[2] + "," + "1)"
		);
		this.load.image("title", "assets/images/title.png");
	}

	create() {
		deb("Title.create");

		this.keys.next = keysFrom(this, globalThis.keyConfig.Enter);
		// if (localStorage.getItem("played") == null) {
		// 	this.scene.start("game");
		// }
		this.sTitleIntro.play();
		{
			const y = screenh / 2,
				x = screenw / 2;
			this.add.image(x, y, "title");
		}

		this.cameras.main.fadeIn(
			FADEIN_LENGTH / 2,
			BLACK[0],
			BLACK[1],
			BLACK[2]
		);
		this.cameras.main.setBackgroundColor(
			"rgba(" + WHITE[0] + "," + WHITE[1] + "," + WHITE[2] + "," + "1)"
		);
	}

	update() {
		if (this.fading) {
			const el = new Date().getTime() - this.fadingStart;
			const volume = Math.max(0, 0.5 - el / FADEOUT_LENGTH);
			this.sTitleIntro.volume(volume);
			this.sTitleLoop.volume(volume);
			if (el > FADEOUT_LENGTH) {
				this.scene.start("play");
				this.sTitleIntro.stop();
				this.sTitleLoop.stop();
			}
		} else if (justDown(this.keys.next)) {
			deb("enter");
			this.cameras.main.fadeOut(
				FADEOUT_LENGTH / 2,
				WHITE[0],
				WHITE[1],
				WHITE[2]
			);
			this.fading = true;
			this.fadingStart = new Date().getTime();
			this.sStart.play();
		}
	}
}
