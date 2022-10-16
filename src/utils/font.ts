import { log } from './deb';

const MAX_CODE = 999;
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
    for (let i = 0; i < MAX_CODE + 1; i += 1) {
      if (
        i < offset ||
        offset + letters.length <= i ||
        (letters[i - offset][0].length === 1 && !letters[i - offset][6][0])
      ) {
        this.data.push(letters[1]); // temp
        this.isLetter.push(false);
      } else {
        this.data.push(letters[i - offset]);
        this.isLetter.push(true);
      }
    }
    for (let i = 0; i < MAX_CODE + 1; i += 1) {
      if (
        i < offset ||
        offset + letters.length <= i ||
        (letters[i - offset][0].length === 1 && !CHAR_OF_1_WIDTH.includes(i))
      ) {
        // i に対応する文字がない場合、i を文字列として見たものを表示する
        const s = `#${i.toString()}`; // "#129"
        const codes = s.split('').map((c) => c.charCodeAt(0));
        this.data[i] = this.getImage(codes);
      }
    }
    log(10, 'font.data: ', this.data);
  }

  getImage(fromParam: number[], scale: number = 1): boolean[][] {
    const from: number[] = fromParam.length ? fromParam : codesFrom(' ');
    const ret: boolean[][] = [];
    for (let i = 0; i < this.h * scale; i += 1) {
      ret.push([]);
    }
    for (let k = 0; k < from.length; k += 1) {
      const letter = this.data[from[k]]; // ref

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
