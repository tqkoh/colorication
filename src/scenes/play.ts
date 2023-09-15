import { Howl } from 'howler';
import { cloneDeep } from 'lodash';
import objectHash from 'object-hash';
import Phaser from 'phaser';
import { match, P } from 'ts-pattern';
import { isDown, justDown, keysFrom } from '../data/keyConfig';
import { mapRoot, sandboxRoot } from '../data/maps/mapBeginning';
import { log } from '../utils/deb';
import { codesFrom } from '../utils/font';
import FontForPhaser from '../utils/fontForPhaser';
import Term, { completeSubst, freeValue, randomized } from '../utils/term';
import {
  asCodes,
  coloredHandleFrom,
  deltaHFrom,
  equal,
  isTermSquare,
  squareHash
} from '../utils/termUtils';
import {
  airSquare,
  Block,
  cloneSquare,
  Direction,
  GameMap,
  opposite,
  Square,
  squaresFromTerm,
  submitSquare,
  wallSquare
} from './play/gamemap';
import { skills } from './play/skills';
import { Stage } from './play/stage';
// const completeSubst = subst;

type MainState =
  | 'operating'
  | 'applyAnimating'
  | 'submitAnimating'
  | 'clearAnimating'
  | 'clipboardAnimating';

type SubmitAnimationPhase = 'input' | 'apply' | 'wa' | 'ac';

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
  'enter    <\n>',
  'memo    <F2>',
  'new      <e>',
  'paste    <v>',
  'leave       '
];

