import Phaser from 'phaser';
import { v4 as uuid } from 'uuid';
import Font from './font';

const BLACK = [84, 75, 64];

class FontForPhaser extends Font {
  textures: Phaser.Textures.TextureManager; // ref

  constructor(
    textures: Phaser.Textures.TextureManager,
    fontTexture: string,
    offset: number
  ) {
    const font = textures.get(fontTexture).getSourceImage();
    const h = font.height;
    const w = font.width;
    const fImage: boolean[][] = [];
    for (let i = 0; i < h; i += 1) {
      fImage.push([]);
      for (let j = 0; j < w; j += 1) {
        const c = textures.getPixel(j, i, fontTexture);
        if (c.alpha) fImage[i].push(true);
        else fImage[i].push(false);
      }
    }
    super(h, w, fImage, offset);
    this.textures = textures; // ref
  }

  loadImageFrom(
    from: number[],
    handle: string = uuid(),
    scale: number = 1,
    r: number = BLACK[0],
    g: number = BLACK[1],
    b: number = BLACK[2],
    a: number = 255
  ) {
    if (this.textures.exists(handle)) {
      return;
    }
    const image = this.getImage(from, scale);
    if (image.length) {
      const h = image.length;
      const w = image[0].length;
      const newTexture = this.textures.createCanvas(handle, w, h);
      const context = newTexture.getContext();
      // let tex = this.textures.get("menu_pastet").getDataSourceImage();
      // let im = new Image();
      // im.src = "assets/images/menu_paste.png";

      // context.drawImage(im, 0, 0);

      const pixels = context.getImageData(0, 0, w, h);
      for (let i = 0; i < h; i += 1) {
        for (let j = 0; j < w; j += 1) {
          pixels.data[4 * (i * w + j) + 0] = r;
          pixels.data[4 * (i * w + j) + 1] = g;
          pixels.data[4 * (i * w + j) + 2] = b;
          pixels.data[4 * (i * w + j) + 3] = image[i][j] ? a : 0; // a
        }
      }

      context.putImageData(pixels, 0, 0);
      newTexture.refresh();
    } else {
      throw new Error('bu');
    }
  }
}

export default FontForPhaser;
