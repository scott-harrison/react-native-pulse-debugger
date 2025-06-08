module.exports = {
	extends: ['../../.eslintrc.js'],
	plugins: ['react-native'],
	extends: ['plugin:react-native/all'],
	env: {
		'react-native/react-native': true,
	},
	settings: {
		'react-native/style-sheet-object-names': ['StyleSheet', 'ViewStyle', 'TextStyle', 'ImageStyle'],
	},
	rules: {
		'react-native/no-inline-styles': 'warn',
		'react-native/no-color-literals': 'warn',
		'react-native/no-raw-text': 'off',
	},
};
