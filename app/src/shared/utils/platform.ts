export type Platform = 'mac' | 'windows' | 'linux';

export function getPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac')) return 'mac';
  if (ua.includes('win')) return 'windows';
  return 'linux';
}

export function isMac(): boolean {
  return getPlatform() === 'mac';
}

export function isWindows(): boolean {
  return getPlatform() === 'windows';
}

export function isLinux(): boolean {
  return getPlatform() === 'linux';
}

export function getModKey(): string {
  return isMac() ? '⌘' : 'Ctrl';
}

export function getAltKey(): string {
  return isMac() ? '⌥' : 'Alt';
}

export function getShiftKey(): string {
  return '⇧';
}
