const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../../..'); // Adjust as needed

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
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
