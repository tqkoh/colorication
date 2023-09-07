/* eslint-disable no-unused-vars */
/* eslint-disable no-var */
/* eslint-disable vars-on-top */
import Phaser from 'phaser';
import { KeyConfig } from './data/keyConfig';
import { Codec, TypedStorage } from './utils/typedStorage';

declare global {
  var storage: TypedStorage<{
    keyConfig: Codec<KeyConfig>;
    progress: Codec<boolean[]>;
  }>;
  var keyConfig: KeyConfig;
  var progress: boolean[];
  var screenh: number;
  var screenw: number;
  var game: Phaser.Game;
  var start: () => void;
}
