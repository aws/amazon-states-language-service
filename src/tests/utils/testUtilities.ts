/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import * as assert from 'assert'
import { InsertReplaceEdit, TextEdit } from 'vscode-languageserver-types'
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { FILE_EXTENSIONS, LANGUAGE_IDS } from '../../constants/constants'
import {
  getLanguageService,
  JSONDocument,
  TextDocument,
  ASLLanguageServiceParams,
  Position,
  Range,
} from '../../service'

export function toDocument(text: string, isYaml?: boolean): { textDoc: TextDocument; jsonDoc: JSONDocument } {
  const textDoc = TextDocument.create(
    `foo://bar/file.${isYaml ? FILE_EXTENSIONS.YAML : FILE_EXTENSIONS.JSON}`,
    isYaml ? LANGUAGE_IDS.YAML : LANGUAGE_IDS.JSON,
    0,
    text,
  )

  const ls = getLanguageService({})
  const jsonDoc = ls.parseJSONDocument(textDoc) as JSONDocument

  return { textDoc, jsonDoc }
}

export function asTextEdit(item: TextEdit | InsertReplaceEdit | undefined): TextEdit | undefined {
  if (TextEdit.is(item)) {
    return item
  }

  return undefined
}

export interface TestValidationOptions {
  json: string
  diagnostics: {
    message: string
    start: [number, number]
    end: [number, number]
    code?: string | number | undefined
  }[]
  filterMessages?: string[]
}

export async function getValidations(json: string, params: ASLLanguageServiceParams = {}) {
  const { textDoc, jsonDoc } = toDocument(json)
  const ls = getLanguageService(params)

  return await ls.doValidation(textDoc, jsonDoc)
}

export async function testValidations(options: TestValidationOptions, params: ASLLanguageServiceParams = {}) {
  const { json, diagnostics, filterMessages } = options

  let res = await getValidations(json, params)

  res = res.filter((diagnostic) => {
    if (filterMessages && filterMessages.find((message) => message === diagnostic.message)) {
      return false
    }

    return true
  })

  assert.strictEqual(res.length, diagnostics.length)

  res.forEach((item, index) => {
    const leftPos = Position.create(...diagnostics[index].start)
    const rightPos = Position.create(...diagnostics[index].end)

    const diagnostic = Diagnostic.create(
      Range.create(leftPos, rightPos),
      diagnostics[index].message,
      DiagnosticSeverity.Error,
      diagnostics[index].code,
    )

    assert.deepStrictEqual(item, diagnostic)
  })
}
