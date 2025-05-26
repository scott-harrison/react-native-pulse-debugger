/**
 * Generates a random UUID v4 string.
 * @returns A UUID v4 string in the format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * @throws Error if crypto API is not available
 */
export function generateUuid(): string {
  // Check if crypto API is available
  if (!crypto || typeof crypto.getRandomValues !== 'function') {
    throw new Error('Crypto API not available');
  }

  // Correct declaration: Uint8Array with no generic type
  const bytes: Uint8Array = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // Set version (4) in byte 6 (bits 0100)
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  // Set variant (10) in byte 8 (bits 10xx)
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  // Convert bytes to hex string with UUID format
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}
