// The terminals' two shells: bash on macOS, PowerShell on Windows. Paths are written once, the macOS way.

const WINDOWS_HOME = 'C:\\Users\\kieron';

/** "~/projects/overhead" as Windows has it: "C:\Users\kieron\projects\overhead" */
export const winPath = (path: string) => path.replace(/^~/, WINDOWS_HOME).replaceAll('/', '\\');

/** A macOS title bar's "kieron@portfolio:~/code" as a Windows tab's "C:\Users\kieron\code" */
export function winTitle(title: string) {
  const at = title.indexOf(':');
  return at < 0 ? title : winPath(title.slice(at + 1));
}
