module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/*.test.ts'],
    transformIgnorePatterns: [
        'node_modules/(?!(@react-native-pulse-debugger|react-native|@react-native)/)',
    ],
    moduleNameMapper: {
        '^@react-native-pulse-debugger/(.*)$': '<rootDir>/../$1/src',
        '^react-native$': '<rootDir>/src/__mocks__/react-native.ts',
    },
    moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
};
