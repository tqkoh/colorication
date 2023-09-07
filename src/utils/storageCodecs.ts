import { KeyConfig } from '../data/keyConfig';
import { Codec } from './typedStorage';

export const stringCodec: Codec<string> = {
  encode: (s: string) => s,
  decode: (s: string) => s
};

export const numberCodec: Codec<number> = {
  encode: (n: number) => n.toString(),
  decode: (s: string) => {
    const n = Number(s);
    if (Number.isNaN(n)) {
      throw new Error('input is not decodable as number');
    }
    return n;
  }
};

export const keyConfigCodec: Codec<KeyConfig> = {
  encode: (k: KeyConfig) => JSON.stringify(k),
  decode: (s: string) => JSON.parse(s) as KeyConfig
};

export const progressCodec: Codec<boolean[]> = {
  encode: (p: boolean[]) => JSON.stringify(p),
  decode: (s: string) => JSON.parse(s) as boolean[]
};
