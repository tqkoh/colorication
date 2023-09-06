// 能力 ステージをクリアしていくと解放される
export class Skills {
  // square に入れる
  enterTerm: boolean = false;

  // 数字を見れる
  seeNumber: boolean = false;

  init(mode: 'puzzle' | 'sandbox') {
    if (mode === 'puzzle') {
      this.enterTerm = false;
      this.seeNumber = false;
    } else if (mode === 'sandbox') {
      this.enterTerm = true;
      this.seeNumber = true;
    }
  }
}

export const skills = new Skills();
