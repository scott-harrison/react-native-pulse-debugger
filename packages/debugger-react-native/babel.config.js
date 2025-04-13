module.exports = {
  presets: ['module:react-native-builder-bob/babel-preset'],
  plugins: [
    [
      '@babel/plugin-transform-runtime',
      {
        helpers: true,
        regenerator: true,
      },
    ],
  ],
};
