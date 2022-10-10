export function korenani() {
	let a: { info: { name?: string } }[][] = [[{ info: {} }, { info: {} }]];

	let bu = { name: "bu" };
	a[0][0].info = bu;
	let rage = { name: "rage" };
	a[0][1].info = rage;
	console.log(a[0][0].info);
}
