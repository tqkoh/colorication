import { Howl } from 'howler';
import Phaser from 'phaser';
import { justDown, keysFrom } from '../data/keyConfig';
import { log } from '../utils/deb';
import FontForPhaser from '../utils/fontForPhaser';

const FADEIN_LENGTH = 200;
const FADEOUT_LENGTH = 1000;
// const WHITE = [255, 239, 215];
const WHITE = [250, 247, 240];
const BLACK = [84, 75, 64];

const TITLE_ARROW_DIFF = 22;
const TITLE_ARROW_H = 14;
const TITLE_ARROW_W = 14;
const TITLE_ARROW_POS = [127 + TITLE_ARROW_H / 2, 212 + TITLE_ARROW_W / 2];

const BGM_VOLUME = 0.6;

const menu = {
  puzzle: 0,
  sandbox: 1,
  options: 2,

  size: 3
} as const;
type Selected = 0 | 1 | 2;

export default class Title extends Phaser.Scene {
  keys: {
    enter: Phaser.Input.Keyboard.Key[];
    up: Phaser.Input.Keyboard.Key[];
    down: Phaser.Input.Keyboard.Key[];
  };

  gArrow: Phaser.GameObjects.Image | undefined;

  sTitleIntro: Howl;

  sTitleLoop: Howl;

  sStart: Howl;

  sPoint: Howl;

  sEnter: Howl;

  fading: boolean;

  fadingStart: number;

  selected: Selected;

  font: FontForPhaser | undefined;

  constructor() {
    super({ key: 'title' });
    this.keys = {
      enter: [],
      up: [],
      down: []
    };
    this.sTitleIntro = new Howl({
      src: ['assets/sounds/title_intro.mp3']
    });
    this.sTitleIntro.volume(BGM_VOLUME);
    this.sTitleLoop = new Howl({
      src: ['assets/sounds/title_loop.mp3'],
      loop: true
    });
    this.sTitleLoop.volume(BGM_VOLUME);
    this.sStart = new Howl({
      src: ['assets/sounds/start.mp3']
    });
    this.sTitleIntro.on('end', () => {
      this.sTitleLoop.play();
    });
    this.sPoint = new Howl({
      src: ['assets/sounds/point.mp3']
    });
    this.sEnter = new Howl({
      src: ['assets/sounds/enter.mp3']
    });
    this.fading = false;
    this.fadingStart = 0;

    this.selected = menu.puzzle;
  }

  init() {
    this.keys = {
      enter: [],
      up: [],
      down: []
    };
    this.sTitleIntro.volume(BGM_VOLUME);
    this.sTitleLoop.volume(BGM_VOLUME);
    this.fading = false;
    this.fadingStart = 0;

    this.selected = menu.puzzle;
  }

  preload() {
    log(10, 'Title.preload');
    this.init();
    this.cameras.main.setBackgroundColor(
      `rgba(${BLACK[0]},${BLACK[1]},${BLACK[2]},1)`
    );
    this.load.image('title', 'assets/images/title.png');
    this.load.image('arrow', 'assets/images/arrow.png');
    this.load.image('font', 'assets/images/font.png');
  }

  create() {
    log(10, 'Title.create');

    this.keys.enter = keysFrom(this, globalThis.keyConfig.Enter);
    this.keys.up = keysFrom(this, globalThis.keyConfig.W);
    this.keys.down = keysFrom(this, globalThis.keyConfig.S);
    // if (localStorage.getItem("played") === null) {
    // 	this.scene.start("game");
    // }
    this.sTitleIntro.play();
    {
      const y = globalThis.screenh / 2;
      const x = globalThis.screenw / 2;
      this.add.image(x, y, 'title');
    }
    this.gArrow = this.add.image(
      TITLE_ARROW_POS[1],
      TITLE_ARROW_POS[0],
      'arrow'
    );
    if (this.gArrow) {
      this.gArrow.scale = 2;
    }

    this.cameras.main.fadeIn(FADEIN_LENGTH / 2, BLACK[0], BLACK[1], BLACK[2]);
    this.cameras.main.setBackgroundColor(
      `rgba(${WHITE[0]},${WHITE[1]},${WHITE[2]},1)`
    );

    this.font = new FontForPhaser(this.textures, 'font', 10);
  }

  update() {
    if (this.fading) {
      const el = new Date().getTime() - this.fadingStart;
      // const volume = Math.max(0, 0.5 - el / FADEOUT_LENGTH);
      // this.sTitleIntro.volume(volume);
      // this.sTitleLoop.volume(volume);
      if (el > FADEOUT_LENGTH) {
        this.scene.start('play', {
          mode: this.selected === menu.puzzle ? 'puzzle' : 'sandbox'
        });
        this.sTitleIntro.stop();
        this.sTitleLoop.stop();
      }
    } else {
      {
        let count = 0;
        if (justDown(this.keys.down) && this.selected + 1 < menu.size) {
          this.selected += 1;
          this.gArrow?.setY(
            TITLE_ARROW_POS[0] + this.selected * TITLE_ARROW_DIFF
          );
          if (!count) this.sPoint.play();
          count += 1;
        }
        if (justDown(this.keys.up) && this.selected - 1 >= 0) {
          this.selected -= 1;
          this.gArrow?.setY(
            TITLE_ARROW_POS[0] + this.selected * TITLE_ARROW_DIFF
          );
          if (!count) this.sPoint.play();
          count += 1;
        }
      }
      if (justDown(this.keys.enter)) {
        log(10, 'enter');
        if (this.selected === menu.puzzle || this.selected === menu.sandbox) {
          this.cameras.main.fadeOut(
            FADEOUT_LENGTH / 2,
            WHITE[0],
            WHITE[1],
            WHITE[2]
          );
          this.fading = true;
          this.fadingStart = new Date().getTime();
          this.sTitleIntro.fade(1, 0, FADEOUT_LENGTH / 2);
          this.sTitleLoop.fade(1, 0, FADEOUT_LENGTH / 2);
          this.sStart.play();
        } else if (this.selected === menu.options) {
          log(10, 'options');
          this.sEnter.play();
        }
      }
    }
  }
}
