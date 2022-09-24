import Phaser from "phaser";
import { t } from "../utils/subst";

class Title extends Phaser.Scene {
	constructor() {
		super({ key: "title" });
	}

	preload() {
		console.log(t);
	}

	create() {}

	update() {}
}

export default Title;
