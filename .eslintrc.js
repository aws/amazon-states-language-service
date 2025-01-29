/*!
 * Copyright 2025 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

module.exports = {
	extends: [
	  'eslint:recommended',
	  'plugin:@typescript-eslint/eslint-recommended',
	  'plugin:@typescript-eslint/recommended',
	],
	plugins: ['@typescript-eslint'],
  
	rules: {
	  '@typescript-eslint/no-explicit-any': 'off',
	  'no-console': 'warn',
	  '@typescript-eslint/no-unused-vars': [
		'warn',
		{
		  caughtErrors: 'none',
		  argsIgnorePattern: '^_',
		},
	  ],
	  '@typescript-eslint/no-unused-expressions': [
		'error',
		{
		  allowShortCircuit: true,
		  allowTernary: true,
		},
	  ],
	},
	ignorePatterns: ['*.js', '*.d.ts', 'node_modules/', 'src/tests/yaml-strings', 'src/tests/json-strings'],
  }
  