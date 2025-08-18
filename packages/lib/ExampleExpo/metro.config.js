const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../../..'); // Adjust as needed

const config = getDefaultConfig(projectRoot);

config.watchFolders = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'packages/lib'),
    path.resolve(workspaceRoot, 'packages/types'),
    path.resolve(workspaceRoot, 'packages/utils'),
    workspaceRoot,
];

config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    'expo-constants': path.resolve(projectRoot, 'node_modules/expo-constants'),
    'expo-device': path.resolve(projectRoot, 'node_modules/expo-device'),
    'expo-application': path.resolve(projectRoot, 'node_modules/expo-application'),
    '@react-native-pulse-debugger/lib': path.resolve(workspaceRoot, 'packages/lib'),
    '@react-native-pulse-debugger/types': path.resolve(workspaceRoot, 'packages/types'),
    '@react-native-pulse-debugger/utils': path.resolve(workspaceRoot, 'packages/utils'),
};

module.exports = config;
