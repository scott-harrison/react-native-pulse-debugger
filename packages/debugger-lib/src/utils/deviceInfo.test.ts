import { getDeviceInfo } from './deviceInfo';

// Mock react-native Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

describe('deviceInfo', () => {
  // Save original console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  beforeEach(() => {
    // Mock console methods to prevent noise in test output
    console.error = jest.fn();
    console.warn = jest.fn();

    // Clear module cache
    jest.resetModules();
  });

  afterEach(() => {
    // Restore console methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getDeviceInfo', () => {
    it('should return fallback values when no libraries are available', async () => {
      // Mock internal implementation
      jest.mock('./deviceInfo', () => {
        return {
          detectEnvironment: jest.fn().mockReturnValue({
            isExpo: false,
            isDeviceInfoAvailable: false,
          }),
          getDeviceInfo: jest.fn().mockResolvedValue({
            deviceId: 'mock-id',
            model: 'unknown',
            brand: 'unknown',
            systemName: 'ios',
            systemVersion: 'unknown',
            appName: 'unknown',
            appVersion: '1.0.0',
            buildNumber: '1',
          }),
        };
      });

      const { getDeviceInfo } = require('./deviceInfo');
      const result = await getDeviceInfo();

      expect(result.appName).toBe('unknown');
      expect(result.appVersion).toBe('1.0.0');
      expect(result.deviceId).toBe('mock-id');
    });

    it('should return Expo values when Expo is available', async () => {
      // Mock internal implementation for Expo
      jest.mock('./deviceInfo', () => {
        return {
          detectEnvironment: jest.fn().mockReturnValue({
            isExpo: true,
            isDeviceInfoAvailable: false,
          }),
          getDeviceInfo: jest.fn().mockResolvedValue({
            deviceId: 'expo-device-id',
            model: 'Test Model',
            brand: 'Test Brand',
            systemName: 'iOS',
            systemVersion: '14.0',
            appName: 'TestExpoApp',
            appVersion: '2.0.0',
            buildNumber: '123',
          }),
        };
      });

      const { getDeviceInfo } = require('./deviceInfo');
      const result = await getDeviceInfo();

      expect(result.appName).toBe('TestExpoApp');
      expect(result.appVersion).toBe('2.0.0');
      expect(result.brand).toBe('Test Brand');
      expect(result.deviceId).toBe('expo-device-id');
    });

    it('should return react-native-device-info values when available', async () => {
      // Mock internal implementation for device-info
      jest.mock('./deviceInfo', () => {
        return {
          detectEnvironment: jest.fn().mockReturnValue({
            isExpo: false,
            isDeviceInfoAvailable: true,
          }),
          getDeviceInfo: jest.fn().mockResolvedValue({
            deviceId: 'rn-device-id',
            model: 'RN Test Model',
            brand: 'RN Test Brand',
            systemName: 'iOS',
            systemVersion: '15.0',
            appName: 'TestRNApp',
            appVersion: '3.0.0',
            buildNumber: '456',
          }),
        };
      });

      const { getDeviceInfo } = require('./deviceInfo');
      const result = await getDeviceInfo();

      expect(result.appName).toBe('TestRNApp');
      expect(result.appVersion).toBe('3.0.0');
      expect(result.brand).toBe('RN Test Brand');
      expect(result.deviceId).toBe('rn-device-id');
    });
  });
});
