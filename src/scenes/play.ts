import { Howl } from "howler";
import Phaser from "phaser";
import { match, P } from "ts-pattern";
import { isDown, justDown, keysFrom } from "../data/keyConfig";
import { deb } from "../utils/deb";
import { FontForPhaser } from "../utils/fontForPhaser";
import {
	GameMap,
	Square,
	squaresFromLam,
	squaresFromStage,
} from "./play/gamemap";
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
	"close  <ESC>",
	"copy     <c>",
	"delete <Del>",
	"enter    <e>",
	"memo    <F2>",
	"new      <n>",
	"paste    <v>",
];

type MenuElement = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const FADEIN_LENGTH = 200;
const MENU_ELEMENT_MERGIN = 2;
const MENU_ELEMENT_H = 9;
const MENU_PADDING = 4;
const ARROW_W = 7;
const ARROW_MERGIN_T = 4;
const ARROW_MERGIN_L = 2;
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
		N: Phaser.Input.Keyboard.Key[];
		E: Phaser.Input.Keyboard.Key[];
		C: Phaser.Input.Keyboard.Key[];
		V: Phaser.Input.Keyboard.Key[];
		F2: Phaser.Input.Keyboard.Key[];
		Del: Phaser.Input.Keyboard.Key[];
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
	menuY: number;
	menuX: number;
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
	gArrow: Phaser.GameObjects.Image | undefined;

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
			N: [],
			E: [],
			C: [],
			V: [],
			F2: [],
			Del: [],
		};
		this.gMenuElements = [];
		this.map = new GameMap(mapRoot);
		this.currentMap = this.map; // ref
		this.playeri = this.currentMap.starti;
		this.playerj = this.currentMap.startj;
		this.focusi = this.currentMap.starti;
		this.focusj = this.currentMap.startj;
		this.playerDirection = "right";
		++this.focusj;
		this.menuDisplaying = false;
		this.menu = [];
		this.menuY = 0;
		this.menuX = 0;
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

	updatePlayerImage() {
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

	moveToPosition(nexti: number, nextj: number) {
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
		this.updatePlayerImage();
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
		this.moveToPosition(nexti, nextj);
	}

	moveToDirection(d: Direction, rotation: number) {
		if (this.playerDirection === d) {
			this.moveToDirectionI(this.playerDirection);
		} else {
			this.playerDirection = d;
			if (this.gImagePlayer !== undefined) {
				this.gImagePlayer.rotation = rotation;
			}
			this.updatePlayerImage();
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
		deb(1.5, this.currentMap);
		if (
			this.focusi < 0 ||
			this.currentMap.h <= this.focusi ||
			this.focusj < 0 ||
			this.currentMap.w <= this.focusj
		) {
			return;
		}
		this.menuDisplaying = true;
		this.selected = 0;
		if (this.currentMap.squares[this.focusi][this.focusj]._type === "air") {
			this.menu = [menuElement.new, menuElement.paste, menuElement.close];
		} else if (this.currentMap.squares[this.focusi][this.focusj].locked) {
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
			w = MENU_PADDING * 2;
		let ey = 0,
			ex = ARROW_W + MENU_ELEMENT_MERGIN;

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
		w += ARROW_W + MENU_ELEMENT_MERGIN;

		this.menuY = Math.min(
			globalThis.screenh - h - 16,
			this.mapOriginy + 16 * this.focusi
		);
		this.menuX = this.mapOriginx + 16 * this.focusj + 16 + 8;
		if (
			this.playerDirection === "left" ||
			globalThis.screenw < this.menuX + w
		) {
			this.menuX = this.mapOriginx + 16 * this.focusj - w - 8;
		}

		if (this.gMenuBackgroundShape && this.gMenuBackground) {
			this.gMenuBackgroundShape
				.setPosition(this.menuX, this.menuY)
				.setSize(w, h);
			this.gMenuBackground.fillRectShape(this.gMenuBackgroundShape);
			this.gMenuBackground.visible = true;
		}
		for (let i = 0; i < elements.length; ++i) {
			let e = elements[i];
			let ey = this.menuY + MENU_PADDING + e.ey,
				ex = this.menuX + MENU_PADDING + e.ex;
			{
				const t = this.gMenuElements[e.e];
				if (t) {
					t.setY(ey + e.eh / 2).setX(ex + e.ew / 2);
					t.visible = true;
				}
			}

			if (this.selected === i) {
				let e = elements[i];
				let ay = this.menuY + MENU_PADDING + e.ey,
					ax = this.menuX + MENU_PADDING;
				this.gArrow?.setY(ay + e.eh / 2).setX(ax + ARROW_W / 2);
			}
		}
		if (this.gArrow) this.gArrow.visible = true;
		deb(1.6, this.currentMap);
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
		if (this.gArrow) this.gArrow.visible = false;
	}

	execCopy() {}
	execPaste() {}
	execEnter() {
		let focus = this.currentMap.squares[this.focusi][this.focusj];
		let afterMap: GameMap;
		if (focus._type === "map") {
			afterMap = focus.map;
		} else if (focus._type === "stage") {
			let st = squaresFromStage(focus.stage);
			deb(st);
			focus.map = new GameMap(squaresFromStage(focus.stage));
			afterMap = focus.map;
		} else if (focus._type === "term" && focus.term._type === "lam") {
			focus.map = new GameMap(squaresFromLam(focus.term));
			afterMap = focus.map;
		} else if (focus._type === "block" && focus.block === "parent") {
			if (this.currentMap.parentMap) {
				afterMap = this.currentMap.parentMap;
			} else {
				return;
			}
		} else {
			return;
		}
		afterMap.setParent(this.currentMap);

		// map
		for (let i = 0; i < this.currentMap.h; ++i) {
			for (let j = 0; j < this.currentMap.w; ++j) {
				this.currentMap.squares[i][j].image?.destroy();
				this.currentMap.squares[i][j].image = undefined;
			}
		}
		this.currentMap = afterMap;

		this.playerDirection = "right";
		if (this.gImagePlayer !== undefined) {
			this.gImagePlayer.rotation = 0;
		}
		this.moveToPosition(this.currentMap.starti, this.currentMap.startj);

		// map
		for (let i = 0; i < this.currentMap.h; ++i) {
			for (let j = 0; j < this.currentMap.w; ++j) {
				const y = 16 * i,
					x = 16 * j;
				this.currentMap.squares[i][j].image = this.add.image(
					this.mapOriginx + x + 8,
					this.mapOriginy + y + 8,
					this.imageHandleFromSquare(
						this.currentMap.squares[i][j],
						i,
						j,
						this.currentMap.h,
						this.currentMap.w
					)
				);
				this.currentMap.squares[i][j].image?.setDepth(-10);
			}
		}
	}
	execDelete() {}
	execMemo() {}
	execNew() {}

	handleMenu() {
		if (justDown(this.keys.S) && this.selected + 1 < this.menu.length) {
			++this.selected;
		}
		if (justDown(this.keys.W) && this.selected - 1 >= 0) {
			--this.selected;
		}
		if (this.gArrow) {
			this.gArrow
				.setY(
					this.menuY +
						MENU_PADDING +
						ARROW_MERGIN_T +
						(MENU_ELEMENT_H + MENU_ELEMENT_MERGIN) * this.selected
				)
				.setX(this.menuX + MENU_PADDING + ARROW_MERGIN_L);
		}
		if (justDown(this.keys.Enter)) {
			deb(1.8, this.currentMap.squares[0][0].image);
			match(this.menu[this.selected])
				.with(menuElement.close, () => {
					this.closeMenu();
				})
				.with(menuElement.copy, () => {
					this.execCopy();
					this.closeMenu();
				})
				.with(menuElement.delete, () => {
					this.execDelete();
					this.closeMenu();
				})
				.with(menuElement.enter, () => {
					deb(2, this.currentMap.squares[0][0].image);
					{
						let t = this.currentMap.squares[0][0];
						deb(t.image);
						deb(t);
					}
					deb(2, this.currentMap.squares[0][0]);
					deb(2, this.currentMap.squares);
					deb(2, this.currentMap);

					this.execEnter();
					this.closeMenu();
				})
				.with(menuElement.memo, () => {
					this.execMemo();
				})
				.with(menuElement.new, () => {
					this.execNew();
					this.closeMenu();
				})
				.with(menuElement.paste, () => {
					this.execPaste();
					this.closeMenu();
				})
				.exhaustive();
		}
	}

	handleMenuShortcut() {
		if (justDown(this.keys.Escape)) {
			this.closeMenu();
		}
	}

	imageHandleFromSquare(
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
			this.add.tileSprite(x, y, w, h, "out").setDepth(-100);
		}

		// map
		for (let i = 0; i < this.currentMap.h; ++i) {
			for (let j = 0; j < this.currentMap.w; ++j) {
				const y = 16 * i,
					x = 16 * j;
				this.currentMap.squares[i][j].image = this.add.image(
					this.mapOriginx + x + 8,
					this.mapOriginy + y + 8,
					this.imageHandleFromSquare(
						this.currentMap.squares[i][j],
						i,
						j,
						this.currentMap.h,
						this.currentMap.w
					)
				);
				this.currentMap.squares[i][j].image?.setDepth(-10);
			}
		}
		deb(0, this.currentMap);

		// player
		const py = this.mapOriginy + this.playeri * 16,
			px = this.mapOriginx + this.playerj * 16;
		this.gImagePlayer = this.add.image(px + 8, py + 8, "player");
		this.gImagePlayer.setDepth(10);
		this.gImageFocus = this.add.image(px + 16 + 8, py + 8, "focus");
		this.gImageFocus.setDepth(10);

		// menu

		this.gMenuBackgroundShape = new Phaser.Geom.Rectangle(0, 0, 0, 0);
		this.gMenuBackground = this.add.graphics({
			lineStyle: {
				color: Phaser.Display.Color.GetColor(
					BLACK[0],
					BLACK[1],
					BLACK[2]
				),
			},
			fillStyle: {
				color: Phaser.Display.Color.GetColor(
					WHITE2[0],
					WHITE2[1],
					WHITE2[2]
				),
			},
		});
		this.gMenuBackground.fillRectShape(this.gMenuBackgroundShape);
		this.gMenuBackground.lineStyle(
			2,
			Phaser.Display.Color.GetColor(BLACK[0], BLACK[1], BLACK[2]),
			255
		);
		this.gMenuBackground.strokeRectShape(this.gMenuBackgroundShape);
		this.gMenuBackground.visible = false;
		this.gMenuBackground.clear();
		this.gArrow = this.add.image(0, 0, "arrow");
		this.gArrow.visible = false;

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
		deb(1, this.currentMap);
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
		this.keys.N = keysFrom(this, globalThis.keyConfig.N);
		this.keys.E = keysFrom(this, globalThis.keyConfig.E);
		this.keys.C = keysFrom(this, globalThis.keyConfig.C);
		this.keys.V = keysFrom(this, globalThis.keyConfig.V);
		this.keys.F2 = keysFrom(this, globalThis.keyConfig.F2);
		this.keys.Del = keysFrom(this, globalThis.keyConfig.Del);

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
		this.handleMenuShortcut();
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
