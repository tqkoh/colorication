import { Howl } from 'howler';
import { cloneDeep } from 'lodash';
import Phaser from 'phaser';
import { match, P } from 'ts-pattern';
import { isDown, justDown, keysFrom } from '../data/keyConfig';
import { log } from '../utils/deb';
import { codesFrom } from '../utils/font';
import FontForPhaser from '../utils/fontForPhaser';
import Term, { completeSubst, freeValue, randomized } from '../utils/term';
import { coloredHandleFrom, deltaHFrom, squareHash } from '../utils/termColor';
import { asString } from '../utils/termUtils';
import {
  airSquare,
  cloneSquare,
  Direction,
  GameMap,
  Square,
  squaresFromStage,
  squaresFromTerm,
  wallSquare
} from './play/gamemap';
import mapRoot from './play/maps/root';

// const completeSubst = subst;

type MainState =
  | 'operating'
  | 'applyAnimating'
  | 'submitAnimating'
  | 'clipboardAnimating';

const menuElement = {
  close: 0,
  copy: 1,
  delete: 2,
  enter: 3,
  memo: 4,
  new: 5,
  paste: 6,
  leave: 7,

  size: 8
} as const;
type MenuElement = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
const menuElementList: MenuElement[] = [
  menuElement.close,
  menuElement.copy,
  menuElement.delete,
  menuElement.enter,
  menuElement.memo,
  menuElement.new,
  menuElement.paste,
  menuElement.leave
];
const menuElementIds: string[] = [
  'menu_close',
  'menu_copy',
  'menu_delete',
  'menu_enter',
  'menu_memo',
  'menu_new',
  'menu_paste',
  'menu_leave'
];
const menuElementMessages: string[] = [
  'close  <ESC>',
  'copy     <c>',
  'delete <Del>',
  'enter    <e>',
  'memo    <F2>',
  'new      <n>',
  'paste    <v>',
  'leave    <e>'
];

function menuFromSquare(s: Square): MenuElement[] {
  return match(s)
    .with({ Atype: 'air' }, () => [
      menuElement.new,
      menuElement.paste,
      menuElement.close
    ])
    .with({ locked: true }, () => [
      menuElement.copy,
      menuElement.delete,
      // menuElement.memo,
      menuElement.close
    ])
    .with({ Atype: 'term', term: { Atype: 'var' } }, () => [
      menuElement.copy,
      menuElement.delete,
      // menuElement.memo,
      menuElement.close
    ])
    .with({ Atype: 'term' }, () => [
      menuElement.enter,
      menuElement.copy,
      menuElement.delete,
      // menuElement.memo,
      menuElement.close
    ])
    .with({ Atype: 'block', block: 'parent' }, () => [
      menuElement.leave,
      // menuElement.memo,
      menuElement.close
    ])
    .with({ Atype: 'block', block: 'return_title' }, () => [
      menuElement.leave,
      // menuElement.memo,
      menuElement.close
    ])
    .with({ Atype: 'block', block: 'wall' }, () => [])
    .with({ Atype: 'block', block: 'submit' }, () => [
      menuElement.enter,
      menuElement.close
    ])
    .with({ Atype: 'block' }, () => [menuElement.paste, menuElement.close])
    .with({ Atype: P._ }, () => [
      menuElement.enter,
      // menuElement.memo,
      menuElement.close
    ])
    .exhaustive();
}

function rotationFromDirection(d: Direction) {
  return match(d)
    .with('right', () => 0)
    .with('down', () => Math.PI / 2)
    .with('left', () => Math.PI)
    .with('up', () => (Math.PI * 3) / 2)
    .exhaustive();
}

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
const SQUARE_NAME_COLOR = [100, 100, 100];
const SQUARE_NAME_ALPHA = 150;
const ANIMATION_APPLY_PER = 20;
const MOVEMENT_CYCLE = 30;
// const LONG_PRESS = 12;

