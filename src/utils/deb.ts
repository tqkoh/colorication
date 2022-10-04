export function deb(...s: any[]) {
	if (import.meta.env.DEV) {
		console.log(s);
	}
}
