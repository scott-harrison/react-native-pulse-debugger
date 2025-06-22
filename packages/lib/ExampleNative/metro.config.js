const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../../..');

const config = {
	projectRoot,
	watchFolders: [
		path.resolve(projectRoot, 'node_modules'),
		path.resolve(workspaceRoot, 'packages/lib'),
		path.resolve(workspaceRoot, 'packages/types'),
		path.resolve(workspaceRoot, 'packages/utils'),
		workspaceRoot,
	],
	resolver: {
		extraNodeModules: {
			'react-native-device-info': path.resolve(
				projectRoot,
				'node_modules/react-native-device-info',
			),
			'@react-native-pulse-debugger/lib': path.resolve(
				workspaceRoot,
				'packages/lib',
			),
			'@react-native-pulse-debugger/types': path.resolve(
				workspaceRoot,
				'packages/types',
			),
			'@react-native-pulse-debugger/utils': path.resolve(
				workspaceRoot,
				'packages/utils',
			),
		},
	},
	server: {
		enhanceMiddleware: middleware => {
			const pulseDebuggerMiddleware = require('@react-native-pulse-debugger/lib/metro-middleware');
			return (req, res, next) => {
				pulseDebuggerMiddleware(req, res, next);
				return middleware(req, res, next);
			};
		},
	},
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
