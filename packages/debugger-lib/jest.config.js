module.exports = {
  preset: 'react-native',
  rootDir: __dirname,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^WebSocket$': '<rootDir>/__mocks__/WebSocket.ts',
    '^expo-application$': '<rootDir>/__mocks__/deviceInfo.ts',
    '^expo-constants$': '<rootDir>/__mocks__/deviceInfo.ts',
    '^expo-device$': '<rootDir>/__mocks__/deviceInfo.ts',
    '^react-native-device-info$': '<rootDir>/__mocks__/deviceInfo.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-.*|expo-.*)/)',
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  modulePathIgnorePatterns: [
    '<rootDir>/example/node_modules',
    '<rootDir>/lib/',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  testMatch: ['**/src/**/*.test.ts', '**/src/**/*.test.tsx'],
};
