import { Howl } from "howler";
import Phaser from "phaser";
import { match, P } from "ts-pattern";
import { isDown, justDown, keysFrom } from "../data/keyConfig";
import { deb } from "../utils/deb";
import { FontForPhaser } from "../utils/fontForPhaser";
import { GameMap, Square } from "./play/gamemap";
import { mapRoot } from "./play/maps/root";

type Direction = "right" | "down" | "left" | "up";

const FADEIN_LENGTH = 200;
const WHITE = [250, 247, 240];

export default class Play extends Phaser.Scene {
	private keys: {
		Enter: Phaser.Input.Keyboard.Key[];
		W: Phaser.Input.Keyboard.Key[];
		A: Phaser.Input.Keyboard.Key[];
		S: Phaser.Input.Keyboard.Key[];
		D: Phaser.Input.Keyboard.Key[];
		Ctrl: Phaser.Input.Keyboard.Key[];
	};
	map: GameMap;
	currentMap: GameMap;
	playeri: number;
	playerj: number;
	playerdirection: Direction;
	keepingPressingFrame: number;
	lastPressedMovementKey: string;
	font: FontForPhaser | undefined;

	uy: number;
	ux: number;

	gGroupMap: Phaser.GameObjects.Group | undefined;
	gImagePlayer: Phaser.GameObjects.Image | undefined;
	gImageFocus: Phaser.GameObjects.Image | undefined;

	sCollide: Howl;
	sPoint: Howl;
	sEnter: Howl;

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
		this.map = new GameMap(mapRoot);
		this.currentMap = this.map; // ref
		this.playeri = this.map.starti;
		this.playerj = this.map.startj;
		this.playerdirection = "right";

		const H = globalThis.screenh - 31,
			W = globalThis.screenw,
			h = this.currentMap.h * 16,
			w = this.currentMap.w * 16;
		this.uy = 31 + H / 2 - h / 2;
		this.ux = W / 2 - w / 2;

		this.keepingPressingFrame = 0;
		this.lastPressedMovementKey = "";

