/* eslint-disable no-bitwise */
import 'react-native-get-random-values';

/**
 * Generate a RFC4122-compliant UUID v4 string.
 */
export function generateUuid(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  bytes[6] = (bytes[6]! & 0x0f) | 0x40; // version field
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variant field

  const hex: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    hex.push(bytes[i]!.toString(16).padStart(2, '0'));
  }

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}
