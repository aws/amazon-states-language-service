
module.exports = {
	extends: [
	  'eslint:recommended',
	  'plugin:@typescript-eslint/eslint-recommended',
	  'plugin:@typescript-eslint/recommended',
	],
	plugins: ['@typescript-eslint'],
   
	rules: {
	  "@typescript-eslint/return-await": 'off',
	  "@typescript-eslint/no-inferrable-types": 'warn',
	  "@typescript-eslint/no-explicit-any": 'warn',
	  'no-console': 'warn',
	  'prefer-const': 'warn',
	  'no-useless-escape': 'warn'
	},
	ignorePatterns: ['*.js', '*.d.ts', 'node_modules/'],
}