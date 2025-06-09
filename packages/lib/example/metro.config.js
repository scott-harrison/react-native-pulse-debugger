const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../../..'); // Adjust as needed

const config = getDefaultConfig(projectRoot);

config.watchFolders = [path.resolve(workspaceRoot, 'packages/lib'), workspaceRoot];

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@react-native-pulse-debugger/lib': path.resolve(workspaceRoot, 'packages/lib'),
};

module.exports = config;