export default class Play extends Phaser.Scene {
  keys: {
    Enter: Phaser.Input.Keyboard.Key[];
    Ctrl: Phaser.Input.Keyboard.Key[];
    Shift: Phaser.Input.Keyboard.Key[];
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

  mainState: MainState;

  map: GameMap;

  currentMap: GameMap;

  currentSquare: Square[];

  clipSquare: Square;

  modifiedTerm: Term[];

  playeri: number;

  playerj: number;

  focusi: number;

  focusj: number;

  focusnexti: number;

  focusnextj: number;

  playerDirection: Direction;

  afterTurn: number; // 向きを変えた後経ったフレーム

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

  substProgress: Term[];

  animationApplyFrame: number;

  gImagePlayer: Phaser.GameObjects.Image | undefined;

  gImageFocus: Phaser.GameObjects.Image | undefined;

  gAnimationApply: Phaser.GameObjects.Image[];

  gMapName: Phaser.GameObjects.Image | undefined;

  gMapBackTile: Phaser.GameObjects.TileSprite | undefined;

  gMapBackAir: Phaser.GameObjects.Image[][];

  gMapBackParent: Phaser.GameObjects.Image | undefined;

  gMapBackgroundShape: Phaser.Geom.Rectangle | undefined;

  gMapBackground: Phaser.GameObjects.Graphics | undefined;

  gMenuElements: Phaser.GameObjects.Image[];

  gMenuBackgroundShape: Phaser.Geom.Rectangle | undefined;

  gMenuBackground: Phaser.GameObjects.Graphics | undefined;

  gArrow: Phaser.GameObjects.Image | undefined;

  sCollide: Howl;

  sPoint: Howl;

  sEnter: Howl;

  constructor() {
    super({ key: 'play' });
    this.keys = {
      Enter: [],
      Ctrl: [],
      Shift: [],
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
      Del: []
    };
    this.mainState = 'operating';
    this.gMenuElements = [];
    this.map = new GameMap(mapRoot);
    this.currentMap = this.map; // ref
    this.currentSquare = [];
    this.clipSquare = airSquare();
    this.modifiedTerm = [];
    this.playeri = this.currentMap.starti;
    this.playerj = this.currentMap.startj;
    this.focusi = this.currentMap.starti;
    this.focusj = this.currentMap.startj;
    this.focusnexti = this.currentMap.starti;
    this.focusnextj = this.currentMap.startj;
    this.playerDirection = 'right';
    this.afterTurn = 0;
    this.focusj += 1;
    this.focusnextj += 2;
    this.menuDisplaying = false;
    this.menu = [];
    this.menuY = 0;
    this.menuX = 0;
    this.selected = 0;
    this.substProgress = [];
    this.gAnimationApply = [];
    this.gMapBackAir = [];
    this.animationApplyFrame = 0;

    const H = globalThis.screenh - 31;
    const W = globalThis.screenw;
    const h = this.currentMap.h * 16;
    const w = this.currentMap.w * 16;
    this.mapOriginy = 31 + H / 2 - h / 2;
    this.mapOriginx = W / 2 - w / 2;

    this.keepingPressingFrame = 0;
    this.lastPressedMovementKey = '';

    this.sCollide = new Howl({
      src: ['assets/sounds/collide.mp3']
    });
    this.sPoint = new Howl({
      src: ['assets/sounds/point.mp3']
    });
    this.sEnter = new Howl({
      src: ['assets/sounds/enter.mp3']
    });
  }

  init() {
    this.keys = {
      Enter: [],
      Ctrl: [],
      Shift: [],
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
      Del: []
    };
    this.mainState = 'operating';
    this.gMenuElements = [];
    // this.map = new GameMap(mapRoot);
    // this.currentMap = this.map; // ref
    this.currentSquare = [];
    this.clipSquare = airSquare();
    this.modifiedTerm = [];
    // this.playeri = this.currentMap.starti;
    // this.playerj = this.currentMap.startj;
    // this.focusi = this.currentMap.starti;
    // this.focusj = this.currentMap.startj;
    // this.focusnexti = this.currentMap.starti;
    // this.focusnextj = this.currentMap.startj;
    // this.playerDirection = 'right';
    // this.afterTurn = 0;
    // this.focusj += 1;
    // this.focusnextj += 2;
    this.menuDisplaying = false;
    this.menu = [];
    this.menuY = 0;
    this.menuX = 0;
    this.selected = 0;
    this.substProgress = [];
    this.gAnimationApply = [];
    this.gMapBackAir = [];
    this.animationApplyFrame = 0;

    // const H = globalThis.screenh - 31;
    // const W = globalThis.screenw;
    // const h = this.currentMap.h * 16;
    // const w = this.currentMap.w * 16;
    // this.mapOriginy = 31 + H / 2 - h / 2;
    // this.mapOriginx = W / 2 - w / 2;

    this.keepingPressingFrame = 0;
    this.lastPressedMovementKey = '';
  }

  updatePlayerAndFocus() {
    this.focusi = this.playeri;
    this.focusj = this.playerj;
    this.focusnexti = this.playeri;
    this.focusnextj = this.playerj;

    if (this.playerDirection === 'right') {
      this.focusj += 1;
      this.focusnextj += 2;
    }
    if (this.playerDirection === 'down') {
      this.focusi += 1;
      this.focusnexti += 2;
    }
    if (this.playerDirection === 'left') {
      this.focusj -= 1;
      this.focusnextj -= 2;
    }
    if (this.playerDirection === 'up') {
      this.focusi -= 1;
      this.focusnexti -= 2;
    }

    const py = this.mapOriginy + this.playeri * 16;
    const px = this.mapOriginx + this.playerj * 16;
    this.gImagePlayer?.setY(py + 8).setX(px + 8);
    const fy = this.mapOriginy + this.focusi * 16;
    const fx = this.mapOriginx + this.focusj * 16;
    this.gImageFocus?.setY(fy + 8).setX(fx + 8);
  }

  removeSquareImage(i: number, j: number) {
    for (let k = 0; k < this.currentMap.squares[i][j].image.length; k += 1) {
      this.currentMap.squares[i][j].image[k].destroy();
    }
    this.currentMap.squares[i][j].image = [];
  }

  addSquareImage(i: number, j: number) {
    const y = 16 * i;
    const x = 16 * j;
    const s = this.currentMap.squares[i][j];
    s.image.push(
      this.add
        .image(
          this.mapOriginx + x + 8,
          this.mapOriginy + y + 8,
          this.imageHandleFromSquare(
            s,
            i,
            j,
            this.currentMap.h,
            this.currentMap.w
          )
        )

        .setDepth(-10)
    );

    const abst = s.name.length < 3 ? s.name : `${s.name[0]}.`;
    const handle = `name_${abst}`;
    if (!this.textures.exists(handle)) {
      this.font?.loadImageFrom(
        codesFrom(abst),
        handle,
        1,
        SQUARE_NAME_COLOR[0],
        SQUARE_NAME_COLOR[1],
        SQUARE_NAME_COLOR[2],
        SQUARE_NAME_ALPHA
      );
    }
    s.image.push(
      this.add
        .image(this.mapOriginx + x + 8, this.mapOriginy + y + 8, handle)
        .setDepth(-9)
    );
    if (s.locked) {
      s.image.push(
        this.add
          .image(this.mapOriginx + x + 1, this.mapOriginy + y, 'locked')
          .setDepth(100)
      );
    }
  }

  updateClipImage() {
    this.clipSquare.image.push(
      this.add
        .image(
          globalThis.screenw - 15,
          15,
          this.imageHandleFromSquare(this.clipSquare, 1, 1, 3, 3)
        )
        .setDepth(0)
    );

    if (this.clipSquare.name !== '') {
      const abst =
        this.clipSquare.name.length < 3
          ? this.clipSquare.name
          : `${this.clipSquare.name[0]}.`;
      const handle = `name_${abst}`;
      if (!this.textures.exists(handle)) {
        this.font?.loadImageFrom(
          codesFrom(abst),
          handle,
          1,
          SQUARE_NAME_COLOR[0],
          SQUARE_NAME_COLOR[1],
          SQUARE_NAME_COLOR[2],
          SQUARE_NAME_ALPHA
        );
      }
      this.clipSquare.image.push(
        this.add.image(globalThis.screenw - 15, 15, handle).setDepth(1)
      );
    }

    if (this.clipSquare.locked) {
      this.clipSquare.image.push(
        this.add
          .image(globalThis.screenw - 15 - 8 + 1, 15 - 8, 'locked')
          .setDepth(100)
      );
    }
  }

  moveToPosition(nexti: number, nextj: number) {
    this.playeri = nexti;
    this.playerj = nextj;
    log(10, this.playeri, this.playerj);
    this.updatePlayerAndFocus();
  }

  checkChangeBackParent(i: number, j: number) {
    if (!this.currentSquare.length) return;
    const current = this.currentSquare.slice(-1)[0];
    if (current.Atype !== 'term') return;
    if (current.term.Atype === 'lam') {
      if (i === 2 && j === 1 && this.gMapBackParent) {
        this.gMapBackParent.setAlpha(0.2);
      }
    } else if (current.term.Atype === 'app') {
      if (i === 2 && j === 2 && this.gMapBackParent) {
        this.gMapBackParent.setAlpha(0.2);
      }
      if (i === 2 && j === 4 && this.gMapBackParent) {
        this.gMapBackParent.setAlpha(0.2);
      }
    }
  }

  moveOn() {
    const front = [wallSquare(), wallSquare()];
    if (
      this.focusi >= 0 &&
      this.focusi < this.currentMap.h &&
      this.focusj >= 0 &&
      this.focusj < this.currentMap.w
    ) {
      front[0] = this.currentMap.squares[this.focusi][this.focusj];
    }
    if (
      this.focusnexti >= 0 &&
      this.focusnexti < this.currentMap.h &&
      this.focusnextj >= 0 &&
      this.focusnextj < this.currentMap.w
    ) {
      front[1] = this.currentMap.squares[this.focusnexti][this.focusnextj];
    }
    log(
      10,
      this.focusi,
      this.focusj,
      this.focusnexti,
      this.focusnextj,
      front[0].collidable
    );
    if (
      front[0].Atype === 'term' &&
      front[0].movable &&
      front[1].Atype === 'term' &&
      front[1].movable
    ) {
      log(10, 'apply');
      for (let k = 0; k < front[0].image.length; k += 1) {
        front[0].image[k].destroy();
      }
      front[0].image = [];

      for (let k = 0; k < front[1].image.length; k += 1) {
        front[1].image[k].destroy();
      }
      front[1].image = [];

      const app: Term = {
        Atype: 'app',
        lam: front[1].term,
        param: front[0].term
      };

      this.substProgress = completeSubst([app]).reverse();
      this.substProgress.push(front[1].term);
      log(8, this.substProgress);
      {
        const y = 16 * this.focusnexti;
        const x = 16 * this.focusnextj;
        this.gAnimationApply = this.substProgress.map((e, i) =>
          this.add
            .image(
              this.mapOriginx + x + 8,
              this.mapOriginy + y + 8,
              this.imageHandleFromSquare(
                {
                  Atype: 'term',
                  term: e,
                  name: '',
                  movable: false,
                  locked: false,
                  collidable: false,
                  image: []
                },
                this.focusnexti,
                this.focusnextj,
                this.currentMap.h,
                this.currentMap.w
              )
            )
            .setDepth(10 + i)
        );
      }

      this.checkChangeBackParent(this.focusi, this.focusj);
      this.checkChangeBackParent(this.focusnexti, this.focusnextj);

      this.currentMap.squares[this.focusnexti][this.focusnextj] = {
        ...front[1],
        map: undefined,
        Atype: 'term',
        term: cloneDeep(this.substProgress[0])
      };
      this.currentMap.squares[this.focusi][this.focusj] = airSquare();

      front[0] = this.currentMap.squares[this.focusi][this.focusj];
      front[1] = this.currentMap.squares[this.focusnexti][this.focusnextj];

      this.addSquareImage(this.focusi, this.focusj);
      this.addSquareImage(this.focusnexti, this.focusnextj);

      this.moveToPosition(this.focusi, this.focusj);

      this.animationApplyFrame = 0;
      this.mainState = 'applyAnimating';
    } else if (front[0].movable && front[1].Atype === 'air') {
      log(10, 'moveblock');
      for (let k = 0; k < front[1].image.length; k += 1) {
        front[1].image[k].destroy();
      }
      front[1].image = [];
      this.currentMap.squares[this.focusi][this.focusj] = airSquare();
      [this.currentMap.squares[this.focusnexti][this.focusnextj]] = front;
      front[0] = this.currentMap.squares[this.focusi][this.focusj];
      front[1] = this.currentMap.squares[this.focusnexti][this.focusnextj];

      this.checkChangeBackParent(this.focusi, this.focusj);
      this.checkChangeBackParent(this.focusnexti, this.focusnextj);

      this.addSquareImage(this.focusi, this.focusj);
      if (front[1].image.length > 0) {
        const y = 16 * this.focusnexti;
        const x = 16 * this.focusnextj;
        front[1].image[0]
          .setY(this.mapOriginy + y + 8)
          .setX(this.mapOriginx + x + 8);
      }
      if (front[1].image.length > 1) {
        const y = 16 * this.focusnexti;
        const x = 16 * this.focusnextj;
        front[1].image[1]
          .setY(this.mapOriginy + y + 8)
          .setX(this.mapOriginx + x + 8);
      }
      if (front[1].image.length > 2) {
        // locked
        const y = 16 * this.focusnexti;
        const x = 16 * this.focusnextj;
        front[1].image[2]
          .setY(this.mapOriginy + y)
          .setX(this.mapOriginx + x + 1);
      }

      this.moveToPosition(this.focusi, this.focusj);
      log(10, this.currentMap);
    } else if (front[0].collidable) {
      log(10, 'collide');
      this.sCollide.play();
    } else {
      log(10, 'move');
      this.moveToPosition(this.focusi, this.focusj);
    }
  }

  moveToDirection(d: Direction, shift: boolean) {
    if (this.playerDirection !== d) {
      this.playerDirection = d;
      this.afterTurn = 0;
      if (this.gImagePlayer) {
        this.gImagePlayer.rotation = rotationFromDirection(d);
      }
      this.updatePlayerAndFocus();
    }
    if (!shift) {
      this.moveOn();
    }
  }

  handleMovement() {
    let jw = justDown(this.keys.W);
    let ja = justDown(this.keys.A);
    let js = justDown(this.keys.S);
    let jd = justDown(this.keys.D);
    const w = isDown(this.keys.W);
    const a = isDown(this.keys.A);
    const s = isDown(this.keys.S);
    const d = isDown(this.keys.D);
    if (jw && js) {
      jw = false;
      js = false;
    }
    if (ja && jd) {
      log(10, this.keys);
      ja = false;
      jd = false;
    }

    if (jw) {
      this.lastPressedMovementKey = 'w';
      this.keepingPressingFrame = 1;
    }
    if (ja) {
      this.lastPressedMovementKey = 'a';
      this.keepingPressingFrame = 1;
    }
    if (js) {
      this.lastPressedMovementKey = 's';
      this.keepingPressingFrame = 1;
    }
    if (jd) {
      this.lastPressedMovementKey = 'd';
      this.keepingPressingFrame = 1;
    }

    if (w || a || s || d) this.keepingPressingFrame += 1;
    else {
      this.keepingPressingFrame = -1;
    }

    if (
      jd ||
      (d &&
        this.lastPressedMovementKey === 'd' &&
        this.keepingPressingFrame % MOVEMENT_CYCLE === 0 &&
        this.keepingPressingFrame > MOVEMENT_CYCLE)
    ) {
      this.moveToDirection('right', isDown(this.keys.Shift));
    }
    if (
      js ||
      (s &&
        this.lastPressedMovementKey === 's' &&
        this.keepingPressingFrame % MOVEMENT_CYCLE === 0 &&
        this.keepingPressingFrame > MOVEMENT_CYCLE)
    ) {
      this.moveToDirection('down', isDown(this.keys.Shift));
    }
    if (
      ja ||
      (a &&
        this.lastPressedMovementKey === 'a' &&
        this.keepingPressingFrame % MOVEMENT_CYCLE === 0 &&
        this.keepingPressingFrame > MOVEMENT_CYCLE)
    ) {
      this.moveToDirection('left', isDown(this.keys.Shift));
    }
    if (
      jw ||
      (w &&
        this.lastPressedMovementKey === 'w' &&
        this.keepingPressingFrame % MOVEMENT_CYCLE === 0 &&
        this.keepingPressingFrame > MOVEMENT_CYCLE)
    ) {
      this.moveToDirection('up', isDown(this.keys.Shift));
    }

    // if (this.afterTurn === LONG_PRESS) {
    //   if (
    //     (w && this.lastPressedMovementKey === 'w') ||
    //     (a && this.lastPressedMovementKey === 'a') ||
    //     (s && this.lastPressedMovementKey === 's') ||
    //     (d && this.lastPressedMovementKey === 'd')
    //   ) {
    //     if (this.gImagePlayer !== undefined) {
    //       let dir: Direction = 'right';
    //       if (this.lastPressedMovementKey === 's') dir = 'down';
    //       if (this.lastPressedMovementKey === 'w') dir = 'up';
    //       if (this.lastPressedMovementKey === 'a') dir = 'left';
    //       this.gImagePlayer.rotation = rotationFromDirection(dir);
    //     }
    //     this.updatePlayerAndFocus();
    //     this.moveOn();
    //   } else {
    //     if (this.gImagePlayer !== undefined) {
    //       let dir: Direction = 'right';
    //       if (this.lastPressedMovementKey === 's') dir = 'down';
    //       if (this.lastPressedMovementKey === 'w') dir = 'up';
    //       if (this.lastPressedMovementKey === 'a') dir = 'left';
    //       this.gImagePlayer.rotation = rotationFromDirection(dir);
    //     }
    //     this.updatePlayerAndFocus();
    //   }
    // }
    this.afterTurn += 1;
  }

  openMenu() {
    log(10, 1.5, this.currentMap);
    if (
      this.focusi < 0 ||
      this.currentMap.h <= this.focusi ||
      this.focusj < 0 ||
      this.currentMap.w <= this.focusj
    ) {
      return;
    }
    this.selected = 0;
    this.menu = menuFromSquare(
      this.currentMap.squares[this.focusi][this.focusj]
    );
    if (!this.menu.length) return;
    this.menuDisplaying = true;

    let h = 0;
    let w = MENU_PADDING * 2;
    let ey = 0;
    const ex = ARROW_W + MENU_ELEMENT_MERGIN;

    const elements: {
      ey: number;
      ex: number;
      eh: number;
      ew: number;
      e: MenuElement;
    }[] = [];

    for (let i = 0; i < this.menu.length; i += 1) {
      const e = this.menu[i];
      const image = this.textures.get(menuElementIds[e]).getSourceImage();

      elements.push({
        ey,
        ex,
        eh: image.height,
        ew: image.width,
        e
      });

      if (i !== this.menu.length - 1) ey += MENU_ELEMENT_MERGIN;
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
      this.playerDirection === 'left' ||
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
    for (let i = 0; i < elements.length; i += 1) {
      const e = elements[i];
      const absey = this.menuY + MENU_PADDING + e.ey;
      const absex = this.menuX + MENU_PADDING + e.ex;
      {
        const t = this.gMenuElements[e.e];
        if (t) {
          t.setY(absey + e.eh / 2).setX(absex + e.ew / 2);
          t.visible = true;
        }
      }

      if (this.selected === i) {
        const el = elements[i];
        const ay = this.menuY + MENU_PADDING + el.ey;
        const ax = this.menuX + MENU_PADDING;
        this.gArrow?.setY(ay + el.eh / 2).setX(ax + ARROW_W / 2);
      }
    }
    if (this.gArrow) this.gArrow.visible = true;
    log(10, 1.6, this.currentMap);
  }

  closeMenu() {
    this.menuDisplaying = false;
    if (this.gMenuBackgroundShape && this.gMenuBackground) {
      this.gMenuBackground.clear();
      this.gMenuBackground.visible = false;

      // eslint-disable-next-line no-restricted-syntax
      for (const e of menuElementList) {
        const t = this.gMenuElements[e];
        if (t) t.visible = false;
      }
    }
    if (this.gArrow) this.gArrow.visible = false;
  }

  // eslint-disable-next-line class-methods-use-this
  execCopy() {
    if (
      this.focusi < 0 ||
      this.currentMap.h <= this.focusi ||
      this.focusj < 0 ||
      this.currentMap.w <= this.focusj
    ) {
      return;
    }
    const focus = this.currentMap.squares[this.focusi][this.focusj];

    for (let k = 0; k < this.clipSquare.image.length; k += 1) {
      this.clipSquare.image[k].destroy();
    }
    this.clipSquare = cloneSquare(focus);
    this.updateClipImage();
    log(10, this.clipSquare);
  }

  // eslint-disable-next-line class-methods-use-this
  execPaste() {
    if (
      this.focusi < 0 ||
      this.currentMap.h <= this.focusi ||
      this.focusj < 0 ||
      this.currentMap.w <= this.focusj
    ) {
      return;
    }
    const focus = this.currentMap.squares[this.focusi][this.focusj];
    if (focus.Atype !== 'air') {
      return;
    }
    this.removeSquareImage(this.focusi, this.focusj);
    this.currentMap.squares[this.focusi][this.focusj] = cloneSquare(
      this.clipSquare
    );
    this.addSquareImage(this.focusi, this.focusj);
  }

  leaveCheck() {
    log(9, this.currentSquare);
    return match(this.currentSquare.slice(-1)[0])
      .with({ Atype: 'term', term: { Atype: 'lam' } }, () => {
        if (this.currentMap.squares[2][1].Atype !== 'term') {
          if (
            this.currentMap.squares[2][5].Atype === 'term' &&
            this.currentMap.squares[2][5].term.Atype === 'var'
          ) {
            this.removeSquareImage(2, 1);
            this.currentMap.squares[2][1] = {
              Atype: 'term',
              term: {
                Atype: 'var',
                var: this.currentMap.squares[2][5].term.var
              },
              name: '',
              movable: true,
              collidable: true,
              locked: false,
              image: []
            };
            this.addSquareImage(2, 1);
          }
          return false;
        }
        if (this.currentMap.squares[2][5].Atype === 'term') {
          // clipboard check
          if (this.clipSquare.Atype === 'term') {
            log(9, freeValue(this.clipSquare.term));
          }
          if (
            this.clipSquare.Atype === 'term' &&
            this.currentMap.squares[2][5].term.Atype === 'var' &&
            freeValue(this.clipSquare.term).includes(
              this.currentMap.squares[2][5].term.var
            )
          ) {
            log(
              9,
              `detect life end: ${this.currentMap.squares[2][5].term.var}`
            );

            for (let k = 0; k < this.clipSquare.image.length; k += 1) {
              this.clipSquare.image[k].destroy();
            }

            this.clipSquare = airSquare();
            this.updateClipImage();
          }
        }
        this.modifiedTerm = [this.currentMap.squares[2][1].term];

        return true;
      })
      .with({ Atype: 'term', term: { Atype: 'app' } }, () => {
        let ok = true;
        if (this.currentMap.squares[2][2].Atype !== 'term') {
          this.removeSquareImage(2, 2);
          this.currentMap.squares[2][2] = {
            Atype: 'term',
            term: randomized({
              Atype: 'lam',
              var: '0',
              ret: { Atype: 'var', var: '0' }
            }),
            name: '',
            movable: true,
            collidable: true,
            locked: false,
            image: []
          };
          this.addSquareImage(2, 2);
          ok = false;
        }
        if (this.currentMap.squares[2][4].Atype !== 'term') {
          this.removeSquareImage(2, 4);
          this.currentMap.squares[2][4] = {
            Atype: 'term',
            term: randomized({
              Atype: 'lam',
              var: '0',
              ret: { Atype: 'var', var: '0' }
            }),
            name: '',
            movable: true,
            collidable: true,
            locked: false,
            image: []
          };
          this.addSquareImage(2, 4);
          ok = false;
        }
        if (!ok) return false;

        this.modifiedTerm = [
          this.currentMap.squares[2][2].term,
          this.currentMap.squares[2][4].term
        ];

        return true;
      })
      .with(P._, () => {
        this.modifiedTerm = [];
        return true;
      })
      .exhaustive();
  }

  reflectModified() {
    match(this.currentMap.squares[this.focusi][this.focusj])
      .with({ Atype: 'term', term: { Atype: 'lam' } }, (focus) => {
        if (this.modifiedTerm.length < 1) throw new Error('s');
        this.currentMap.squares[this.focusi][this.focusj] = {
          ...focus,
          term: {
            ...focus.term,
            ret: this.modifiedTerm[0]
          }
        };
      })
      .with({ Atype: 'term', term: { Atype: 'app' } }, (focus) => {
        if (this.modifiedTerm.length < 2) throw new Error('s');

        const app: Term = {
          ...focus.term,
          lam: this.modifiedTerm[0],
          param: this.modifiedTerm[1]
        };

        this.currentMap.squares[this.focusi][this.focusj] = {
          ...focus,
          term: app
        };

        this.substProgress = completeSubst([app]).reverse();
        log(8, this.substProgress);
        if (this.substProgress.length === 1) return;

        {
          const y = 16 * this.focusi;
          const x = 16 * this.focusj;
          this.gAnimationApply = this.substProgress.map((e, i) =>
            this.add
              .image(
                this.mapOriginx + x + 8,
                this.mapOriginy + y + 8,
                this.imageHandleFromSquare(
                  {
                    Atype: 'term',
                    term: e,
                    name: '',
                    movable: false,
                    locked: false,
                    collidable: false,
                    image: []
                  },
                  this.focusi,
                  this.focusj,
                  this.currentMap.h,
                  this.currentMap.w
                )
              )
              .setDepth(10 + i)
          );
        }

        this.currentMap.squares[this.focusi][this.focusj] = {
          ...this.currentMap.squares[this.focusi][this.focusj],
          map: undefined,
          Atype: 'term',
          term: cloneDeep(this.substProgress[0])
        };

        this.animationApplyFrame = 0;
        this.mainState = 'applyAnimating';
      })
      .with(P._, () => {})
      .exhaustive();
  }

  execEnter() {
    let afterLeave = false;
    if (
      this.focusi < 0 ||
      this.currentMap.h <= this.focusi ||
      this.focusj < 0 ||
      this.currentMap.w <= this.focusj
    ) {
      return;
    }
    const focus = this.currentMap.squares[this.focusi][this.focusj];
    let afterMap: GameMap;
    if (focus.Atype === 'block' && focus.block === 'return_title') {
      this.scene.start('title');
      return;
    }
    if (focus.Atype === 'map') {
      afterMap = focus.map;
    } else if (focus.Atype === 'stage') {
      const st = squaresFromStage(focus.stage);
      log(10, st);
      if (!focus.map) {
        focus.map = new GameMap(squaresFromStage(focus.stage));
      }
      afterMap = focus.map;
    } else if (
      focus.Atype === 'term' &&
      (focus.term.Atype === 'lam' || focus.term.Atype === 'app')
    ) {
      if (!focus.map) {
        focus.map = new GameMap(squaresFromTerm(focus.term));
      }
      afterMap = focus.map;
    } else if (focus.Atype === 'block' && focus.block === 'parent') {
      afterLeave = true;
      if (this.currentMap.parentMap) {
        afterMap = this.currentMap.parentMap;
      } else {
        return;
      }
      if (!this.leaveCheck()) return;
    } else {
      return;
    }
    if (focus.Atype !== 'block' || focus.block !== 'parent') {
      afterMap.setParent(this.currentMap);
    }

    // destroy previous map
    this.gMapName?.destroy();

    for (let i = 0; i < this.currentMap.h; i += 1) {
      for (let j = 0; j < this.currentMap.w; j += 1) {
        for (
          let k = 0;
          k < this.currentMap.squares[i][j].image.length;
          k += 1
        ) {
          this.currentMap.squares[i][j].image[k].destroy();
        }
        this.currentMap.squares[i][j].image = [];
        this.gMapBackAir[i][j]?.destroy();
      }
    }
    this.gMapBackParent?.destroy();

    this.currentMap.starti = this.playeri;
    this.currentMap.startj = this.playerj;
    this.currentMap.startd = this.playerDirection;

    if (focus.Atype === 'block' && focus.block === 'parent') {
      this.currentSquare.pop();
    } else {
      this.currentSquare.push(focus);
    }
    this.currentMap = afterMap;
    {
      const H = globalThis.screenh - 31;
      const W = globalThis.screenw;
      const h = this.currentMap.h * 16;
      const w = this.currentMap.w * 16;
      this.mapOriginy = 31 + H / 2 - h / 2;
      this.mapOriginx = W / 2 - w / 2;
    }

    this.playerDirection = this.currentMap.startd;
    if (this.gImagePlayer) {
      this.gImagePlayer.rotation = rotationFromDirection(this.playerDirection);
    }
    this.moveToPosition(this.currentMap.starti, this.currentMap.startj);
    this.reflectModified();

    // background
    {
      let y = 31;
      let x = -14;
      if (this.currentMap.h % 2) {
        y -= 8;
      }
      const h = 240;
      // const w = 368;
      y += h / 2;
      x = globalThis.screenw / 2;
      if (this.gMapBackTile) {
        this.gMapBackTile.setY(y).setX(x);
      }
    }
    if (this.gMapBackground && this.gMapBackgroundShape) {
      this.gMapBackground.clear();
      this.gMapBackgroundShape
        .setPosition(this.mapOriginx, this.mapOriginy)
        .setSize(16 * this.currentMap.w, 16 * this.currentMap.h);
      // this.gMapBackground.strokeRectShape(this.gMapBackgroundShape);
      this.gMapBackground.fillRectShape(this.gMapBackgroundShape);
    }
    if (this.currentSquare.length) {
      const current = this.currentSquare.slice(-1)[0];
      if (current.Atype === 'term') {
        const y = 31 + (globalThis.screenh - 31) / 2;
        const x = globalThis.screenw / 2;

        this.gMapBackParent = this.add
          .image(
            x,
            y,
            this.imageHandleFromSquare(
              this.currentSquare.slice(-1)[0],
              1,
              1,
              3,
              3
            )
          )
          .setScale(7)
          .setAlpha(afterLeave ? 0.2 : 0.5)
          .setDepth(-20);
      }
    }

    // add next map

    if (this.currentSquare.length) {
      const handle = `mapname_${this.currentSquare.slice(-1)[0].name}`;
      if (!this.textures.exists(handle)) {
        this.font?.loadImageFrom(
          codesFrom(this.currentSquare.slice(-1)[0].name),
          handle,
          1
        );
      }
      const t = this.textures.get(handle).getSourceImage();
      const w = t.width;
      this.gMapName = this.add.image(3 + w / 2, 15, handle);
    }
    this.gMapBackAir = [];
    for (let i = 0; i < this.currentMap.h; i += 1) {
      this.gMapBackAir.push([]);
      for (let j = 0; j < this.currentMap.w; j += 1) {
        const y = 16 * i;
        const x = 16 * j;
        this.addSquareImage(i, j);
        this.gMapBackAir[i].push(
          this.add.image(
            this.mapOriginx + x + 8,
            this.mapOriginy + y + 8,
            this.imageHandleFromSquare(
              airSquare(),
              i,
              j,
              this.currentMap.h,
              this.currentMap.w
            )
          )
        );
        this.gMapBackAir[i][j]?.setDepth(-11);
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  execDelete() {
    if (
      this.focusi < 0 ||
      this.currentMap.h <= this.focusi ||
      this.focusj < 0 ||
      this.currentMap.w <= this.focusj
    ) {
      return;
    }
    this.removeSquareImage(this.focusi, this.focusj);
    this.currentMap.squares[this.focusi][this.focusj] = airSquare();
    this.addSquareImage(this.focusi, this.focusj);
  }

  // eslint-disable-next-line class-methods-use-this
  execMemo() {}

  // eslint-disable-next-line class-methods-use-this
  execNew() {
    if (
      this.focusi < 0 ||
      this.currentMap.h <= this.focusi ||
      this.focusj < 0 ||
      this.currentMap.w <= this.focusj
    ) {
      return;
    }
    const focus = this.currentMap.squares[this.focusi][this.focusj];
    if (focus.Atype !== 'air') {
      return;
    }
    for (let k = 0; k < focus.image.length; k += 1) {
      focus.image[k].destroy();
    }
    focus.image = [];
    const newSquare: Square = {
      Atype: 'term',
      term: randomized({
        Atype: 'lam',
        var: '0',
        ret: { Atype: 'var', var: '0' }
      }),
      name: '',
      movable: true,
      collidable: true,
      locked: false,
      image: []
    };
    this.currentMap.squares[this.focusi][this.focusj] = newSquare;
    this.addSquareImage(this.focusi, this.focusj);
  }

  handleMenu() {
    if (justDown(this.keys.S) && this.selected + 1 < this.menu.length) {
      this.selected += 1;
    }
    if (justDown(this.keys.W) && this.selected - 1 >= 0) {
      this.selected -= 1;
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
      log(10, 1.8, this.currentMap.squares[0][0].image);
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
          this.execEnter();
          this.closeMenu();
        })
        .with(menuElement.leave, () => {
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
    if (justDown(this.keys.C)) {
      this.execCopy();
      this.closeMenu();
    }
    if (justDown(this.keys.Del)) {
      this.execDelete();
      this.closeMenu();
    }
    if (justDown(this.keys.E)) {
      this.execNew();
      this.closeMenu();
    }
    if (justDown(this.keys.V)) {
      this.execPaste();
      this.closeMenu();
    }
  }

  createColoredTermImage(t: Term, hash: string, handle: string) {
    const deltaH = deltaHFrom(hash);
    const originalTexture = this.textures.get(t.Atype);
    const originalTextureImage = originalTexture.getSourceImage();
    const h = originalTextureImage.height;
    const w = originalTextureImage.width;
    const newTexture = this.textures.createCanvas(handle, w, h);
    const context = newTexture.getContext();

    log(10, deltaH, originalTexture, h, w);

    const pixels: ImageData = context.getImageData(0, 0, w, h);
    // const n = pixels.data.length / 4;
    for (let i = 0; i < h; i += 1) {
      for (let j = 0; j < w; j += 1) {
        const rgb = this.textures.getPixel(j, i, t.Atype);
        const r = rgb.red;
        const g = rgb.green;
        const b = rgb.blue;
        const hsv = Phaser.Display.Color.RGBToHSV(r, g, b);
        const afterRgb = Phaser.Display.Color.HSVToRGB(
          hsv.h + deltaH,
          hsv.s,
          hsv.v
        );
        if ('r' in afterRgb) {
          pixels.data[(i * w + j) * 4 + 0] = afterRgb.r;
        }
        if ('g' in afterRgb) {
          pixels.data[(i * w + j) * 4 + 1] = afterRgb.g;
        }
        if ('b' in afterRgb) {
          pixels.data[(i * w + j) * 4 + 2] = afterRgb.b;
        }
        pixels.data[(i * w + j) * 4 + 3] = this.textures.getPixelAlpha(
          j,
          i,
          t.Atype
        );
      }
    }
    context.putImageData(pixels, 0, 0);
    newTexture.refresh();
    log(10, this.textures.exists(handle));
  }

  imageHandleFromSquare(
    s: Square,
    i: number,
    j: number,
    h: number,
    w: number
  ): string {
    return match(s)
      .with({ Atype: 'air' }, () => {
        let ret = 'air';
        if (j === 0) {
          ret += 'l';
        }
        if (j === w - 1) {
          ret += 'r';
        }
        if (i === 0) {
          ret += 't';
        }
        if (i === h - 1) {
          ret += 'b';
        }
        return ret;
      })
      .with({ Atype: 'map' }, () => 'block')
      .with({ Atype: 'stage' }, () => 'block')
      .with({ Atype: 'block', block: 'apply' }, () => 'apply')
      .with({ Atype: 'block', block: 'down' }, () => 'down')
      .with({ Atype: 'block', block: 'equal' }, () => 'equal')
      .with({ Atype: 'block', block: 'place' }, () => 'place')
      .with({ Atype: 'block', block: 'submit' }, () => 'submit')
      .with({ Atype: 'block', block: 'wall' }, () => {
        if (j === 0) return 'walll';
        if (j === w - 1) return 'wallr';
        return 'wall';
      }) // reset, parent
      .with({ Atype: 'block', block: 'lam_var' }, () => 'lam_var')
      .with({ Atype: 'block', block: 'lam_ret' }, () => 'lam_ret')
      .with({ Atype: 'block', block: 'parent' }, () => 'parent')
      .with({ Atype: 'block', block: 'return_title' }, () => 'parent')
      .with({ Atype: 'block' }, () => 'block')
      .with({ Atype: 'term' }, () => {
        if (s.Atype !== 'term') {
          return '';
        }
        // eslint-disable-next-line no-param-reassign
        s.name = asString(s.term);
        const hash: string = squareHash(s);
        const handle = coloredHandleFrom(s.term, hash);
        log(10, handle);
        if (!this.textures.exists(handle)) {
          this.createColoredTermImage(s.term, hash, handle);
        }
        return handle;
      })
      .with({ Atype: P._ }, () => 'air')
      .exhaustive();
  }

  initDrawing() {
    this.font = new FontForPhaser(this.textures, 'font', 10);

    // background
    {
      let y = 31;
      let x = -14;
      const h = 240;
      const w = 368;
      y += h / 2;
      x = globalThis.screenw / 2;
      this.gMapBackTile = this.add.tileSprite(x, y, w, h, 'out').setDepth(-100);
    }
    {
      const y = 0;
      const x = 0;
      const h = 31;
      const w = globalThis.screenw;

      this.add.rectangle(
        x + w / 2,
        y + h / 2,
        w,
        h,
        Phaser.Display.Color.GetColor(WHITE[0], WHITE[1], WHITE[2])
      );
    }

    // map
    this.gMapBackgroundShape = new Phaser.Geom.Rectangle(0, 0, 0, 0);
    this.gMapBackground = this.add.graphics({
      lineStyle: {
        color: Phaser.Display.Color.GetColor(BLACK[0], BLACK[1], BLACK[2])
      },
      fillStyle: {
        color: Phaser.Display.Color.GetColor(WHITE[0], WHITE[1], WHITE[2])
      }
    });
    this.gMapBackground.fillRectShape(this.gMapBackgroundShape);
    this.gMapBackground.lineStyle(
      2,
      Phaser.Display.Color.GetColor(BLACK[0], BLACK[1], BLACK[2]),
      255
    );
    this.gMapBackground.clear();
    this.gMapBackgroundShape
      .setPosition(this.mapOriginx, this.mapOriginy)
      .setSize(16 * this.currentMap.w, 16 * this.currentMap.h);
    // this.gMapBackground.strokeRectShape(this.gMapBackgroundShape);
    this.gMapBackground.fillRectShape(this.gMapBackgroundShape);
    this.gMapBackground.setDepth(-90);

    for (let i = 0; i < this.currentMap.h; i += 1) {
      this.gMapBackAir.push([]);
      for (let j = 0; j < this.currentMap.w; j += 1) {
        const y = 16 * i;
        const x = 16 * j;
        const s = this.currentMap.squares[i][j];
        s.image.push(
          this.add
            .image(
              this.mapOriginx + x + 8,
              this.mapOriginy + y + 8,
              this.imageHandleFromSquare(
                s,
                i,
                j,
                this.currentMap.h,
                this.currentMap.w
              )
            )
            .setDepth(-10)
        );

        {
          const abst = s.name.length < 3 ? s.name : `${s.name[0]}.`;
          const handle = `name_${abst}`;
          if (!this.textures.exists(handle)) {
            this.font?.loadImageFrom(
              codesFrom(abst),
              handle,
              1,
              SQUARE_NAME_COLOR[0],
              SQUARE_NAME_COLOR[1],
              SQUARE_NAME_COLOR[2],
              SQUARE_NAME_ALPHA
            );
          }
          log(10, this.textures.exists(handle));
          s.image.push(
            this.add
              .image(this.mapOriginx + x + 8, this.mapOriginy + y + 8, handle)
              .setDepth(-9)
          );
        }

        this.gMapBackAir[i].push(
          this.add.image(
            this.mapOriginx + x + 8,
            this.mapOriginy + y + 8,
            this.imageHandleFromSquare(
              airSquare(),
              i,
              j,
              this.currentMap.h,
              this.currentMap.w
            )
          )
        );
        this.gMapBackAir[i][j]?.setDepth(-11);
      }
    }
    log(10, 0, this.currentMap);

    this.updateClipImage();

    // player
    const py = this.mapOriginy + this.playeri * 16;
    const px = this.mapOriginx + this.playerj * 16;
    this.gImagePlayer = this.add.image(px + 8, py + 8, 'player');
    this.gImagePlayer.setDepth(90);
    this.gImageFocus = this.add.image(px + 16 + 8, py + 8, 'focus');
    this.gImageFocus.setDepth(90);

    // menu

    this.gMenuBackgroundShape = new Phaser.Geom.Rectangle(0, 0, 0, 0);
    this.gMenuBackground = this.add.graphics({
      lineStyle: {
        color: Phaser.Display.Color.GetColor(BLACK[0], BLACK[1], BLACK[2])
      },
      fillStyle: {
        color: Phaser.Display.Color.GetColor(WHITE2[0], WHITE2[1], WHITE2[2])
      }
    });
    this.gMenuBackground.fillRectShape(this.gMenuBackgroundShape);
    this.gMenuBackground.lineStyle(
      2,
      Phaser.Display.Color.GetColor(BLACK[0], BLACK[1], BLACK[2]),
      255
    );
    this.gMenuBackground
      .strokeRectShape(this.gMenuBackgroundShape)
      .setDepth(105);
    this.gMenuBackground.visible = false;
    this.gMenuBackground.clear();
    this.gArrow = this.add.image(0, 0, 'arrow').setDepth(106);
    this.gArrow.visible = false;

    // eslint-disable-next-line no-restricted-syntax
    for (const e of menuElementList) {
      this.font.loadImageFrom(
        codesFrom(menuElementMessages[e]),
        menuElementIds[e],
        1,
        ...BLACK
      );
      this.gMenuElements.push(
        this.add.image(0, 0, menuElementIds[e]).setDepth(106)
      );
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const e of menuElementList) {
      const t = this.gMenuElements[e];
      if (t) t.visible = false;
    }
    log(10, 1, this.currentMap);
  }

  preload() {
    log(10, 'Play.preload');
    this.init();
    this.cameras.main.setBackgroundColor(
      `rgba(${WHITE[0]},${WHITE[1]},${WHITE[2]},1)`
    );

    this.keys.Enter = keysFrom(this, globalThis.keyConfig.Enter);
    this.keys.Ctrl = keysFrom(this, globalThis.keyConfig.Ctrl);
    this.keys.Shift = keysFrom(this, globalThis.keyConfig.Shift);
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

    this.load.image('lam', 'assets/images/lam.png'); // todo: matomeru
    this.load.image('app', 'assets/images/app.png');
    this.load.image('var', 'assets/images/var.png');
    this.load.image('equal', 'assets/images/equal.png');
    this.load.image('place', 'assets/images/place.png');
    this.load.image('wall', 'assets/images/wall.png');
    this.load.image('walll', 'assets/images/walll.png');
    this.load.image('wallr', 'assets/images/wallr.png');
    this.load.image('not_equal', 'assets/images/not_equal.png');
    this.load.image('equal_green', 'assets/images/equal_green.png');
    this.load.image('not_equal_red', 'assets/images/not_equal_red.png');
    this.load.image('down', 'assets/images/down.png');
    this.load.image('apply', 'assets/images/apply.png');
    this.load.image('submit', 'assets/images/submit.png');
    this.load.image('block', 'assets/images/block.png');

    this.load.image('air', 'assets/images/air.png');
    this.load.image('airr', 'assets/images/airr.png');
    this.load.image('airb', 'assets/images/airb.png');
    this.load.image('airl', 'assets/images/airl.png');
    this.load.image('airt', 'assets/images/airt.png');
    this.load.image('airrb', 'assets/images/airrb.png');
    this.load.image('airlb', 'assets/images/airlb.png');
    this.load.image('airlt', 'assets/images/airlt.png');
    this.load.image('airrt', 'assets/images/airrt.png');
    this.load.image('player', 'assets/images/player.png');
    this.load.image('focus', 'assets/images/focus.png');
    this.load.image('out', 'assets/images/out.png');
    this.load.image('lam_var', 'assets/images/lam_var.png');
    this.load.image('lam_ret', 'assets/images/lam_ret.png');
    this.load.image('parent', 'assets/images/parent.png');
    this.load.image('locked', 'assets/images/locked.png');
    this.load.image('font', 'assets/images/font.png');

    this.load.audio('collide', 'assets/sounds/collide.mp3');
  }

  create() {
    log(10, 'Play.create');
    log(10, this.map);

    this.initDrawing();

    this.cameras.main.fadeIn(FADEIN_LENGTH / 2, WHITE[0], WHITE[1], WHITE[2]);
    this.cameras.main.setBackgroundColor(
      `rgba(${WHITE[0]},${WHITE[1]},${WHITE[2]},1)`
    );
  }

  updateAnimationApply() {
    if (!this.gAnimationApply.length) {
      this.mainState = 'operating';
      return;
    }
    this.animationApplyFrame += 1;

    this.gAnimationApply
      .slice(-1)[0]
      .setAlpha(
        (ANIMATION_APPLY_PER -
          (this.animationApplyFrame % ANIMATION_APPLY_PER)) /
          ANIMATION_APPLY_PER
      );
    if (this.animationApplyFrame % ANIMATION_APPLY_PER === 0) {
      this.gAnimationApply.slice(-1)[0].destroy();
      this.gAnimationApply.pop();
    }
  }

  update() {
    switch (this.mainState) {
      case 'operating': {
        this.handleMenuShortcut();
        if (this.menuDisplaying) {
          this.handleMenu();
        } else {
          this.handleMovement();
          if (justDown(this.keys.Enter)) {
            this.openMenu();
          }
        }
        break;
      }
      case 'applyAnimating': {
        this.updateAnimationApply();
        break;
      }
      default: {
        break;
      }
    }
  }
}
