/* eslint-disable no-unused-vars */
// https://zenn.dev/jiftechnify/articles/2489f4103918a2

/** Storageの基本機能を抽象したI/F */
export interface BaseStorageIF {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

/** 型Tの値と文字列との間の相互変換方法を規定するオブジェクトのI/F */
export interface Codec<T> {
  encode: (t: T) => string;
  decode: (s: string) => T;
}

/** キーと、それに紐つく値を処理するCodecの対応関係の型 */
type StorageCodecSpec = Record<string, Codec<any>>;

/** StorageCodecをとり、利用可能なキーの集合をunion型として返す型関数 */
type StorageKeys<Spec extends StorageCodecSpec> = {
  [K in keyof Spec]: K extends string ? K : never;
}[keyof Spec];

/** StorageCodecと1つのキーをとり、そのキーに紐つく値の型を返す型関数 */
type StorageValTypeOf<
  Spec extends StorageCodecSpec,
  K extends StorageKeys<Spec>
> = Spec[K] extends Codec<infer T> ? T : never;

/** 型安全StorageラッパーのAPI */
export interface TypedStorage<Spec extends StorageCodecSpec> {
  get<K extends StorageKeys<Spec>>(key: K): StorageValTypeOf<Spec, K> | null;
  set<K extends StorageKeys<Spec>>(
    key: K,
    value: StorageValTypeOf<Spec, K>
  ): void;
  remove(key: StorageKeys<Spec>): void;
}

/** 型安全Storageラッパーのコンストラクタ */
export const createTypedStorage = <Spec extends StorageCodecSpec>(
  spec: Spec,
  baseStorage: BaseStorageIF
): TypedStorage<Spec> => {
  const keyToCodec = spec;
  const baseStrg = baseStorage;

  return Object.freeze({
    get<K extends StorageKeys<Spec>>(key: K): StorageValTypeOf<Spec, K> | null {
      const rawVal = baseStrg.get(key);
      if (rawVal === null) {
        return null;
      }
      const codec = keyToCodec[key] as Codec<StorageValTypeOf<Spec, K>>;
      return codec.decode(rawVal);
    },
    set<K extends StorageKeys<Spec>>(
      key: K,
      value: StorageValTypeOf<Spec, K>
    ): void {
      const codec = keyToCodec[key] as Codec<StorageValTypeOf<Spec, K>>;
      const encoded = codec.encode(value);
      baseStrg.set(key, encoded);
    },
    remove(key: StorageKeys<Spec>): void {
      baseStrg.remove(key);
    }
  });
};

export class BaseStorage implements BaseStorageIF {
  s: Storage;

  constructor(storage: Storage) {
    this.s = storage;
  }

  get(key: string): string | null {
    return this.s.getItem(key);
  }

  set(key: string, value: string): void {
    this.s.setItem(key, value);
  }

  remove(key: string): void {
    this.s.removeItem(key);
  }
}
