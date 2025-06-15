module.exports = {
	extends: ['../../.eslintrc.js'],
	plugins: ['react', 'react-hooks'],
	extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended'],
	env: {
		browser: true,
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
	rules: {
		'react/react-in-jsx-scope': 'off',
		'react/prop-types': 'off',
	},
};
