import { generateUUID } from './uuid';

describe('UUID Utils', () => {
    describe('generateUUID', () => {
        it('should generate a valid UUID v4', () => {
            const uuid = generateUUID();

            // UUID v4 format: 8-4-4-4-12 hexadecimal digits
            const uuidRegex =
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

            expect(uuid).toMatch(uuidRegex);
        });

        it('should generate unique UUIDs', () => {
            const uuid1 = generateUUID();
            const uuid2 = generateUUID();

            expect(uuid1).not.toBe(uuid2);
        });

        it('should have correct version and variant bits', () => {
            const uuid = generateUUID();
            const parts = uuid.split('-');

            // Check version (4) in the third group
            expect(parts[2][0]).toBe('4');

            // Check variant bits in the fourth group
            const variantBits = parseInt(parts[3][0], 16);
            expect(variantBits & 0xc).toBe(0x8); // Should have bits 10xx
        });
    });
});
