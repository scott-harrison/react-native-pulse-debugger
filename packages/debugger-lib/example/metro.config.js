const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../../..');

const config = getDefaultConfig(projectRoot);

// Add workspace roots to watchFolders
config.watchFolders = [workspaceRoot];

// Configure extra node_modules resolution roots
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Add workspace packages to extraNodeModules
config.resolver.extraNodeModules = {
  '@pulse/shared-types': path.resolve(workspaceRoot, 'packages/shared-types'),
};

module.exports = config;
