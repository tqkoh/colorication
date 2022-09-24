class Var {
	n: number;
	constructor(n: number) {
		this.n = n;
	}
}
class App {
	t1: Term;
	t2: Term;
	constructor(t1: Term, t2: Term) {
		this.t1 = t1;
		this.t2 = t2;
	}
}
class Lam {
	p: number;
	t: Term;
	constructor(p: number, t: Term) {
		this.p = p;
		this.t = t;
	}
}

type Term = Var | App | Lam;

const t: Term = new App(new Lam(0, new Var(0)), new Var(1));

export default Term;
