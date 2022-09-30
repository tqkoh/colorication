import Phaser from "phaser";
import { match } from "ts-pattern";
import { justDown, keysFrom } from "../data/keyConfig";
import { GameMap } from "./play/gamemap";
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
	}

	moveToDirection(d: Direction) {
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
	}

	handleMovement() {
		let w = justDown(this.keys.W),
			a = justDown(this.keys.A),
			s = justDown(this.keys.S),
			d = justDown(this.keys.D);
		if (w && s) {
			w = false;
			s = false;
		}
		if (a && d) {
			console.log(this.keys);
			a = false;
			d = false;
		}

		if (w) {
			if (this.playerdirection === "up")
				this.moveToDirection(this.playerdirection);
			else this.playerdirection = "up";
		}
		if (a) {
			if (this.playerdirection === "left")
				this.moveToDirection(this.playerdirection);
			else this.playerdirection = "left";
		}
		if (s) {
			if (this.playerdirection === "down")
				this.moveToDirection(this.playerdirection);
			else this.playerdirection = "down";
		}
		if (d) {
			if (this.playerdirection === "right")
				this.moveToDirection(this.playerdirection);
			else this.playerdirection = "right";
		}
	}

	preload() {
		console.log("Play.preload");

		this.keys.Enter = keysFrom(this, globalThis.keyConfig.Enter);
		this.keys.Ctrl = keysFrom(this, globalThis.keyConfig.Ctrl);
		this.keys.W = keysFrom(this, globalThis.keyConfig.W);
		this.keys.A = keysFrom(this, globalThis.keyConfig.A);
		this.keys.S = keysFrom(this, globalThis.keyConfig.S);
		this.keys.D = keysFrom(this, globalThis.keyConfig.D);
	}

	create() {
		console.log("Play.create");
		console.log(this.map);
	}

	update() {
		this.handleMovement();
	}
}
