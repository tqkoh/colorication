import { Howl } from 'howler';
import Phaser from 'phaser';
import { match, P } from 'ts-pattern';
import { isDown, justDown, keysFrom } from '../data/keyConfig';
import deb from '../utils/deb';
import FontForPhaser from '../utils/fontForPhaser';
import Term from '../utils/term';
import { coloredHandleFrom, deltaHFrom, squareHash } from '../utils/termColor';
import {
  GameMap,
  Square,
  squaresFromLam,
  squaresFromStage
} from './play/gamemap';
import mapRoot from './play/maps/root';

type Direction = 'right' | 'down' | 'left' | 'up';
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
    .with({ type: 'air' }, () => [
      menuElement.new,
      menuElement.paste,
      menuElement.close
    ])
    .with({ locked: true }, () => [
      menuElement.copy,
      menuElement.delete,
      menuElement.memo,
      menuElement.close
    ])
    .with({ type: 'term', term: { type: 'var' } }, () => [
      menuElement.copy,
      menuElement.delete,
      menuElement.memo,
      menuElement.close
    ])
    .with({ type: 'term' }, () => [
      menuElement.enter,
      menuElement.copy,
      menuElement.delete,
      menuElement.memo,
      menuElement.close
    ])
    .with({ type: 'block', block: 'parent' }, () => [
      menuElement.leave,
      menuElement.memo,
      menuElement.close
    ])
    .with({ type: 'block', block: 'wall' }, () => [])
    .with({ type: 'block', block: 'submit' }, () => [
      menuElement.enter,
      menuElement.close
    ])
    .with({ type: 'block' }, () => [
      menuElement.new,
      menuElement.paste,
      menuElement.close
    ])
    .with({ type: P._ }, () => [
      menuElement.enter,
      menuElement.memo,
      menuElement.close
    ])
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
    super({ key: 'play' });
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
      Del: []
    };
    this.gMenuElements = [];
    this.map = new GameMap(mapRoot);
    this.currentMap = this.map; // ref
    this.playeri = this.currentMap.starti;
    this.playerj = this.currentMap.startj;
    this.focusi = this.currentMap.starti;
    this.focusj = this.currentMap.startj;
    this.playerDirection = 'right';
    this.focusj += 1;
    this.menuDisplaying = false;
    this.menu = [];
    this.menuY = 0;
    this.menuX = 0;
    this.selected = 0;

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

  updatePlayerImage() {
    this.focusi = this.playeri;
    this.focusj = this.playerj;

    if (this.playerDirection === 'right') this.focusj += 1;
    if (this.playerDirection === 'down') this.focusi += 1;
    if (this.playerDirection === 'left') this.focusj -= 1;
    if (this.playerDirection === 'up') this.focusi -= 1;

    const py = this.mapOriginy + this.playeri * 16;
    const px = this.mapOriginx + this.playerj * 16;
    this.gImagePlayer?.setY(py + 8).setX(px + 8);
    const fy = this.mapOriginy + this.focusi * 16;
    const fx = this.mapOriginx + this.focusj * 16;
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
      .with('right', () => [0, 1])
      .with('down', () => [1, 0])
      .with('left', () => [0, -1])
      .with('up', () => [-1, 0])
      .exhaustive();

    const nexti = this.playeri + diff[0];
    const nextj = this.playerj + diff[1];
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
      deb(this.keys);
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

    const T = 30;

    if (
      jd ||
      (d &&
        this.lastPressedMovementKey === 'd' &&
        this.keepingPressingFrame % T === 0 &&
        this.keepingPressingFrame > T)
    ) {
      this.moveToDirection('right', 0);
    }
    if (
      js ||
      (s &&
        this.lastPressedMovementKey === 's' &&
        this.keepingPressingFrame % T === 0 &&
        this.keepingPressingFrame > T)
    ) {
      this.moveToDirection('down', Math.PI / 2);
    }
    if (
      ja ||
      (a &&
        this.lastPressedMovementKey === 'a' &&
        this.keepingPressingFrame % T === 0 &&
        this.keepingPressingFrame > T)
    ) {
      this.moveToDirection('left', Math.PI);
    }
    if (
      jw ||
      (w &&
        this.lastPressedMovementKey === 'w' &&
        this.keepingPressingFrame % T === 0 &&
        this.keepingPressingFrame > T)
    ) {
      this.moveToDirection('up', (Math.PI * 3) / 2);
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
    deb(1.6, this.currentMap);
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
  execCopy() {}

  // eslint-disable-next-line class-methods-use-this
  execPaste() {}

  execEnter() {
    const focus = this.currentMap.squares[this.focusi][this.focusj];
    let afterMap: GameMap;
    if (focus.type === 'map') {
      afterMap = focus.map;
    } else if (focus.type === 'stage') {
      const st = squaresFromStage(focus.stage);
      deb(st);
      focus.map = new GameMap(squaresFromStage(focus.stage));
      afterMap = focus.map;
    } else if (focus.type === 'term' && focus.term.type === 'lam') {
      focus.map = new GameMap(squaresFromLam(focus.term));
      afterMap = focus.map;
    } else if (focus.type === 'block' && focus.block === 'parent') {
      if (this.currentMap.parentMap) {
        afterMap = this.currentMap.parentMap;
      } else {
        return;
      }
    } else {
      return;
    }
    if (focus.type !== 'block' || focus.block !== 'parent') {
      afterMap.setParent(this.currentMap);
    }

    // destroy previous map
    for (let i = 0; i < this.currentMap.h; i += 1) {
      for (let j = 0; j < this.currentMap.w; j += 1) {
        this.currentMap.squares[i][j].image?.destroy();
        this.currentMap.squares[i][j].image = undefined;
      }
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

    this.playerDirection = 'right';
    if (this.gImagePlayer !== undefined) {
      this.gImagePlayer.rotation = 0;
    }
    this.moveToPosition(this.currentMap.starti, this.currentMap.startj);

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
      if (this.mapBack) {
        this.mapBack.setY(y).setX(x);
      }
    }

    // add next map
    for (let i = 0; i < this.currentMap.h; i += 1) {
      for (let j = 0; j < this.currentMap.w; j += 1) {
        const y = 16 * i;
        const x = 16 * j;
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

  // eslint-disable-next-line class-methods-use-this
  execDelete() {}

  // eslint-disable-next-line class-methods-use-this
  execMemo() {}

  // eslint-disable-next-line class-methods-use-this
  execNew() {}

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
  }

  createColoredTermImage(t: Term, hash: string, handle: string) {
    const deltaH = deltaHFrom(hash);
    const originalTexture = this.textures.get(t.type);
    const originalTextureImage = originalTexture.getSourceImage();
    const h = originalTextureImage.height;
    const w = originalTextureImage.width;
    const newTexture = this.textures.createCanvas(handle, w, h);
    const context = newTexture.getContext();

    deb(deltaH, originalTexture, h, w);

    const pixels: ImageData = context.getImageData(0, 0, w, h);
    // const n = pixels.data.length / 4;
    for (let i = 0; i < h; i += 1) {
      for (let j = 0; j < w; j += 1) {
        const rgb = this.textures.getPixel(j, i, t.type);
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
          t.type
        );
      }
    }
    context.putImageData(pixels, 0, 0);
    newTexture.refresh();
    deb(this.textures.exists(handle));
  }

  imageHandleFromSquare(
    s: Square,
    i: number,
    j: number,
    h: number,
    w: number
  ): string {
    return match(s)
      .with({ type: 'air' }, () => {
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
      .with({ type: 'map' }, () => 'lam')
      .with({ type: 'stage' }, () => 'lam')
      .with({ type: 'block', block: 'apply' }, () => 'app')
      .with({ type: 'block', block: 'down' }, () => 'down')
      .with({ type: 'block', block: 'equal' }, () => 'equal')
      .with({ type: 'block', block: 'place' }, () => 'place')
      .with({ type: 'block', block: 'submit' }, () => 'submit')
      .with({ type: 'block', block: 'wall' }, () => 'wall') // reset, parent
      .with({ type: 'block' }, () => 'lam')
      .with({ type: 'term' }, () => {
        if (s.type !== 'term') {
          return '';
        }
        const hash: string = squareHash(s);
        const handle = coloredHandleFrom(s.term, hash);
        deb(handle);
        if (!this.textures.exists(handle)) {
          this.createColoredTermImage(s.term, hash, handle);
        }
        return handle;
      })
      .with({ type: P._ }, () => 'air')
      .exhaustive();
  }

  mapBack: Phaser.GameObjects.TileSprite | undefined;

  initDrawing() {
    // background
    {
      let y = 31;
      let x = -14;
      const h = 240;
      const w = 368;
      y += h / 2;
      x = globalThis.screenw / 2;
      this.mapBack = this.add.tileSprite(x, y, w, h, 'out').setDepth(-100);
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
    for (let i = 0; i < this.currentMap.h; i += 1) {
      for (let j = 0; j < this.currentMap.w; j += 1) {
        const y = 16 * i;
        const x = 16 * j;
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
    const py = this.mapOriginy + this.playeri * 16;
    const px = this.mapOriginx + this.playerj * 16;
    this.gImagePlayer = this.add.image(px + 8, py + 8, 'player');
    this.gImagePlayer.setDepth(10);
    this.gImageFocus = this.add.image(px + 16 + 8, py + 8, 'focus');
    this.gImageFocus.setDepth(10);

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
    this.gMenuBackground.strokeRectShape(this.gMenuBackgroundShape);
    this.gMenuBackground.visible = false;
    this.gMenuBackground.clear();
    this.gArrow = this.add.image(0, 0, 'arrow');
    this.gArrow.visible = false;

    this.font = new FontForPhaser(this.textures, 'font', 10);
    // font: FontForPhase
    // eslint-disable-next-line no-restricted-syntax
    for (const e of menuElementList) {
      this.font.loadImageFrom(
        menuElementMessages[e],
        menuElementIds[e],
        ...BLACK
      );
      this.gMenuElements.push(this.add.image(0, 0, menuElementIds[e]));
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const e of menuElementList) {
      const t = this.gMenuElements[e];
      if (t) t.visible = false;
    }
    deb(1, this.currentMap);
  }

  preload() {
    deb('Play.preload');
    this.cameras.main.setBackgroundColor(
      `rgba(${WHITE[0]},${WHITE[1]},${WHITE[2]},1)`
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

    this.load.image('lam', 'assets/images/lam.png'); // todo: matomeru
    this.load.image('app', 'assets/images/app.png');
    this.load.image('var', 'assets/images/var.png');
    this.load.image('equal', 'assets/images/equal.png');
    this.load.image('wall', 'assets/images/wall.png');
    this.load.image('not_equal', 'assets/images/not_equal.png');
    this.load.image('equal_green', 'assets/images/equal_green.png');
    this.load.image('not_equal_red', 'assets/images/not_equal_red.png');
    this.load.image('down', 'assets/images/down.png');
    this.load.image('apply', 'assets/images/apply.png');
    this.load.image('submit', 'assets/images/submit.png');

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
    this.load.image('font', 'assets/images/font.png');

    this.load.audio('collide', 'assets/sounds/collide.mp3');
  }

  create() {
    deb('Play.create');
    deb(this.map);

    this.initDrawing();

    this.cameras.main.fadeIn(FADEIN_LENGTH / 2, WHITE[0], WHITE[1], WHITE[2]);
    this.cameras.main.setBackgroundColor(
      `rgba(${WHITE[0]},${WHITE[1]},${WHITE[2]},1)`
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
