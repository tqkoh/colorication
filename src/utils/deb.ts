function deb(...s: any[]) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(s)
  }
}

export default deb
