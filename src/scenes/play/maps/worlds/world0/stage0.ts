import Term from "../../../../../utils/subst";
import { Square, squaresFrom, Stage, Test } from "../../../map";

export class Stage0 implements Stage {
	tests: Test[];
	terms: Term[];
	constructor() {
		this.tests = [];
		this.terms = [];
	}
	init(): Square[][] {
		return squaresFrom(this);
	}
}
