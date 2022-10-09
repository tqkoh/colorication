import { Howl } from "howler";
import Phaser from "phaser";
import { match, P } from "ts-pattern";
import { isDown, justDown, keysFrom } from "../data/keyConfig";
import { deb } from "../utils/deb";
import { FontForPhaser } from "../utils/fontForPhaser";
import { GameMap, Square } from "./play/gamemap";
import { mapRoot } from "./play/maps/root";

type Direction = "right" | "down" | "left" | "up";
const menuElement = {
	close: 0,
	copy: 1,
	delete: 2,
	enter: 3,
	memo: 4,
	new: 5,
	paste: 6,

	size: 7,
} as const;
const menuElementList: MenuElement[] = [
	menuElement.close,
	menuElement.copy,
	menuElement.delete,
	menuElement.enter,
	menuElement.memo,
	menuElement.new,
	menuElement.paste,
];
const menuElementIds: string[] = [
	"menu_close",
	"menu_copy",
	"menu_delete",
	"menu_enter",
	"menu_memo",
	"menu_new",
	"menu_paste",
];
const menuElementMessages: string[] = [
	"close <ESC>",
	"copy <C-c>",
	"delete <C-d>",
	"enter <C-\n>",
	"memo <F2>",
	"new <C-e>",
	"paste <C-v>",
];

type MenuElement = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const FADEIN_LENGTH = 200;
const MENU_ELEMENT_MERGIN = 2;
const MENU_PADDING = 4;
const BLACK = [84, 75, 64];
const WHITE = [250, 247, 240];
const WHITE2 = [255, 239, 215];

export default class Play extends Phaser.Scene {
	keys: {
		Enter: Phaser.Input.Keyboard.Key[];
		Ctrl: Phaser.Input.Keyboard.Key[];
		Escape: Phaser.Input.Keyboard.Key[];
		W: Phaser.Input.Keyboard.Key[];
		A: Phaser.Input.Keyboard.Key[];
		S: Phaser.Input.Keyboard.Key[];
		D: Phaser.Input.Keyboard.Key[];
	};
	map: GameMap;
	currentMap: GameMap;
	playeri: number;
	playerj: number;
	focusi: number;
	focusj: number;
	playerDirection: Direction;
	menuDisplaying: boolean;
	menu: MenuElement[];
	selected: number;

	keepingPressingFrame: number;
	lastPressedMovementKey: string;
	font: FontForPhaser | undefined;
	mapOriginy: number;
	mapOriginx: number;

	gImagePlayer: Phaser.GameObjects.Image | undefined;
	gImageFocus: Phaser.GameObjects.Image | undefined;
	gMenuElements: Phaser.GameObjects.Image[];
	gMenuBackgroundShape: Phaser.Geom.Rectangle | undefined;
	gMenuBackground: Phaser.GameObjects.Graphics | undefined;

	sCollide: Howl;
	sPoint: Howl;
	sEnter: Howl;

