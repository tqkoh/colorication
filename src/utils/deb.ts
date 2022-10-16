export default function deb(...s: any[]) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(...s);
  }
}

export function log(level: number, ...s: any[]) {
  if (level <= import.meta.env.VITE_LOG_LEVEL) {
    deb(level, ...s);
  }
}
