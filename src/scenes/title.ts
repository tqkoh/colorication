import Phaser from "phaser";
import { s, t } from "../utils/subst";

class Title extends Phaser.Scene {
	constructor() {
		super({ key: "title" });
	}

	preload() {
		console.log(s);
	}

	create() {}

	update() {}
}

export default Title;
