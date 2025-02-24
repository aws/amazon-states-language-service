/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import { LanguageService, JSONSchema } from 'vscode-json-languageservice'
import { getLanguageService as getAslYamlLanguageService } from './yaml/aslYamlLanguageService'
import { ASLLanguageServiceParams, getLanguageService } from './jsonLanguageService'
import aslSchema from './json-schema/bundled.json'

const ASL_SCHEMA = aslSchema as JSONSchema

export const getYamlLanguageService = function (params: ASLLanguageServiceParams): LanguageService {
  const aslLanguageService: LanguageService = getLanguageService({
    ...params,
    aslOptions: {
      ignoreColonOffset: true,
    },
  })
  return getAslYamlLanguageService(params, ASL_SCHEMA, aslLanguageService)
}
