export class Font {
	h: number;
	offset: number;
	data: boolean[][][];
	constructor(h: number, w: number, fImage: boolean[][], offset: number = 0) {
		this.h = h - 1;
		this.offset = offset;
		this.data = [];
		{
			let jCur = 0;
			while (jCur < w) {
				while (jCur < w && !fImage[this.h][jCur]) ++jCur;
				let letter: boolean[][] = [];
				for (let i = 0; i < h; ++i) {
					letter.push([]);
				}
				while (jCur < w && fImage[this.h][jCur]) {
					for (let i = 0; i < this.h; ++i) {
						letter[i].push(fImage[i][jCur]);
					}
					++jCur;
				}
				this.data.push(letter);
				letter = [];
			}
		}
	}
	getImage(from: string): boolean[][] {
		let ret: boolean[][] = [];
		for (let i = 0; i < this.h; ++i) {
			ret.push([]);
		}
		for (let k = 0; k < from.length; ++k) {
			const letter = this.data[from.charCodeAt(k) - this.offset]; // ref
			for (let i = 0; i < this.h; ++i) {
				for (let j = 0; j < letter[0].length; ++j) {
					ret[i].push(letter[i][j]);
				}
			}
		}
		return ret;
	}
}
