import Phaser from "phaser";
import { match, P } from "ts-pattern";
import { isDown, justDown, keysFrom } from "../data/keyConfig";
import { GameMap, Square } from "./play/gamemap";
import { mapRoot } from "./play/maps/root";

type Direction = "right" | "down" | "left" | "up";

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
	keepingPressingKey: string;

	uy: number;
	ux: number;

	gGroupMap: Phaser.GameObjects.Group | undefined;
	gImagePlayer: Phaser.GameObjects.Image | undefined;

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
		this.keepingPressingKey = "";
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
			return;
		}
		const next = this.currentMap.squares[nexti][nextj];
		if (next.locked) return;

		this.playeri = nexti;
		this.playerj = nextj;
		console.log(this.playeri, this.playerj);

		const py = this.uy + this.playeri * 16,
			px = this.ux + this.playerj * 16;
		this.gImagePlayer?.setY(py).setX(px);
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
	}

	processMovementKey(k: string) {
		if (this.keepingPressingKey === k) {
			++this.keepingPressingFrame;
		} else {
			this.keepingPressingKey = k;
			this.keepingPressingFrame = 1;
		}
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
			console.log(this.keys);
			ja = false;
			jd = false;
		}

		if (w) this.processMovementKey("w");
		else if (a) this.processMovementKey("a");
		else if (s) this.processMovementKey("s");
		else if (d) this.processMovementKey("d");
		else {
			this.keepingPressingFrame = -1;
			this.keepingPressingKey = "";
		}

		const T = 30;

		if (
			jd ||
			(this.keepingPressingKey === "d" &&
				this.keepingPressingFrame % T === 0 &&
				this.keepingPressingFrame > T)
		) {
			this.moveToDirection("right", 0);
		}
		if (
			js ||
			(this.keepingPressingKey === "s" &&
				this.keepingPressingFrame % T === 0 &&
				this.keepingPressingFrame > T)
		) {
			this.moveToDirection("down", Math.PI / 2);
		}
		if (
			ja ||
			(this.keepingPressingKey === "a" &&
				this.keepingPressingFrame % T === 0 &&
				this.keepingPressingFrame > T)
		) {
			this.moveToDirection("left", Math.PI);
		}
		if (
			jw ||
			(this.keepingPressingKey === "w" &&
				this.keepingPressingFrame % T === 0 &&
				this.keepingPressingFrame > T)
		) {
			this.moveToDirection("up", (Math.PI * 3) / 2);
		}
	}

	imageTagFromSquare(s: Square): string {
		return match(s)
			.with({ _type: "air" }, () => "air")
			.with({ _type: "map" }, () => "lam")
			.with({ _type: "stage" }, () => "lam")
			.with({ _type: "block" }, () => "lam")
			.with({ _type: "term", term: { _type: "lam" } }, () => "lam")
			.with({ _type: P._ }, () => "air")
			.exhaustive();
	}

	initDrawing() {
		// map
		this.gGroupMap?.setY(this.uy).setX(this.ux);

		for (let i = 0; i < this.currentMap.h; ++i) {
			for (let j = 0; j < this.currentMap.w; ++j) {
				const y = 16 * i,
					x = 16 * j;
				this.gGroupMap?.create(
					this.ux + x,
					this.uy + y,
					this.imageTagFromSquare(this.currentMap.squares[i][j])
				);
			}
		}

		// player
		const py = this.uy + this.playeri * 16,
			px = this.ux + this.playerj * 16;
		this.gImagePlayer = this.add.image(px, py, "player");
	}

	preload() {
		console.log("Play.preload");

		this.keys.Enter = keysFrom(this, globalThis.keyConfig.Enter);
		this.keys.Ctrl = keysFrom(this, globalThis.keyConfig.Ctrl);
		this.keys.W = keysFrom(this, globalThis.keyConfig.W);
		this.keys.A = keysFrom(this, globalThis.keyConfig.A);
		this.keys.S = keysFrom(this, globalThis.keyConfig.S);
		this.keys.D = keysFrom(this, globalThis.keyConfig.D);

		this.load.image("lam", "assets/images/lam.png"); // todo: matomeru
		this.load.image("air", "assets/images/air.png");
		this.load.image("player", "assets/images/player.png");
	}

	create() {
		console.log("Play.create");
		console.log(this.map);
		this.gGroupMap = this.add.group();
		this.initDrawing();
	}

	update() {
		this.handleMovement();
	}
}