function menuFromSquare(s: Square): MenuElement[] {
  return match(s)
    .with({ Atype: 'air' }, () => [
      menuElement.new,
      menuElement.paste,
      menuElement.close
    ])
    .with({ movable: false, locked: true }, () => [
      menuElement.copy,
      // menuElement.memo,
      menuElement.close
    ])
    .with({ locked: true }, () => [
      menuElement.copy,
      menuElement.delete,
      // menuElement.memo,
      menuElement.close
    ])
    .with({ Atype: 'term', term: { Atype: 'var' } }, (sq) => {
      const ret: MenuElement[] = [menuElement.copy];
      if (sq.movable) ret.push(menuElement.delete);
      ret.push(menuElement.close);
      return ret;
    })
    .with({ Atype: 'term' }, (sq) => {
      const ret: MenuElement[] = [menuElement.enter, menuElement.copy];
      if (sq.movable) ret.push(menuElement.delete);
      ret.push(menuElement.close);
      return ret;
    })
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
const ANIMATION_INPUT_LENGTH = 30;
const ANIMATION_WA_LENGTH = 60;
const ANIMATION_AC_LENGTH = 60;
const ANIMATION_AC_INTERVAL = 10;
const ANIMATION_CLEAR_LENGTH = 90;
const MOVEMENT_CYCLE = 24;
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
    Q: Phaser.Input.Keyboard.Key[];
    Z: Phaser.Input.Keyboard.Key[];
    R: Phaser.Input.Keyboard.Key[];
    F2: Phaser.Input.Keyboard.Key[];
    Del: Phaser.Input.Keyboard.Key[];
  };

  mainState: MainState;

  saveState: MainState;

  mode: 'puzzle' | 'sandbox';

  map: GameMap;

  currentMap: GameMap;

  currentSquares: Square[];

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

  entering: boolean; // map に入ろうとするとき一回目はぶつかる

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

  sPuzzle: Howl;

  sOk: Howl;

  sNg: Howl;

  sClear: Howl;

  allowedCommands: boolean;

  constructor() {
    super({ key: 'play' });
    this.mode = 'sandbox';
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
      Q: [],
      Z: [],
      R: [],
      F2: [],
      Del: []
    };
    this.mainState = 'operating';
    this.saveState = 'operating';
    this.gMenuElements = [];
    this.allowedCommands = false;
    this.map = new GameMap(sandboxRoot);
    this.currentMap = this.map; // ref
    this.front = [];
    this.currentSquares = [
      {
        Atype: 'air',
        airtype: 'normal',
        name: codesFrom(
          `${
            this.allowedCommands
              ? 'WASD to move, use shift to just turn'
              : 'Beginning                 WASD to move!'
          }`
        ),
        collidable: false,
        movable: false,
        locked: false,
        image: []
      }
    ];
    this.clipSquare = airSquare();
    this.modifiedTerm = [];
    this.entering = false;
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
    this.submitTestCount = [0, 0];
    this.submitPhase = 'input';
    this.animationApplyFrame = 0;
    this.animationSubmitFrame = 0;
    this.animationClearFrame = 0;

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
    this.sPuzzle = new Howl({
      src: ['assets/sounds/puzzle.mp3'],
      loop: true,
      volume: 0 // dtm kondo
    });
    this.sOk = new Howl({
      src: ['assets/sounds/ok.mp3']
    });
    this.sNg = new Howl({
      src: ['assets/sounds/ng.mp3']
    });
    this.sClear = new Howl({
      src: ['assets/sounds/clear.mp3']
    });
  }

  init(data: { mode: 'puzzle' | 'sandbox' }) {
    this.sPuzzle.play();

    this.mode = data.mode;
    skills.init(data.mode);
    log(1, 'nu', data);
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
      Q: [],
      Z: [],
      R: [],
      F2: [],
      Del: []
    };
    this.mainState = 'operating';
    this.saveState = 'operating';
    this.gMenuElements = [];
    this.allowedCommands = data.mode === 'sandbox';
    this.map = new GameMap(data.mode === 'sandbox' ? sandboxRoot : mapRoot);
    this.currentMap = this.map; // ref
    this.currentSquares = [
      {
        Atype: 'air',
        airtype: 'normal',
        name: codesFrom(
          `${
            this.allowedCommands
              ? 'WASD to move, use shift to just turn'
              : 'Beginning                 WASD to move!'
          }`
        ),
        collidable: false,
        movable: false,
        locked: false,
        image: []
      }
    ];
    this.clipSquare = airSquare();
    this.modifiedTerm = [];
    this.playerDirection = this.currentMap.startd;
    this.afterTurn = 0;
    if (this.gImagePlayer) {
      this.gImagePlayer.rotation = rotationFromDirection(this.playerDirection);
    }
    this.moveToPosition(this.currentMap.starti, this.currentMap.startj);

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
    this.submitTestCount = [0, 0];
    this.submitPhase = 'input';
    this.animationApplyFrame = 0;
    this.animationSubmitFrame = 0;
    this.animationClearFrame = 0;

    const H = globalThis.screenh - 31;
    const W = globalThis.screenw;
    const h = this.currentMap.h * 16;
    const w = this.currentMap.w * 16;
    this.mapOriginy = 31 + H / 2 - h / 2;
    this.mapOriginx = W / 2 - w / 2;

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
    if (this.mode === 'puzzle') this.gImageFocus?.setAlpha(0);
  }

  removeSquareImage(i: number, j: number) {
    for (let k = 0; k < this.currentMap.squares[i][j].image.length; k += 1) {
      this.currentMap.squares[i][j].image[k].destroy();
    }
    this.currentMap.squares[i][j].image = [];
  }

  addSquareImage(i: number, j: number, alpha: number = 1) {
    const y = 16 * i;
    const x = 16 * j;
    const s = this.currentMap.squares[i][j];
    log(88, this.focusi, this.focusj, this.focusnexti, this.focusnextj);
    log(88, 'addsquareimage', i, j, s, this.imageHandleFromSquare(s, i, j));
    s.image.push(
      this.add
        .image(
          this.mapOriginx + x + 8,
          this.mapOriginy + y + 8,
          this.imageHandleFromSquare(s, i, j)
        )
        .setAlpha(alpha)
        .setDepth(-10)
    );

    if (
      skills.seeNumber ||
      (s.name.length > 1 && s.name[0] !== codesFrom('#')[0])
    ) {
      const abst =
        s.name.length < 3 ? s.name : [s.name[0]].concat(codesFrom('.'));
      const handle = `name_${objectHash(abst)}`;
      if (abst.length === 2) log(10, 'abst:', abst);

      if (!this.textures.exists(handle)) {
        this.font?.loadImageFrom(
          abst,
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
          .setAlpha(alpha)
          .setDepth(-9)
      );
    }

    if (s.locked) {
      s.image.push(
        this.add
          .image(this.mapOriginx + x + 1, this.mapOriginy + y, 'locked')
          .setAlpha(alpha)
          .setDepth(100)
      );
    }
    if (s.Atype === 'stage' && s.movable) {
      s.image.push(
        this.add
          .image(this.mapOriginx + x + 1, this.mapOriginy + y, 'ac')
          .setDepth(100)
      );
    }
    log(89, s.image);
  }

  updateClipImage() {
    this.clipSquare.image.push(
      this.add
        .image(
          globalThis.screenw - 15,
          15,
          this.imageHandleFromSquare(this.clipSquare, -1, -1)
        )
        .setDepth(0)
    );

    if (!this.clipSquare.name.length) {
      const abst =
        this.clipSquare.name.length < 3
          ? this.clipSquare.name
          : [this.clipSquare.name[0]].concat(codesFrom('.'));
      const handle = `name_${objectHash(abst)}`;
      if (!this.textures.exists(handle)) {
        this.font?.loadImageFrom(
          abst,
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

  moveToPosition(
    nexti: number,
    nextj: number,
    nextd: Direction = this.playerDirection
  ) {
    this.playeri = nexti;
    this.playerj = nextj;
    this.playerDirection = nextd;
    log(10, this.playeri, this.playerj, this.playerDirection);
    this.updatePlayerAndFocus();
  }

  checkChangeBackParent(i: number, j: number) {
    if (!this.currentSquares.length) return;
    const current = this.currentSquares.slice(-1)[0];
    if (current.Atype !== 'term') return;
    if (current.term.Atype === 'lam') {
      if (i === 2 && j === 1 && this.gMapBackParent) {
        this.gMapBackParent.setAlpha(0.2);
        this.gMapName?.setAlpha(0.3);
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

  front: Square[];

  execApply(
    xi: number,
    xj: number,
    fi: number,
    fj: number,
    move: boolean = true
  ) {
    log(xi, xj, fi, fj);
    const front = [wallSquare(), wallSquare()];
    if (
      xi >= 0 &&
      xi < this.currentMap.h &&
      xj >= 0 &&
      xj < this.currentMap.w
    ) {
      front[0] = this.currentMap.squares[xi][xj];
    }
    if (
      fi >= 0 &&
      fi < this.currentMap.h &&
      fj >= 0 &&
      fj < this.currentMap.w
    ) {
      front[1] = this.currentMap.squares[fi][fj];
    }
    if (
      ((front[0].Atype === 'term' && front[0].term !== undefined) ||
        (front[0].Atype === 'stage' && front[0].term !== undefined)) &&
      (front[0].movable || !move) &&
      ((front[1].Atype === 'term' && front[1].term !== undefined) ||
        (front[1].Atype === 'stage' && front[1].term !== undefined)) &&
      (front[1].movable || !move)
    ) {
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

      this.substProgress = completeSubst(app).reverse();
      this.substProgress.push(front[1].term);
      log(8, 'left is newer', this.substProgress);
      {
        const y = 16 * fi;
        const x = 16 * fj;
        this.gAnimationApply = this.substProgress.map((e, i) =>
          this.add
            .image(
              this.mapOriginx + x + 8,
              this.mapOriginy + y + 8,
              this.imageHandleFromSquare(
                {
                  Atype: 'term',
                  term: e,
                  name: [],
                  movable: false,
                  locked: false,
                  collidable: false,
                  image: []
                },
                fi,
                fj
              )
            )
            .setDepth(10 + i)
        );
      }

      this.checkChangeBackParent(xi, xj);
      this.checkChangeBackParent(fi, fj);

      this.removeSquareImage(xi, xj);
      this.removeSquareImage(fi, fj);

      this.currentMap.squares[fi][fj] = {
        ...front[1],
        map: undefined,
        Atype: 'term',
        term: cloneDeep(this.substProgress[0])
      };
      if (move) this.currentMap.squares[xi][xj] = airSquare();

      log(78, this.currentMap.squares[fi][fj], fi, fj);
      front[0] = this.currentMap.squares[xi][xj];
      front[1] = this.currentMap.squares[fi][fj];

      log(78, front[0], front[1]);
      this.addSquareImage(xi, xj);
      this.addSquareImage(fi, fj);

      this.animationApplyFrame = 0;
      this.mainState = 'applyAnimating';
      log(77);
    }
  }

  moveBlock(fromi: number, fromj: number, toi: number, toj: number) {
    if (fromi < 0 || this.currentMap.h <= fromi) return;
    if (fromj < 0 || this.currentMap.w <= fromj) return;

    if (
      this.currentMap.squares[fromi][fromj].movable &&
      this.currentMap.squares[toi][toj].Atype === 'air'
    ) {
      log(10, 'moveblock');
      for (
        let k = 0;
        k < this.currentMap.squares[fromi][fromj].image.length;
        k += 1
      ) {
        this.currentMap.squares[fromi][fromj].image[k].destroy();
      }
      for (
        let k = 0;
        k < this.currentMap.squares[toi][toj].image.length;
        k += 1
      ) {
        this.currentMap.squares[toi][toj].image[k].destroy();
      }
      this.currentMap.squares[toi][toj] = this.currentMap.squares[fromi][fromj];
      this.removeSquareImage(fromi, fromj);
      this.removeSquareImage(toi, toj);
      this.currentMap.squares[fromi][fromj] = airSquare();

      this.checkChangeBackParent(fromi, fromj);
      this.checkChangeBackParent(toi, toj);

      this.addSquareImage(fromi, fromj);
      this.addSquareImage(toi, toj);
      if (this.currentMap.squares[toi][toj].image.length > 0) {
        const y = 16 * toi;
        const x = 16 * toj;
        this.currentMap.squares[toi][toj].image[0]
          .setY(this.mapOriginy + y + 8)
          .setX(this.mapOriginx + x + 8);
      }
      if (this.currentMap.squares[toi][toj].image.length > 1) {
        const y = 16 * toi;
        const x = 16 * toj;
        this.currentMap.squares[toi][toj].image[1]
          .setY(this.mapOriginy + y + 8)
          .setX(this.mapOriginx + x + 8);
      }
      if (this.currentMap.squares[toi][toj].image.length > 2) {
        // locked
        const y = 16 * toi;
        const x = 16 * toj;
        this.currentMap.squares[toi][toj].image[2]
          .setY(this.mapOriginy + y)
          .setX(this.mapOriginx + x + 1);
      }

      log(10, this.currentMap);
    }
  }

  moveOn() {
    this.front = [wallSquare(), wallSquare()];
    if (
      this.focusi >= 0 &&
      this.focusi < this.currentMap.h &&
      this.focusj >= 0 &&
      this.focusj < this.currentMap.w
    ) {
      this.front[0] = this.currentMap.squares[this.focusi][this.focusj];
    }
    if (
      this.focusnexti >= 0 &&
      this.focusnexti < this.currentMap.h &&
      this.focusnextj >= 0 &&
      this.focusnextj < this.currentMap.w
    ) {
      this.front[1] = this.currentMap.squares[this.focusnexti][this.focusnextj];
    }

    let di = 0;
    let dj = 0;
    if (this.playerDirection === 'right') dj = 1;
    if (this.playerDirection === 'down') di = 1;
    if (this.playerDirection === 'left') dj = -1;
    if (this.playerDirection === 'up') di = -1;
    const ci = this.playeri;
    const cj = this.playerj;
    log(99, ci, cj, di, dj);
    let n = 0;
    let result: string = 'collide';
    while (n < 10) {
      // 前 10 個まで、または端がくるまで見る
      n += 1;
      const i = ci + di * n;
      const j = cj + dj * n;
      if (i < -1 || this.currentMap.h < i || j < -1 || this.currentMap.w < j)
        break;

      const edge =
        i === -1 ||
        i === this.currentMap.h ||
        j === -1 ||
        j === this.currentMap.w;
      const c = edge ? wallSquare() : this.currentMap.squares[i][j];
      log(99, i, j, c, c.movable);
      if (c.Atype !== 'air' && !c.movable) {
        // 空気が来る前に動かせないブロックがきたら、優先順に後ろから見て apply や submit や enter する
        for (let m = n - (edge ? 1 : 0); m >= 1; m -= 1) {
          const f = this.currentMap.squares[ci + di * m][cj + dj * m];
          const x =
            this.currentMap.squares[ci + di * (m - 1)][cj + dj * (m - 1)];
          if (isTermSquare(f) && isTermSquare(x) && f.movable === true) {
            this.entering = false;
            this.saveState = 'operating';
            this.execApply(
              ci + di * (m - 1),
              cj + dj * (m - 1),
              ci + di * m,
              cj + dj * m
            );
            for (let d = m - 2; d >= 1; d -= 1) {
              this.moveBlock(
                ci + di * d,
                cj + dj * d,
                ci + di * (d + 1),
                cj + dj * (d + 1)
              );
            }
            this.moveToPosition(ci + di, cj + dj);
            result = 'apply';
            break;
          } else if (
            f.Atype === 'block' &&
            f.block === 'submit' &&
            x.Atype === 'term'
          ) {
            this.entering = false;
            this.removeSquareImage(ci + di * m, cj + dj * m);
            this.currentMap.squares[ci + di * m][cj + dj * m] = cloneSquare(x);
            this.addSquareImage(ci + di * m, cj + dj * m, 0.5);

            this.submitTestCount = [0, -1];
            this.animationSubmitFrame = 0;
            this.submitPhase = 'input';
            this.mainState = 'submitAnimating';

            this.focusnexti = ci + di * m;
            this.focusnextj = cj + dj * m;
            this.focusi = ci + di * (m - 1);
            this.focusj = cj + dj * (m - 1);
            this.front[1] = this.currentMap.squares[ci + di * m][cj + dj * m];
            result = 'submit';
            break;
          }
        }
        if (result === 'apply' || result === 'submit') break;

        if (
          // this.front[0] は this.currentMap.squares[ci + di][cj + dj]
          !this.front[0].locked &&
          (this.front[0].Atype === 'map' ||
            this.front[0].Atype === 'stage' ||
            (skills.enterTerm &&
              this.front[0].Atype === 'term' &&
              this.front[0].term.Atype !== 'var') ||
            (this.front[0].Atype === 'block' &&
              (this.front[0].block === 'parent' ||
                this.front[0].block === 'return_title')))
        ) {
          if (!this.entering) {
            this.entering = true;
            this.sCollide.play();
          } else {
            this.entering = false;
            this.sEnter.play();
            this.execEnter(true);
          }
          result = 'enter';
          break;
        } else break;
      } else if (c.Atype === 'air') {
        // 空気が先にきたら、一つずつずらす
        this.entering = false;
        for (let d = n - 1; d >= 1; d -= 1) {
          log(
            9,
            ci + di * d,
            cj + dj * d,
            ci + di * (d + 1),
            cj + dj * (d + 1)
          );
          this.moveBlock(
            ci + di * d,
            cj + dj * d,
            ci + di * (d + 1),
            cj + dj * (d + 1)
          );
        }
        this.moveToPosition(ci + di, cj + dj);
        result = 'move';
        break;
      }
    }
    if (result === 'collide') {
      this.sCollide.play();
    }
    log(10, 'result:', result);

    // log(
    //   10,
    //   this.focusi,
    //   this.focusj,
    //   this.focusnexti,
    //   this.focusnextj,
    //   this.front[0].collidable
    // );
    // if (
    //   this.front[0].Atype === 'term' &&
    //   this.front[0].movable &&
    //   this.front[1].Atype === 'term' &&
    //   this.front[1].movable
    // ) {
    //   this.entering = false;
    //   this.execApply();
    //   this.moveToPosition(this.focusi, this.focusj);
    // } else if (this.front[0].movable && this.front[1].Atype === 'air') {
    //   this.entering = false;
    //   this.moveBlock(this.focusi, this.focusj, this.focusnexti, this.focusnextj);
    //   this.moveToPosition(this.focusi, this.focusj);
    //   log(10, this.currentMap);
    // } else if (
    //   this.front[0].Atype === 'map' ||
    //   this.front[0].Atype === 'stage' ||
    //   (this.front[0].Atype === 'block' &&
    //     (this.front[0].block === 'parent' ||
    //       this.front[0].block === 'return_title'))
    // ) {
    //   if (!this.entering) {
    //     this.entering = true;
    //     this.sCollide.play(); // change to entering sound
    //   } else {
    //     this.entering = false;
    //     this.sEnter.play();
    //     this.execEnter();
    //   }
    // } else if (this.front[0].collidable) {
    //   log(10, 'collide');
    //   this.entering = false;
    //   this.sCollide.play();
    // } else {
    //   log(10, 'move');
    //   this.entering = false;
    //   this.moveToPosition(this.focusi, this.focusj);
    // }
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
    if (!shift || !this.allowedCommands) {
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
      this.clipSquare,
      true,
      true
    );
    this.addSquareImage(this.focusi, this.focusj);
  }

  leaveCheck() {
    log(9, this.currentSquares);
    return match(this.currentSquares.slice(-1)[0])
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
              name: [],
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
            name: [],
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
            name: [],
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
    const changedTerm: Term | undefined = match(
      this.currentMap.squares[this.focusi][this.focusj]
    )
      .with({ Atype: 'term', term: { Atype: 'lam' } }, (focus) => {
        if (this.modifiedTerm.length < 1) throw new Error('s');
        const lam: Term = {
          Atype: 'lam',
          var: focus.term.var,
          ret: this.modifiedTerm[0]
        };
        this.currentMap.squares[this.focusi][this.focusj] = {
          ...focus,
          term: lam
        };
        return lam;
      })
      .with({ Atype: 'term', term: { Atype: 'app' } }, (focus) => {
        if (this.modifiedTerm.length < 2) throw new Error('s');

        const app: Term = {
          Atype: 'app',
          lam: this.modifiedTerm[0],
          param: this.modifiedTerm[1]
        };

        this.currentMap.squares[this.focusi][this.focusj] = {
          ...focus,
          term: app
        };
        return app;
      })
      .with(P._, () => undefined)
      .exhaustive();

    if (!changedTerm) return;
    this.substProgress = completeSubst(changedTerm).reverse();
    log(8, 'substprogress', this.substProgress);
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
                name: [],
                movable: false,
                locked: false,
                collidable: false,
                image: []
              },
              this.focusi,
              this.focusj
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
  }

  execEnter(manual: boolean = false) {
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
      this.sPuzzle.stop();
      this.scene.start('title');
      return;
    }
    if (focus.Atype === 'map') {
      afterMap = cloneDeep(focus.map);
      focus.map.enter();
    } else if (focus.Atype === 'stage') {
      // reset
      focus.map = cloneDeep(focus.stage);
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

      if (
        this.mode === 'puzzle' &&
        manual &&
        afterMap.parentMap === undefined
      ) {
        this.sPuzzle.stop();
        this.scene.start('title');
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
      this.currentSquares.pop();
    } else {
      this.currentSquares.push(focus);
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
      let x = 0;
      if (this.currentMap.h % 2) {
        y -= 8;
      }
      if (this.currentMap.w % 2 === 0) {
        x -= 8;
      }
      const h = 240;
      // const w = 368;
      y += h / 2;
      x += globalThis.screenw / 2;
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
    if (this.currentSquares.length) {
      const current = this.currentSquares.slice(-1)[0];
      if (current.Atype === 'term') {
        const y = 31 + (globalThis.screenh - 31) / 2;
        const x = globalThis.screenw / 2;

        this.gMapBackParent = this.add
          .image(
            x,
            y,
            this.imageHandleFromSquare(this.currentSquares.slice(-1)[0], 1, 1)
          )
          .setScale(7)
          .setAlpha(afterLeave ? 0.2 : 0.5)
          .setDepth(-20);
      }
    }

    // add next map

    if (this.currentSquares.length) {
      const handle = `mapname_${this.currentSquares.slice(-1)[0].name}`;
      if (!this.textures.exists(handle)) {
        this.font?.loadImageFrom(
          this.currentSquares.slice(-1)[0].name,
          handle,
          1
        );
      }
      const t = this.textures.get(handle).getSourceImage();
      const w = t.width;
      this.gMapName = this.add
        .image(10 + w / 2, 15, handle)
        .setAlpha(
          afterLeave && this.currentSquares.slice(-1)[0].Atype === 'term'
            ? 0.3
            : 1
        );
    }
    log(13, 'globalThis.progress', globalThis.progress);
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
            this.imageHandleFromSquare(airSquare(), i, j)
          )
        );
        this.gMapBackAir[i][j]?.setDepth(-11);

        const s = this.currentMap.squares[i][j];
        if (s.Atype === 'stage') {
          s.movable =
            s.movable || globalThis.progress[s.stage.id] !== undefined;

          if (s.movable) {
            s.image.push(
              this.add
                .image(this.mapOriginx + x + 1, this.mapOriginy + y, 'ac')
                .setDepth(-9)
            );
            s.term = globalThis.progress[s.stage.id];
          }
        }
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
    if (!this.currentMap.squares[this.focusi][this.focusj].movable) {
      return;
    }
    this.checkChangeBackParent(this.focusi, this.focusj);
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

    this.checkChangeBackParent(this.focusi, this.focusj);

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
      name: [],
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
          this.execEnter(true);
          this.closeMenu();
        })
        .with(menuElement.leave, () => {
          this.execEnter(true);
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
    if (justDown(this.keys.R)) {
      log(8, this.currentSquares);
      for (let i = 0; i < this.currentMap.h; i += 1) {
        for (let j = 0; j < this.currentMap.w; j += 1) {
          const s = this.currentMap.squares[i][j];
          if (s.Atype === 'block' && s.block === 'parent') {
            this.focusi = i;
            this.focusj = j;
            this.execEnter();
            this.execEnter();
            this.sEnter.play();
            break;
          }
        }
      }
    }
    if (this.allowedCommands && justDown(this.keys.C)) {
      this.execCopy();
      this.closeMenu();
    }
    if (this.allowedCommands && justDown(this.keys.Del)) {
      this.execDelete();
      this.closeMenu();
    }
    if (this.allowedCommands && justDown(this.keys.E)) {
      this.execNew();
      this.closeMenu();
    }
    if (this.allowedCommands && justDown(this.keys.V)) {
      this.execPaste();
      this.closeMenu();
    }
    if (this.allowedCommands && justDown(this.keys.Q)) {
      this.saveState = 'operating';
      this.execApply(
        this.focusnexti,
        this.focusnextj,
        this.focusi,
        this.focusj
      );
      this.closeMenu();
    }
    if (this.allowedCommands && justDown(this.keys.F2)) {
      this.moveBlock(
        this.focusnexti,
        this.focusnextj,
        this.focusi,
        this.focusj
      );
    }
  }

  createColoredTermImage(t: Term, hash: string, handle: string) {
    const deltaH = deltaHFrom(hash);
    const originalTexture = this.textures.get(t.Atype);
    const originalTextureImage = originalTexture.getSourceImage();
    const h = originalTextureImage.height;
    const w = originalTextureImage.width;
    const newTexture = this.textures.createCanvas(handle, w, h);
    if (newTexture == null) {
      return;
    }
    const context = newTexture.getContext();

    log(10, deltaH, originalTexture, h, w);

    const pixels: ImageData = context.getImageData(0, 0, w, h);
    for (let i = 0; i < h; i += 1) {
      // const n = pixels.data.length / 4;
      let deltaVt = Math.floor(deltaH * 255) * 128;
      log(56, deltaVt);
      for (let j = 0; j < w; j += 1) {
        const rgb =
          this.textures.getPixel(j, i, t.Atype) ||
          Phaser.Display.Color.RGBStringToColor('#000000');
        const r = rgb.red;
        const g = rgb.green;
        const b = rgb.blue;
        const hsv = Phaser.Display.Color.RGBToHSV(r, g, b);
        deltaVt = Math.floor(deltaVt / 2);
        const afterRgb = i === h - 3 && (deltaVt % 2) === 1 ?
          Phaser.Display.Color.HSVToRGB(
            hsv.h + deltaH,
            0.22,
            1
          ) :
          Phaser.Display.Color.HSVToRGB(
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
  }

  blockType(i: number, j: number): Block {
    if (i < 0 || this.currentMap.h <= i || j < 0 || this.currentMap.w <= j)
      return 'wall';
    const s = this.currentMap.squares[i][j];
    if (s.Atype === 'block') return s.block;
    return 'notblock';
  }

  imageHandleFromSquare(s: Square, i: number, j: number): string {
    return match(s)
      .with({ Atype: 'air', airtype: 'out' }, () => 'out')
      .with({ Atype: 'air' }, () => {
        if (i < 0) return 'air';
        let ret = 'air';
        if (this.blockType(i, j - 1) === 'wall') {
          ret += 'l';
        }
        if (this.blockType(i, j + 1) === 'wall') {
          ret += 'r';
        }
        if (this.blockType(i - 1, j) === 'wall') {
          ret += 't';
        }
        if (this.blockType(i + 1, j) === 'wall') {
          ret += 'b';
        }
        // log(100, ret, i, j, s.Atype, this.currentMap.squares[i][j].Atype);
        return ret;
      })
      .with({ Atype: 'map' }, () => 'block')
      .with({ Atype: 'block', block: 'apply' }, () => 'apply')
      .with({ Atype: 'block', block: 'down' }, () => 'down')
      .with({ Atype: 'block', block: 'equal' }, () => 'equal')
      .with({ Atype: 'block', block: 'place' }, () => 'place')
      .with({ Atype: 'block', block: 'submit' }, () => 'submit')
      .with({ Atype: 'block', block: 'wall' }, () => 'wall') // reset, parent
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
        s.name = asCodes(s.term);
        const hash: string = s.name.length ? objectHash(s.name) : squareHash(s);
        const handle = coloredHandleFrom(s.term, hash);

        if (!this.textures.exists(handle)) {
          this.createColoredTermImage(s.term, hash, handle);
        }
        return handle;
      })
      .with({ Atype: 'stage', term: undefined }, () => 'block')
      .with({ Atype: 'stage' }, () => {
        log(89, s, s.Atype === 'stage' && s.term);
        const term: Term | undefined =
          s.Atype === 'stage' ? globalThis.progress[s.stage.id] : undefined;

        if (term === undefined) {
          return 'block';
        }
        // eslint-disable-next-line no-param-reassign
        const name = asCodes(term);
        log(91, name);
        const hash: string = name.length
          ? objectHash(name)
          : squareHash({ ...s, name, term } as Square);
        const handle = coloredHandleFrom(term, hash);

        if (!this.textures.exists(handle)) {
          this.createColoredTermImage(term, hash, handle);
        }
        return handle;
      })
      .with(P._, () => 'air')
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

    if (this.currentSquares.length) {
      const handle = `mapname_${this.currentSquares.slice(-1)[0].name}`;
      if (!this.textures.exists(handle)) {
        this.font?.loadImageFrom(
          this.currentSquares.slice(-1)[0].name,
          handle,
          1
        );
      }
      const t = this.textures.get(handle).getSourceImage();
      const w = t.width;
      this.gMapName = this.add.image(10 + w / 2, 15, handle).setAlpha(1);
    }

    for (let i = 0; i < this.currentMap.h; i += 1) {
      this.gMapBackAir.push([]);
      for (let j = 0; j < this.currentMap.w; j += 1) {
        const y = 16 * i;
        const x = 16 * j;
        const s = this.currentMap.squares[i][j];
        if (s.Atype === 'stage') {
          s.term = globalThis.progress[s.stage.id];
        }
        s.image.push(
          this.add
            .image(
              this.mapOriginx + x + 8,
              this.mapOriginy + y + 8,
              this.imageHandleFromSquare(s, i, j)
            )
            .setDepth(-10)
        );

        {
          const abst =
            s.name.length < 3 ? s.name : [s.name[0]].concat(codesFrom('.'));
          const handle = `name_${objectHash(abst)}`;
          if (abst.length === 2) log(10, 'abst:', abst);

          if (!this.textures.exists(handle)) {
            this.font?.loadImageFrom(
              abst,
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
        }

        if (s.Atype === 'stage') {
          s.movable =
            s.movable || globalThis.progress[s.stage.id] !== undefined;

          if (s.movable) {
            s.image.push(
              this.add
                .image(this.mapOriginx + x + 1, this.mapOriginy + y, 'ac')
                .setDepth(-9)
            );
            s.term = globalThis.progress[s.stage.id];
          }
        }

        this.gMapBackAir[i].push(
          this.add.image(
            this.mapOriginx + x + 8,
            this.mapOriginy + y + 8,
            this.imageHandleFromSquare(airSquare(), i, j)
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
    if (this.mode === 'puzzle') this.gImageFocus.setAlpha(0);
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
    this.keys.Q = keysFrom(this, globalThis.keyConfig.Q);
    this.keys.Z = keysFrom(this, globalThis.keyConfig.Z);
    this.keys.R = keysFrom(this, globalThis.keyConfig.R);
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
    this.load.image('airlr', 'assets/images/airlr.png');
    this.load.image('airtb', 'assets/images/airtb.png');
    this.load.image('airlrt', 'assets/images/airlrt.png');
    this.load.image('airlrb', 'assets/images/airlrb.png');
    this.load.image('airltb', 'assets/images/airltb.png');
    this.load.image('airrtb', 'assets/images/airrtb.png');
    this.load.image('airlrtb', 'assets/images/airlrtb.png');
    this.load.image('airout', 'assets/images/out.png');
    this.load.image('player', 'assets/images/player.png');
    this.load.image('focus', 'assets/images/focus.png');
    this.load.image('out', 'assets/images/out.png');
    this.load.image('lam_var', 'assets/images/lam_var.png');
    this.load.image('lam_ret', 'assets/images/lam_ret.png');
    this.load.image('parent', 'assets/images/parent.png');
    this.load.image('locked', 'assets/images/locked.png');
    this.load.image('ac', 'assets/images/ac.png');
    this.load.image('wa', 'assets/images/wa.png');
    this.load.image('font', 'assets/images/font.png');

    this.load.audio('collide', 'assets/sounds/collide.mp3');
  }

  create() {
    log(10, 'Play.create');
    log(10, this.map);

    this.initDrawing();

    if (this.mode === 'puzzle') {
      this.execEnter();
    }

    this.cameras.main.fadeIn(FADEIN_LENGTH / 2, WHITE[0], WHITE[1], WHITE[2]);
    this.cameras.main.setBackgroundColor(
      `rgba(${WHITE[0]},${WHITE[1]},${WHITE[2]},1)`
    );
  }

  updateAnimationApply() {
    if (this.gAnimationApply.length === 1) {
      this.gAnimationApply.slice(-1)[0].destroy();
      this.gAnimationApply.pop();
    }
    if (!this.gAnimationApply.length) {
      this.mainState = this.saveState;
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

  submitTestCount: [number, number]; // test, apply

  submitPhase: SubmitAnimationPhase;

  animationSubmitFrame: number;

  animationClearFrame: number;

  subAnimTargets: {
    image: Phaser.GameObjects.Image;
    from: [number, number];
    to: [number, number];
  }[] = [];

  saveTargets: {
    image: Phaser.GameObjects.Image;
    from: [number, number];
    to: [number, number];
  }[] = [];

  setInputAnimationTargets(s: Stage) {
    if (this.submitTestCount[0] === s.tests.length) {
      log(8, 'status:ac');
      this.mainState = 'clearAnimating';
      this.animationClearFrame = 0;
      return;
    }

    log(1, 'testcount', this.submitTestCount);
    log(8.5, s.inputCoords[this.submitTestCount[0]][this.submitTestCount[1]]);

    this.subAnimTargets = [];
    const t =
      this.currentMap.squares[
        s.inputCoords[this.submitTestCount[0]][this.submitTestCount[1]][0]
      ][s.inputCoords[this.submitTestCount[0]][this.submitTestCount[1]][1]];
    log(123, t);
    // この部屋の var の座標
    let vari = 0;
    let varj = 0;
    if (this.submitTestCount[1] === 0) {
      for (let i = 0; i < this.currentMap.h; i += 1) {
        for (let j = 0; j < this.currentMap.w; j += 1) {
          const c = this.currentMap.squares[i][j];
          if (
            c.Atype === 'term' &&
            c.term.Atype === 'var' &&
            c.movable === false
          ) {
            vari = i;
            varj = j;
            break;
          }
        }
      }
    }

    for (let j = 0; j < t.image.length; j += 1) {
      // locked マークをずらす
      const dy = j > 1 ? -7 : 0;
      const dx = j > 1 ? -6 : 0;
      this.subAnimTargets.push({
        image: t.image[j],
        from: [t.image[j].y, t.image[j].x],
        to:
          // eslint-disable-next-line no-nested-ternary
          this.submitTestCount[1] > 0
            ? [
                this.mapOriginy + 16 * this.focusnexti + 8 + dy,
                this.mapOriginx + 16 * this.focusnextj + 8 + dx
              ]
            : [
                this.mapOriginy + 16 * vari + 8 + dy,
                this.mapOriginx + 16 * varj + 8 + dx
              ]
      });
    }
    log(8.6, this.subAnimTargets);
  }

  gTestResult: Phaser.GameObjects.Image[] = [];

  deleteGTestResult() {
    for (let i = 0; i < this.gTestResult.length; i += 1) {
      this.gTestResult[i].destroy();
    }
    this.gTestResult = [];
  }

  updateAnimationSubmit() {
    log(100, this.submitPhase);
    const currentSquare = this.currentSquares.slice(-1)[0];
    if (currentSquare.Atype !== 'stage') return;
    if (
      currentSquare.Atype !== 'stage' ||
      this.front[0].Atype !== 'term' ||
      this.front[1].Atype !== 'term'
    ) {
      this.mainState = 'operating';
      return;
    }
    const s = currentSquare.stage;
    switch (this.submitPhase) {
      case 'input': {
        this.animationSubmitFrame += 1;

        if (this.submitTestCount[0] === s.tests.length) {
          log(8, 'status:ac');
          this.mainState = 'clearAnimating';
          this.animationClearFrame = 0;
          break;
        }

        if (this.animationSubmitFrame === 1) {
          // input の、次の x に行く
          this.submitTestCount[1] += 1;

          // 最後だったら判定して次のテストケースに行く
          if (
            this.submitTestCount[1] ===
            currentSquare.stage.tests[this.submitTestCount[0]].input.length
          ) {
            log(121);
            const out = s.tests[this.submitTestCount[0]].output;
            if (out.Atype !== 'term') {
              log(3, 'output must be term');
              this.removeSquareImage(this.focusnexti, this.focusnextj);
              this.currentMap.squares[this.focusnexti][this.focusnextj] =
                submitSquare();
              this.addSquareImage(this.focusnexti, this.focusnextj);
              this.mainState = 'operating';
              this.deleteGTestResult();
              break;
            }
            const f = this.currentMap.squares[this.focusnexti][this.focusnextj];
            if (f.Atype !== 'term') {
              log(100, 'cannot submit except term');
              this.removeSquareImage(this.focusnexti, this.focusnextj);
              this.currentMap.squares[this.focusnexti][this.focusnextj] =
                submitSquare();
              this.addSquareImage(this.focusnexti, this.focusnextj);
              this.mainState = 'operating';
              this.deleteGTestResult();
              break;
            }
            log(122);

            if (!equal(f.term, out.term)) {
              log(100, 'status: wa');

              const y0 = 16 * s.outputCoords[this.submitTestCount[0]][0];
              const x0 = 16 * s.outputCoords[this.submitTestCount[0]][1] + 13;
              const y1 = 16 * this.focusnexti;
              const x1 = 16 * this.focusnextj + 13;
              this.gTestResult.push(
                this.add
                  .image(this.mapOriginx + x0, this.mapOriginy + y0, 'wa')
                  .setDepth(-10)
              );
              this.gTestResult.push(
                this.add
                  .image(this.mapOriginx + x1, this.mapOriginy + y1, 'wa')
                  .setDepth(-10)
              );

              this.submitPhase = 'wa';
              this.animationSubmitFrame = 0;
            } else {
              log(123);
              const x = this.currentMap.squares[this.focusi][this.focusj];
              log(123.1);
              this.removeSquareImage(this.focusnexti, this.focusnextj);
              log(123.2);
              this.currentMap.squares[this.focusnexti][this.focusnextj] =
                cloneSquare(x);
              log(123.3);
              this.addSquareImage(this.focusnexti, this.focusnextj, 0.7);

              const y0 = 16 * s.outputCoords[this.submitTestCount[0]][0];
              const x0 = 16 * s.outputCoords[this.submitTestCount[0]][1] + 13;
              const y1 = 16 * this.focusnexti;
              const x1 = 16 * this.focusnextj + 13;
              this.gTestResult.push(
                this.add
                  .image(this.mapOriginx + x0 + 1, this.mapOriginy + y0, 'ac')
                  .setDepth(-10)
              );
              this.gTestResult.push(
                this.add
                  .image(this.mapOriginx + x1 + 1, this.mapOriginy + y1, 'ac')
                  .setDepth(-10)
              );

              this.submitTestCount[0] += 1;
              this.submitTestCount[1] = -1;

              this.submitPhase = 'ac';
              this.animationSubmitFrame = 0;
            }
            break;
          }

          this.setInputAnimationTargets(s);
          log(100, 'subanimtargets', this.subAnimTargets);
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const t of this.subAnimTargets) {
          t.image.setY(
            t.from[0] +
              ((t.to[0] - t.from[0]) * this.animationSubmitFrame) /
                ANIMATION_INPUT_LENGTH
          );
          t.image.setX(
            t.from[1] +
              ((t.to[1] - t.from[1]) * this.animationSubmitFrame) /
                ANIMATION_INPUT_LENGTH
          );
        }

        if (this.animationSubmitFrame > ANIMATION_INPUT_LENGTH) {
          // eslint-disable-next-line no-restricted-syntax
          for (const t of this.subAnimTargets) {
            t.image.setAlpha(0);
            this.saveTargets.push(t);
          }

          this.animationSubmitFrame = 0;
          this.submitPhase = 'apply';
          break;
        }
        break;
      }
      case 'apply': {
        if (this.submitTestCount[0] === s.tests.length) {
          this.mainState = 'clearAnimating';
        } else {
          this.animationSubmitFrame = 0;
          this.submitPhase = 'input';

          this.saveState = this.mainState;
          this.execApply(
            currentSquare.stage.inputCoords[this.submitTestCount[0]][
              this.submitTestCount[1]
            ][0],
            currentSquare.stage.inputCoords[this.submitTestCount[0]][
              this.submitTestCount[1]
            ][1],
            this.focusnexti,
            this.focusnextj,
            false
          );
        }
        break;
      }
      case 'wa': {
        this.animationSubmitFrame += 1;

        if (this.animationSubmitFrame === 1) {
          this.sNg.play();
        }
        if (this.animationSubmitFrame > ANIMATION_WA_LENGTH) {
          this.removeSquareImage(this.focusnexti, this.focusnextj);
          this.currentMap.squares[this.focusnexti][this.focusnextj] =
            submitSquare();
          this.addSquareImage(this.focusnexti, this.focusnextj);

          // eslint-disable-next-line no-restricted-syntax
          for (const t of this.saveTargets) {
            t.image.setY(t.from[0]).setX(t.from[1]).setAlpha(1);
          }
          this.saveTargets = [];

          this.mainState = 'operating';
          this.deleteGTestResult();
        }
        break;
      }
      case 'ac': {
        const c = this.currentSquares.slice(-1)[0];
        if (c.Atype !== 'stage') {
          this.submitPhase = 'input';
          break;
        }

        this.animationSubmitFrame += 1;

        if (this.animationSubmitFrame === 1) {
          this.sOk.play();
        }
        if (
          this.animationSubmitFrame >
          ANIMATION_AC_LENGTH + ANIMATION_AC_INTERVAL
        ) {
          this.submitPhase = 'input';
          this.animationSubmitFrame = 0;
          this.deleteGTestResult();
        } else if (this.animationSubmitFrame > ANIMATION_AC_LENGTH) {
          this.deleteGTestResult();

          const y = 16 * this.focusnexti + 8;
          const x = 16 * this.focusnextj + 8;
          this.gTestResult.push(
            this.add
              .image(this.mapOriginx + x, this.mapOriginy + y, 'air')
              .setDepth(-10)
          );
        }
        break;
      }
      default: {
        this.submitPhase = 'input';
        break;
      }
    }
  }

  updateAnimationClear() {
    this.animationClearFrame += 1;

    if (this.animationClearFrame === 1) {
      this.sClear.play();

      const st = this.currentSquares.slice(-1)[0];
      if (st.Atype !== 'stage') {
        // impossible
        return;
      }
      const sub = this.currentMap.squares[this.focusnexti][this.focusnextj];
      if (sub.Atype !== 'term') {
        return;
      }
      st.term = sub.term;
      log(92, asCodes(sub.term));

      this.removeSquareImage(this.focusnexti, this.focusnextj);
      this.currentMap.squares[this.focusnexti][this.focusnextj] = airSquare();
      this.addSquareImage(this.focusnexti, this.focusnextj);
      this.deleteGTestResult();

      // eslint-disable-next-line no-restricted-syntax
      for (const t of this.saveTargets) {
        t.image.setY(t.from[0]).setX(t.from[1]).setAlpha(1);
      }
      this.saveTargets = [];

      globalThis.progress[st.stage.id] = sub.term;
      globalThis.storage.set('progress', globalThis.progress);
      log(13, 'clear', st.stage.id, globalThis.progress[st.stage.id])
      this.moveOn();
    }
    if (this.animationClearFrame > ANIMATION_CLEAR_LENGTH) {
      this.mainState = 'operating';
      this.moveToPosition(
        this.currentMap.starti,
        this.currentMap.startj,
        opposite(this.currentMap.startd)
      );
      this.execEnter();
      this.currentMap.squares[this.focusi][this.focusj].movable = true;
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
          if (this.allowedCommands && justDown(this.keys.Enter)) {
            this.openMenu();
          }
        }
        break;
      }
      case 'applyAnimating': {
        this.updateAnimationApply();
        break;
      }
      case 'submitAnimating': {
        this.updateAnimationSubmit();
        break;
      }
      case 'clearAnimating': {
        this.updateAnimationClear();
        break;
      }
      default: {
        this.mainState = 'operating';
        break;
      }
    }
  }
}
