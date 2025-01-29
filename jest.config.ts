/*!
 * Copyright 2025 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

/** @type {import('ts-jest').JestConfigWithTsJest} */

const transformCodeInPackages = []

module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/src/**/?(*.)+(spec|test).ts'],

  coverageReporters: ['cobertura', 'html', 'text'],
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns: ['^.*/scripts/.*$', '^.*/schema/.*$', '^.*/tests/.*$', 'interface.ts'],
  transformIgnorePatterns: [`<rootDir>/node_modules/(?!${transformCodeInPackages.join('|')}).+\\.js$`],
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
    '^.+\\.(js|jsx)$': [
      'babel-jest',
      {
        presets: ['@babel/preset-env'],
        plugins: [['@babel/transform-runtime']],
      },
    ],
  },
  clearMocks: true,
}
