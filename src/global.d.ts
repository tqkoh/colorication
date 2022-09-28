import { KeyConfig } from "./data/defaultKeyConfig";
import { Codec, TypedStorage } from "./utils/typedStorage";

declare global {
	var storage: TypedStorage<{
		keyConfig: Codec<KeyConfig>;
	}>;
	var keyConfig: KeyConfig;
}
