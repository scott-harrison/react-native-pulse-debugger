/** @type {import('jest').Config} */
module.exports = {
	preset: 'ts-jest/presets/js-with-ts-esm', // Use ESM preset for better React 19 compatibility
	testEnvironment: 'jsdom',
	testMatch: ['<rootDir>/src/**/*.(test|spec).(ts|tsx)'],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'^@pulse/shared-types$': '<rootDir>/../shared-types/src',
		'^@pulse/shared-types/(.*)$': '<rootDir>/../shared-types/src/$1',
		'\\.(css|less|scss|sass)$': 'identity-obj-proxy',
		'^react$': require.resolve('react'),
		'^react-dom$': require.resolve('react-dom'),
		'^@testing-library/react$': require.resolve('@testing-library/react'),
	},
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	testPathIgnorePatterns: ['/node_modules/', '/public/'],
	collectCoverage: true,
	collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/**/*.spec.{ts,tsx}'],
	coverageDirectory: '<rootDir>/coverage',
	coverageReporters: ['text', 'lcov'],
	testTimeout: 15000,
	transform: {
		'^.+\\.(ts|tsx)$': [
			'ts-jest',
			{
				tsconfig: '<rootDir>/tsconfig.json',
				useESM: true, // Enable ES modules for React 19
			},
		],
	},
};
