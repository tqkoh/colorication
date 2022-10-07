import Phaser from "phaser";
import { v4 as uuid } from "uuid";
import { Font } from "./font";

export class FontForPhaser extends Font {
	textures: Phaser.Textures.TextureManager;
	constructor(
		textures: Phaser.Textures.TextureManager,
		fontTexture: string,
		offset: number
	) {
		const font = textures.get(fontTexture).getSourceImage();
		let h = font.height,
			w = font.width;
		let fImage: boolean[][] = [];
		for (let i = 0; i < h; ++i) {
			fImage.push([]);
			for (let j = 0; j < w; ++j) {
				const c = textures.getPixel(j, i, fontTexture);
				if (c.alpha) fImage[i].push(true);
				else fImage[i].push(false);
			}
		}
		super(h, w, fImage, offset);
		this.textures = textures;
	}
	loadImageFrom(
		from: string,
		handle: string = uuid(),
		r = 0,
		g = 0,
		b = 0,
		a = 255
	) {
		let image = this.getImage(from);
		if (image.length) {
			const h = image.length,
				w = image[0].length;
			let newTexture = this.textures.createCanvas(handle, w, h);
			let context = newTexture.getContext();
			// let tex = this.textures.get("menu_pastet").getDataSourceImage();
			// let im = new Image();
			// im.src = "assets/images/menu_paste.png";

			// context.drawImage(im, 0, 0);

			let pixels = context.getImageData(0, 0, w, h);
			for (let i = 0; i < h; ++i) {
				for (let j = 0; j < w; ++j) {
					pixels.data[4 * (i * w + j) + 0] = r;
					pixels.data[4 * (i * w + j) + 1] = g;
					pixels.data[4 * (i * w + j) + 2] = b;
					pixels.data[4 * (i * w + j) + 3] = image[i][j] ? a : 0;
				}
			}

			context.putImageData(pixels, 0, 0);
			newTexture.refresh();
		} else {
			throw new Error("bu");
		}
	}
}
