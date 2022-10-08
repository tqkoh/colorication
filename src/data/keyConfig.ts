export interface KeyConfig {
	Enter: number[];
	Ctrl: number[];
	Escape: number[];
	W: number[];
	A: number[];
	S: number[];
	D: number[];
}

const k = Phaser.Input.Keyboard.KeyCodes;

export const defaultKeyConfig: KeyConfig = {
	Enter: [k.ENTER],
	Ctrl: [k.CTRL],
	Escape: [k.ESC],
	W: [k.W, k.UP],
	A: [k.A, k.LEFT],
	S: [k.S, k.DOWN],
	D: [k.D, k.RIGHT],
};

export function keysFrom(
	s: Phaser.Scene,
	keys: number[]
): Phaser.Input.Keyboard.Key[] {
	return keys.map((k: number) => {
		return s.input.keyboard.addKey(k);
	});
}

export function justDown(keys: Phaser.Input.Keyboard.Key[]): boolean {
	return keys
		.map((k: Phaser.Input.Keyboard.Key) =>
			Phaser.Input.Keyboard.JustDown(k)
		)
		.reduce((acc: boolean, e: boolean) => acc || e);
}

export function isDown(keys: Phaser.Input.Keyboard.Key[]): boolean {
	return keys
		.map((k: Phaser.Input.Keyboard.Key) => k.isDown)
		.reduce((acc: boolean, e: boolean) => acc || e);
}
