import { log } from './deb';

const CHAR_OF_1_WIDTH = [33, 39, 46];

export function codesFrom(s: string): number[] {
  return s.split('').map((c) => c.charCodeAt(0));
}

class Font {
  h: number;

  offset: number;

  data: boolean[][][];

  isLetter: boolean[];

  constructor(h: number, w: number, fImage: boolean[][], offset: number = 0) {
    this.h = h - 1;
    this.offset = offset;
    this.data = [];
    this.isLetter = [];
    const letters: boolean[][][] = [];
    {
      let jCur = 0;
      while (jCur < w) {
        while (jCur < w && !fImage[this.h][jCur]) jCur += 1;
        let letter: boolean[][] = [];
        for (let i = 0; i < h; i += 1) {
          letter.push([]);
        }
        while (jCur < w && fImage[this.h][jCur]) {
          for (let i = 0; i < this.h; i += 1) {
            letter[i].push(fImage[i][jCur]);
          }
          jCur += 1;
        }
        letters.push(letter);
        letter = [];
      }
    }
    this.data = letters;
    log(10, 'font.data: ', this.data);
  }

  getImage(fromParam: number[], scale: number = 1): boolean[][] {
    const from: number[] = fromParam.length ? fromParam : codesFrom(' ');
    const ret: boolean[][] = [];
    for (let i = 0; i < this.h * scale; i += 1) {
      ret.push([]);
    }
    for (let k = 0; k < from.length; k += 1) {
      const code = from[k];
      let letter: boolean[][] = [];
      if (
        code < this.offset ||
        this.offset + this.data.length <= code ||
        (this.data[code - this.offset][0].length === 1 &&
          !CHAR_OF_1_WIDTH.includes(code))
      ) {
        // code に対応する文字がない場合、code を(その文字コードの文字の代わりに)数値の文字列として見たものを表示する
        const s = `#${code.toString()}`; // "#129"
        const codes = s.split('').map((c) => c.charCodeAt(0));
        letter = this.getImage(codes);
      } else {
        letter = this.data[code - this.offset]; // ref
      }
      for (let i = 0; i < this.h; i += 1) {
        for (let j = 0; j < letter[0].length; j += 1) {
          for (let ki = 0; ki < scale; ki += 1) {
            for (let kj = 0; kj < scale; kj += 1) {
              ret[i * scale + ki].push(letter[i][j]);
            }
          }
        }
        for (let ki = 0; ki < scale; ki += 1) {
          ret[i * scale + ki].push(false);
        }
      }
    }
    return ret;
  }
}

export default Font;