	constructor() {
		super({ key: "play" });
		this.keys = {
			Enter: [],
			Ctrl: [],
			Escape: [],
			W: [],
			A: [],
			S: [],
			D: [],
		};
		this.gMenuElements = [];
		this.map = new GameMap(mapRoot);
		this.currentMap = this.map; // ref
		this.playeri = this.map.starti;
		this.playerj = this.map.startj;
		this.focusi = this.map.starti;
		this.focusj = this.map.startj;
		this.playerDirection = "right";
		++this.focusj;
		this.menuDisplaying = false;
		this.menu = [];
		this.selected = 0;

		const H = globalThis.screenh - 31,
			W = globalThis.screenw,
			h = this.currentMap.h * 16,
			w = this.currentMap.w * 16;
		this.mapOriginy = 31 + H / 2 - h / 2;
		this.mapOriginx = W / 2 - w / 2;

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
		if (this.playerDirection === d) {
			this.moveToDirectionI(this.playerDirection);
		} else {
			this.playerDirection = d;
			if (this.gImagePlayer !== undefined) {
				this.gImagePlayer.rotation = rotation;
			}
		}

		this.focusi = this.playeri;
		this.focusj = this.playerj;

		if (this.playerDirection == "right") ++this.focusj;
		if (this.playerDirection == "down") ++this.focusi;
		if (this.playerDirection == "left") --this.focusj;
		if (this.playerDirection == "up") --this.focusi;

		const py = this.mapOriginy + this.playeri * 16,
			px = this.mapOriginx + this.playerj * 16;
		this.gImagePlayer?.setY(py + 8).setX(px + 8);
		let fy = this.mapOriginy + this.focusi * 16,
			fx = this.mapOriginx + this.focusj * 16;
		this.gImageFocus?.setY(fy + 8).setX(fx + 8);
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

	openMenu() {
		if (
			this.focusi < 0 ||
			this.map.h <= this.focusi ||
			this.focusj < 0 ||
			this.map.w <= this.focusj
		) {
			return;
		}
		this.menuDisplaying = true;
		if (this.map.squares[this.focusi][this.focusj]._type === "air") {
			this.menu = [menuElement.new, menuElement.paste, menuElement.close];
		} else if (this.map.squares[this.focusi][this.focusj].locked) {
			this.menu = [
				menuElement.copy,
				menuElement.delete,
				menuElement.memo,
				menuElement.close,
			];
		} else {
			this.menu = [
				menuElement.enter,
				menuElement.copy,
				menuElement.delete,
				menuElement.memo,
				menuElement.close,
			];
		}

		let h = 0,
			w = MENU_PADDING * 2,
			y = 0,
			x = 0;
		let ey = 0,
			ex = 0;

		let elements: {
			ey: number;
			ex: number;
			eh: number;
			ew: number;
			e: MenuElement;
		}[] = [];

		for (let i = 0; i < this.menu.length; ++i) {
			let e = this.menu[i];
			let image = this.textures.get(menuElementIds[e]).getSourceImage();

			elements.push({
				ey: ey,
				ex: ex,
				eh: image.height,
				ew: image.width,
				e: e,
			});

			if (i != this.menu.length - 1) ey += MENU_ELEMENT_MERGIN;
			ey += image.height;
			w = Math.max(w, MENU_PADDING * 2 + image.width);
		}
		h = ey + MENU_PADDING * 2;

		y = Math.min(
			globalThis.screenh - h - 16,
			this.mapOriginy + 16 * this.focusi
		);
		x = this.mapOriginx + 16 * this.focusj + 16 + 8;
		if (this.playerDirection === "left" || globalThis.screenw < x + w) {
			x = this.mapOriginx + 16 * this.focusj - w - 8;
		}

		if (this.gMenuBackgroundShape && this.gMenuBackground) {
			this.gMenuBackgroundShape.setPosition(x, y).setSize(w, h);
			this.gMenuBackground.fillRectShape(this.gMenuBackgroundShape);
			this.gMenuBackground.visible = true;
		}
		for (let e of elements) {
			let ey = y + MENU_PADDING + e.ey,
				ex = x + MENU_PADDING + e.ex;
			{
				const t = this.gMenuElements[e.e];
				if (t) {
					t.setY(ey + e.eh / 2).setX(ex + e.ew / 2);
					t.visible = true;
				}
			}
		}
	}

	closeMenu() {
		this.menuDisplaying = false;
		if (this.gMenuBackgroundShape && this.gMenuBackground) {
			this.gMenuBackground.clear();
			this.gMenuBackground.visible = false;

			for (let e of menuElementList) {
				const t = this.gMenuElements[e];
				if (t) t.visible = false;
			}
		}
	}

	handleMenu() {
		if (justDown(this.keys.Escape)) {
			this.closeMenu();
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
		// map background
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
		for (let i = 0; i < this.currentMap.h; ++i) {
			for (let j = 0; j < this.currentMap.w; ++j) {
				const y = 16 * i,
					x = 16 * j;
				this.map.squares[i][j].image = this.add.image(
					this.mapOriginx + x + 8,
					this.mapOriginy + y + 8,
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
		const py = this.mapOriginy + this.playeri * 16,
			px = this.mapOriginx + this.playerj * 16;
		this.gImagePlayer = this.add.image(px + 8, py + 8, "player");
		this.gImageFocus = this.add.image(px + 16 + 8, py + 8, "focus");

		// menu

		this.gMenuBackgroundShape = new Phaser.Geom.Rectangle(0, 0, 0, 0);
		this.gMenuBackground = this.add.graphics({
			fillStyle: {
				color: Phaser.Display.Color.GetColor(
					WHITE2[0],
					WHITE2[1],
					WHITE2[2]
				),
			},
		});
		this.gMenuBackground.fillRectShape(this.gMenuBackgroundShape);
		this.gMenuBackground.visible = false;
		this.gMenuBackground.clear();

		this.font = new FontForPhaser(this.textures, "font", 10);
		// font: FontForPhase
		for (let e of menuElementList) {
			this.font.loadImageFrom(
				menuElementMessages[e],
				menuElementIds[e],
				...BLACK
			);
			this.gMenuElements.push(this.add.image(0, 0, menuElementIds[e]));
		}
		for (let e of menuElementList) {
			const t = this.gMenuElements[e];
			if (t) t.visible = false;
		}
	}

	preload() {
		deb("Play.preload");
		this.cameras.main.setBackgroundColor(
			"rgba(" + WHITE[0] + "," + WHITE[1] + "," + WHITE[2] + "," + "1)"
		);

		this.keys.Enter = keysFrom(this, globalThis.keyConfig.Enter);
		this.keys.Ctrl = keysFrom(this, globalThis.keyConfig.Ctrl);
		this.keys.Escape = keysFrom(this, globalThis.keyConfig.Escape);
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
		this.load.image("font", "assets/images/font.png");

		this.load.audio("collide", "assets/sounds/collide.mp3");
	}

	create() {
		deb("Play.create");
		deb(this.map);

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
	}

	update() {
		if (this.menuDisplaying) {
			this.handleMenu();
		} else {
			this.handleMovement();
			if (justDown(this.keys.Enter)) {
				this.openMenu();
			}
		}
	}
}
