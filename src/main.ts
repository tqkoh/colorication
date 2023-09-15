import Phaser from 'phaser';
import { defaultKeyConfig } from './data/keyConfig';
import Load from './scenes/load';
import Play from './scenes/play';
import Title from './scenes/title';
import { keyConfigCodec, progressCodec } from './utils/storageCodecs';
import Term from './utils/term';
import { BaseStorage, createTypedStorage } from './utils/typedStorage';

const MAX_STAGE_NUM = 30;

globalThis.storage = createTypedStorage(
  {
    keyConfig: keyConfigCodec,
    progress: progressCodec
  },
  new BaseStorage(localStorage)
);

globalThis.keyConfig = defaultKeyConfig;

{
  const keyConfigFromStorage = globalThis.storage.get('keyConfig');
  if (keyConfigFromStorage === null) {
    globalThis.keyConfig = defaultKeyConfig;
    globalThis.storage.set('keyConfig', globalThis.keyConfig);
  } else {
    globalThis.keyConfig = {
      ...globalThis.keyConfig,
      ...keyConfigFromStorage
    };
    globalThis.storage.set('keyConfig', globalThis.keyConfig);
  }
}

globalThis.progress = new Array<Term | undefined>(MAX_STAGE_NUM).fill(undefined);

{
  const progressFromStorage = globalThis.storage.get('progress');
  if (progressFromStorage === null) {
    globalThis.storage.set('progress', globalThis.progress);
  } else {
    for (let i = 0; i < progressFromStorage.length; i+=1) {
      globalThis.progress[i] = progressFromStorage[i];
    }
    globalThis.storage.set('progress', globalThis.progress);
  }
}

globalThis.screenh = 255;
globalThis.screenw = 340;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  height: globalThis.screenh,
  width: globalThis.screenw,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [Load, Title, Play],
  pixelArt: true
};

// new Phaser.Game(config);
// {
// 	let e = document.querySelector("canvas");
// 	if (e) {
// 		console.log("a");
// 		e.style.display = "none";
// 	}
// }

// eslint-disable-next-line no-unused-vars, no-new
new Phaser.Game(config);

// const e = document.querySelector("canvas")?.getContext("2d");
// if (e) e.fillStyle = "rgb(255, 165, 0)";
