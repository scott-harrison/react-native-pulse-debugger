export function generateUUID(): string {
    // Generate 16 random bytes
    const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));

    // Set version (4) and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1

    // Convert to hex string
    const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');

    // Format as UUID
    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20, 32),
    ].join('-');
}
