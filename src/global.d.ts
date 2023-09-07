/* eslint-disable no-unused-vars */
/* eslint-disable no-var */
/* eslint-disable vars-on-top */
import Phaser from 'phaser';
import { KeyConfig } from './data/keyConfig';
import Term from './utils/term';
import { Codec, TypedStorage } from './utils/typedStorage';

declare global {
  var storage: TypedStorage<{
    keyConfig: Codec<KeyConfig>;
    progress: Codec<(Term | undefined)[]>;
  }>;
  var keyConfig: KeyConfig;
  var progress: (Term | undefined)[];
  var screenh: number;
  var screenw: number;
  var game: Phaser.Game;
  var start: () => void;
}
