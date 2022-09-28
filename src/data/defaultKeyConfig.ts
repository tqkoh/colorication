export interface KeyConfig {
	Enter: number[];
}

export const defaultKeyConfig: KeyConfig = {
	Enter: [Phaser.Input.Keyboard.KeyCodes.ENTER],
};
