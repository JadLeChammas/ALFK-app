/**
 * Checks a file before it is uploaded: an accepted type (the same lists as the storage buckets,
 * migration 030), 10 MB at most, and contents that really are what the type says — a page or a
 * script renamed « photo.jpg » or « cv.pdf » is refused before it leaves the device.
 */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
export const PROOF_TYPES = [...IMAGE_TYPES, 'application/pdf'];
export const CV_TYPES = ['application/pdf'];
export const ATTACHMENT_TYPES = [
  ...PROOF_TYPES,
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation',
  'text/plain',
  'text/csv',
  'text/calendar',
];

const BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', heic: 'image/heic', heif: 'image/heif',
  pdf: 'application/pdf',
  doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odt: 'application/vnd.oasis.opendocument.text', ods: 'application/vnd.oasis.opendocument.spreadsheet', odp: 'application/vnd.oasis.opendocument.presentation',
  txt: 'text/plain', csv: 'text/csv', ics: 'text/calendar',
};

/** The extension that goes with an accepted type (for the stored file name). */
export const extensionFor = (type: string) => Object.keys(BY_EXTENSION).find((k) => BY_EXTENSION[k] === type && k !== 'jpeg') ?? 'bin';

export class FileRejected extends Error {
  constructor(public reason: 'file_type' | 'file_too_large') {
    super(reason);
  }
}

export const isFileRejected = (e: unknown): e is FileRejected => e instanceof FileRejected;

/** The type the file claims: the declared one, or else the one of its extension (null when not in `allowed`). */
function claimedType(name: string | undefined, declared: string | null | undefined, allowed: string[]): string | null {
  const type = (declared ?? '').toLowerCase().split(';')[0].trim();
  if (allowed.includes(type)) return type;
  const fromName = BY_EXTENSION[(name ?? '').split('.').pop()?.toLowerCase() ?? ''];
  return fromName && allowed.includes(fromName) ? fromName : null;
}

const startsWith = (b: Uint8Array, sig: number[], at = 0) => sig.every((v, i) => b[at + i] === v);
const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.subarray(from, to));

/** Do the first bytes match the type? (« magic numbers ») */
function contentsMatch(type: string, b: Uint8Array): boolean {
  switch (type) {
    case 'image/jpeg':
      return startsWith(b, [0xff, 0xd8, 0xff]);
    case 'image/png':
      return startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'image/gif':
      return ascii(b, 0, 4) === 'GIF8';
    case 'image/webp':
      return ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP';
    case 'image/heic':
    case 'image/heif':
      // An ISO media box « ftyp » with an image brand (a video has the same box with another brand).
      return ascii(b, 4, 8) === 'ftyp' && ['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'hevm', 'hevs', 'mif1', 'msf1'].includes(ascii(b, 8, 12));
    case 'application/pdf':
      // « %PDF » within the first bytes (some scanners write a few bytes before it).
      return ascii(b, 0, Math.min(b.length, 1024)).includes('%PDF-');
    case 'application/msword':
    case 'application/vnd.ms-excel':
    case 'application/vnd.ms-powerpoint':
      return startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    case 'text/plain':
    case 'text/csv':
    case 'text/calendar': {
      // Text only: no binary bytes, and nothing a browser would take for a page (HTML, SVG, XML).
      const head = b.subarray(0, Math.min(b.length, 4096));
      if (head.includes(0)) return false;
      const start = ascii(head, 0, head.length).replace(/^﻿/, '').trimStart().slice(0, 64).toLowerCase();
      return !start.startsWith('<');
    }
    default:
      // Word, Excel, PowerPoint (2007+) and OpenDocument files are zip archives.
      return startsWith(b, [0x50, 0x4b, 0x03, 0x04]);
  }
}

async function firstBytes(body: Blob | ArrayBuffer | Uint8Array, n = 4096): Promise<Uint8Array> {
  if (body instanceof Uint8Array) return body.subarray(0, n);
  if (body instanceof ArrayBuffer) return new Uint8Array(body, 0, Math.min(n, body.byteLength));
  return new Uint8Array(await body.slice(0, n).arrayBuffer());
}

const sizeOf = (body: Blob | ArrayBuffer | Uint8Array) => (body instanceof Blob ? body.size : body.byteLength);

/**
 * Checks a file ready to upload and returns its type (to send as Content-Type).
 * Throws FileRejected('file_type' | 'file_too_large').
 */
export async function checkUpload(body: Blob | ArrayBuffer | Uint8Array, name: string | undefined, declared: string | null | undefined, allowed: string[]): Promise<string> {
  if (sizeOf(body) > MAX_UPLOAD_BYTES) throw new FileRejected('file_too_large');
  const head = await firstBytes(body);
  const claimed = claimedType(name, declared, allowed);
  if (claimed && contentsMatch(claimed, head)) return claimed;
  // A missing or wrong label (renamed file, some phones): the contents decide, when they are of an
  // accepted kind — never text, which only passes under its own name.
  const found = allowed.find((t) => !t.startsWith('text/') && contentsMatch(t, head));
  if (found) return found;
  throw new FileRejected('file_type');
}
