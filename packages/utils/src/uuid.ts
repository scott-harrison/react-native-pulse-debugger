/**
 * Generates a random UUID v4
 * @returns {string} A random UUID v4 string
 */
export const generateUUID = (): string => {
    // Create a buffer of 16 bytes (128 bits)
    const buffer = new Uint8Array(16);

    // Fill with random values
    crypto.getRandomValues(buffer);

    // Set version (4) and variant bits
    buffer[6] = (buffer[6] & 0x0f) | 0x40; // version 4
    buffer[8] = (buffer[8] & 0x3f) | 0x80; // variant 1

    // Convert to hex string
    const hex = Array.from(buffer)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    // Format as UUID
    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20, 32),
    ].join('-');
};