		this.sCollide = new Howl({
			src: ["assets/sounds/collide.mp3"],
		});
		this.sPoint = new Howl({
			src: ["assets/sounds/point.mp3"],
		});
		this.sEnter = new Howl({
			src: ["assets/sounds/enter.mp3"],
		});
	}

	moveToDirectionI(d: Direction) {
		const diff: number[] = match(d)
			.with("right", () => [0, 1])
			.with("down", () => [1, 0])
			.with("left", () => [0, -1])
			.with("up", () => [-1, 0])
			.exhaustive();

		const nexti = this.playeri + diff[0],
			nextj = this.playerj + diff[1];
		if (
			nexti < 0 ||
			this.currentMap.h <= nexti ||
			nextj < 0 ||
			this.currentMap.w <= nextj
		) {
			this.sCollide.play();
			return;
		}
		const next = this.currentMap.squares[nexti][nextj];
		if (next.collidable) {
			this.sCollide.play();
			return;
		}

		this.playeri = nexti;
		this.playerj = nextj;
		deb(this.playeri, this.playerj);
	}

	moveToDirection(d: Direction, rotation: number) {
		if (this.playerdirection === d) {
			this.moveToDirectionI(this.playerdirection);
		} else {
			this.playerdirection = d;
			if (this.gImagePlayer !== undefined) {
				this.gImagePlayer.rotation = rotation;
			}
		}

		const py = this.uy + this.playeri * 16,
			px = this.ux + this.playerj * 16;
		this.gImagePlayer?.setY(py).setX(px);
		let fy = py,
			fx = px;
		if (this.playerdirection == "right") fx += 16;
		if (this.playerdirection == "down") fy += 16;
		if (this.playerdirection == "left") fx -= 16;
		if (this.playerdirection == "up") fy -= 16;
		this.gImageFocus?.setY(fy).setX(fx);
	}

	handleMovement() {
		let jw = justDown(this.keys.W),
			ja = justDown(this.keys.A),
			js = justDown(this.keys.S),
			jd = justDown(this.keys.D),
			w = isDown(this.keys.W),
			a = isDown(this.keys.A),
			s = isDown(this.keys.S),
			d = isDown(this.keys.D);
		if (jw && js) {
			jw = false;
			js = false;
		}
		if (ja && jd) {
			deb(this.keys);
			ja = false;
			jd = false;
		}

		if (jw)
			(this.lastPressedMovementKey = "w"),
				(this.keepingPressingFrame = 1);
		if (ja)
			(this.lastPressedMovementKey = "a"),
				(this.keepingPressingFrame = 1);
		if (js)
			(this.lastPressedMovementKey = "s"),
				(this.keepingPressingFrame = 1);
		if (jd)
			(this.lastPressedMovementKey = "d"),
				(this.keepingPressingFrame = 1);

		if (w || a || s || d) ++this.keepingPressingFrame;
		else {
			this.keepingPressingFrame = -1;
		}

		const T = 30;

		if (
			jd ||
			(d &&
				this.lastPressedMovementKey === "d" &&
				this.keepingPressingFrame % T === 0 &&
				this.keepingPressingFrame > T)
		) {
			this.moveToDirection("right", 0);
		}
		if (
			js ||
			(s &&
				this.lastPressedMovementKey === "s" &&
				this.keepingPressingFrame % T === 0 &&
				this.keepingPressingFrame > T)
		) {
			this.moveToDirection("down", Math.PI / 2);
		}
		if (
			ja ||
			(a &&
				this.lastPressedMovementKey === "a" &&
				this.keepingPressingFrame % T === 0 &&
				this.keepingPressingFrame > T)
		) {
			this.moveToDirection("left", Math.PI);
		}
		if (
			jw ||
			(w &&
				this.lastPressedMovementKey === "w" &&
				this.keepingPressingFrame % T === 0 &&
				this.keepingPressingFrame > T)
		) {
			this.moveToDirection("up", (Math.PI * 3) / 2);
		}
	}

	imageTagFromSquare(
		s: Square,
		i: number,
		j: number,
		h: number,
		w: number
	): string {
		return match(s)
			.with({ _type: "air" }, () => {
				let ret = "air";
				if (j == 0) {
					ret += "l";
				}
				if (j == w - 1) {
					ret += "r";
				}
				if (i == 0) {
					ret += "t";
				}
				if (i == h - 1) {
					ret += "b";
				}
				return ret;
			})
			.with({ _type: "map" }, () => "lam")
			.with({ _type: "stage" }, () => "lam")
			.with({ _type: "block" }, () => "lam")
			.with({ _type: "term", term: { _type: "lam" } }, () => "lam")
			.with({ _type: P._ }, () => "air")
			.exhaustive();
	}

	initDrawing() {
		{
			let y = 31,
				x = -14,
				h = 224,
				w = 368;
			y = y + (globalThis.screenh - y) / 2;
			x = globalThis.screenw / 2;
			this.add.tileSprite(x, y, w, h, "out");
		}

		// map
		this.gGroupMap?.setY(this.uy).setX(this.ux);

		for (let i = 0; i < this.currentMap.h; ++i) {
			for (let j = 0; j < this.currentMap.w; ++j) {
				const y = 16 * i,
					x = 16 * j;
				this.gGroupMap?.create(
					this.ux + x,
					this.uy + y,
					this.imageTagFromSquare(
						this.currentMap.squares[i][j],
						i,
						j,
						this.currentMap.h,
						this.currentMap.w
					)
				);
			}
		}

		// player
		const py = this.uy + this.playeri * 16,
			px = this.ux + this.playerj * 16;
		this.gImagePlayer = this.add.image(px, py, "player");
		this.gImageFocus = this.add.image(px + 16, py, "focus");
	}

	preload() {
		deb("Play.preload");
		this.cameras.main.setBackgroundColor(
			"rgba(" + WHITE[0] + "," + WHITE[1] + "," + WHITE[2] + "," + "1)"
		);

		this.keys.Enter = keysFrom(this, globalThis.keyConfig.Enter);
		this.keys.Ctrl = keysFrom(this, globalThis.keyConfig.Ctrl);
		this.keys.W = keysFrom(this, globalThis.keyConfig.W);
		this.keys.A = keysFrom(this, globalThis.keyConfig.A);
		this.keys.S = keysFrom(this, globalThis.keyConfig.S);
		this.keys.D = keysFrom(this, globalThis.keyConfig.D);

		this.load.image("lam", "assets/images/lam.png"); // todo: matomeru
		this.load.image("air", "assets/images/air.png");
		this.load.image("airr", "assets/images/airr.png");
		this.load.image("airb", "assets/images/airb.png");
		this.load.image("airl", "assets/images/airl.png");
		this.load.image("airt", "assets/images/airt.png");
		this.load.image("airrb", "assets/images/airrb.png");
		this.load.image("airlb", "assets/images/airlb.png");
		this.load.image("airlt", "assets/images/airlt.png");
		this.load.image("airrt", "assets/images/airrt.png");
		this.load.image("player", "assets/images/player.png");
		this.load.image("focus", "assets/images/focus.png");
		this.load.image("out", "assets/images/out.png");
		// this.load.image("menu_enter", "assets/images/menu_enter.png");
		this.load.image("menu_pastet", "assets/images/menu_paste.png");
		// this.load.image("menu_new", "assets/images/menu_new.png");
		// this.load.image("menu_close", "assets/images/menu_close.png");
		// this.load.image("menu_memo", "assets/images/menu_memo.png");
		// this.load.image("menu_copy", "assets/images/menu_copy.png");
		// this.load.image("menu_delete", "assets/images/menu_delete.png");
		this.load.image("font", "assets/images/font.png");

		this.load.audio("collide", "assets/sounds/collide.mp3");
	}

	create() {
		deb("Play.create");
		deb(this.map);
		this.gGroupMap = this.add.group();
		this.initDrawing();

		this.cameras.main.fadeIn(
			FADEIN_LENGTH / 2,
			WHITE[0],
			WHITE[1],
			WHITE[2]
		);
		this.cameras.main.setBackgroundColor(
			"rgba(" + WHITE[0] + "," + WHITE[1] + "," + WHITE[2] + "," + "1)"
		);

		this.font = new FontForPhaser(this.textures, "font", 31);
		this.font.loadImageFrom("menu_enter", "menu_enter");
		this.font.loadImageFrom("menu_paste", "menu_paste");
		this.font.loadImageFrom("menu_new", "menu_new");
		this.font.loadImageFrom("menu_close", "menu_close");
		this.font.loadImageFrom("menu_memo", "menu_memo");
		this.font.loadImageFrom("menu_copy", "menu_copy");
		this.font.loadImageFrom("menu_delete", "menu_delete");

		this.add.image(100, 100, "menu_enter");
	}

	update() {
		this.handleMovement();
	}
}
