import { KeyConfig } from '../data/keyConfig';
import Term from './term';
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

export const progressCodec: Codec<(Term | undefined)[]> = {
  encode: (p: (Term | undefined)[]) => JSON.stringify(p),
  decode: (s: string) => {
    const a = [...Object.values(JSON.parse(s))] as (Term | undefined | null)[];
    return a.map((t) => (t === null ? undefined : t));
  }
};
