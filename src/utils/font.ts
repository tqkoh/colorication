class Font {
  h: number;

  offset: number;

  data: boolean[][][];

  constructor(
    h: number,
    w: number,
    fImage: boolean[][],
    offset: number = 0,
    marginWidth = 1
  ) {
    this.h = h - 1;
    this.offset = offset;
    this.data = [];
    {
      let jCur = 0;
      let multi = false;
      while (jCur < w) {
        while (jCur < w && !fImage[this.h][jCur]) jCur += 1;
        let letter: boolean[][] = [];
        for (let i = 0; i < h; i += 1) {
          letter.push([]);
        }
        if (multi) {
          for (let j = 0; j < marginWidth; j += 1) {
            for (let i = 0; i < this.h; i += 1) {
              letter[i].push(false);
            }
          }
        }
        while (jCur < w && fImage[this.h][jCur]) {
          for (let i = 0; i < this.h; i += 1) {
            letter[i].push(fImage[i][jCur]);
          }
          jCur += 1;
        }
        multi = true;
        this.data.push(letter);
        letter = [];
      }
    }
  }

  getImage(from: string, scale: number = 1): boolean[][] {
    const ret: boolean[][] = [];
    for (let i = 0; i < this.h * scale; i += 1) {
      ret.push([]);
    }
    for (let k = 0; k < from.length; k += 1) {
      const letter = this.data[from.charCodeAt(k) - this.offset]; // ref
      for (let i = 0; i < this.h; i += 1) {
        for (let j = 0; j < letter[0].length; j += 1) {
          for (let ki = 0; ki < scale; ki += 1) {
            for (let kj = 0; kj < scale; kj += 1) {
              ret[i * scale + ki].push(letter[i][j]);
            }
          }
        }
      }
    }
    return ret;
  }
}

export default Font;
