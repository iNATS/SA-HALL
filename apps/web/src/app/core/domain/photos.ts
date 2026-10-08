import { PhotoName } from './models';

/** Responsive WebP renditions generated at build-asset time (480w and 800w). */
export function photoSrc(name: PhotoName, width: 480 | 800 = 800): string {
  return `/images/${name}-${width}.webp`;
}

export function photoSrcset(name: PhotoName): string {
  return `/images/${name}-480.webp 480w, /images/${name}-800.webp 800w`;
}

/** Secondary gallery shots shown alongside a hall's primary photo. */
export function galleryFor(name: PhotoName): readonly PhotoName[] {
  const all: readonly PhotoName[] = ['stage', 'table', 'lounge', 'arches', 'chandelier', 'florals'];
  return [name, ...all.filter((photo) => photo !== name)].slice(0, 4);
}
