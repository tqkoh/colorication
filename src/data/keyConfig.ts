import Phaser from 'phaser'

export interface KeyConfig {
  Enter: number[]
  Ctrl: number[]
  Escape: number[]
  W: number[]
  A: number[]
  S: number[]
  D: number[]
  N: number[]
  E: number[]
  C: number[]
  V: number[]
  F2: number[]
  Del: number[]
}

const k = Phaser.Input.Keyboard.KeyCodes

export const defaultKeyConfig: KeyConfig = {
  Enter: [k.ENTER],
  Ctrl: [k.CTRL],
  Escape: [k.ESC],
  W: [k.W, k.UP],
  A: [k.A, k.LEFT],
  S: [k.S, k.DOWN],
  D: [k.D, k.RIGHT],
  N: [k.N],
  E: [k.E],
  C: [k.C],
  V: [k.V],
  F2: [k.F2],
  Del: [k.DELETE]
}

export function keysFrom(
  s: Phaser.Scene,
  keys: number[]
): Phaser.Input.Keyboard.Key[] {
  return keys.map((key: number) => s.input.keyboard.addKey(key))
}

export function justDown(keys: Phaser.Input.Keyboard.Key[]): boolean {
  return keys
    .map((key: Phaser.Input.Keyboard.Key) =>
      Phaser.Input.Keyboard.JustDown(key)
    )
    .reduce((acc: boolean, e: boolean) => acc || e)
}

export function isDown(keys: Phaser.Input.Keyboard.Key[]): boolean {
  return keys
    .map((key: Phaser.Input.Keyboard.Key) => key.isDown)
    .reduce((acc: boolean, e: boolean) => acc || e)
}
