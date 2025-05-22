import { generateUuid } from './generateUUID';

// Mock crypto for predictable tests
const mockRandomValues = jest.fn();
global.crypto = {
  getRandomValues: mockRandomValues,
} as unknown as Crypto;

describe('generateUuid', () => {
  beforeEach(() => {
    // Reset mock before each test
    mockRandomValues.mockReset();
  });

  it('should generate a valid UUID v4 string', () => {
    // Mock random values for predictable UUID
    mockRandomValues.mockImplementation((bytes: Uint8Array) => {
      // Fill with predictable values
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = i;
      }
    });

    const uuid = generateUuid();

    // Check the format: 8-4-4-4-12 hex characters
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );

    // With our predictable mock values, we should get this exact UUID
    expect(uuid).toBe('00010203-0405-4607-8809-0a0b0c0d0e0f');

    // Verify version (v4) and variant fields are correctly set
    const parts = uuid.split('-');
    const version = parts[2]!.charAt(0); // First character of the third group
    expect(version).toBe('4'); // Should be version 4

    // Variant should be 10xx (8, 9, a, or b)
    const variant = parts[3]!.charAt(0); // First character of the fourth group
    expect(['8', '9', 'a', 'b'].includes(variant)).toBe(true);
  });

  it('should generate unique UUIDs on each call', () => {
    // Setup mock to return different values on each call
    let callCount = 0;
    mockRandomValues.mockImplementation((bytes: Uint8Array) => {
      // Generate different values for each call
      const base = callCount * 16;
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = base + i;
      }
      callCount++;
    });

    const uuid1 = generateUuid();
    const uuid2 = generateUuid();

    expect(uuid1).not.toBe(uuid2);
    expect(mockRandomValues).toHaveBeenCalledTimes(2);
  });

  it('should maintain the version and variant fields', () => {
    // Create mock that sets all bytes to 0xFF
    mockRandomValues.mockImplementation((bytes: Uint8Array) => {
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = 0xff; // All bits set to 1
      }
    });

    const uuid = generateUuid();

    // Even with all 1s, version field (6th byte) should be masked and set to version 4
    const parts = uuid.split('-');
    expect(parts[2]!.charAt(0)).toBe('4'); // Version field (first digit of third group)

    // Variant field (8th byte) should be masked to 10xx (8, 9, a, or b)
    const variant = parts[3]!.charAt(0); // First digit of fourth group
    expect(['8', '9', 'a', 'b'].includes(variant)).toBe(true);
  });
});
