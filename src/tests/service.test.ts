/*!
 * Copyright 2025 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import * as service from '../service'

describe('Service', () => {
  test('Should expoert JSON and YAML services in GitHub environment', async () => {
    const namedExports = Object.keys(service)
    expect(namedExports).toContain('getLanguageService')
    expect(namedExports).toContain('doCompleteAsl')

    if (process.env.YAML_SERVICE !== 'disabled') {
      expect(namedExports).toContain('getYamlLanguageService')
    }
  })
})
