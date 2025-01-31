/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import * as assert from 'assert'
import { getLanguageService, JSONDocument, TextDocument } from '../service'

function toDocument(text: string): { textDoc: TextDocument; jsonDoc: JSONDocument } {
  const textDoc = TextDocument.create('foo://bar/file.asl', 'json', 0, text)

  const ls = getLanguageService({})
  const jsonDoc = ls.parseJSONDocument(textDoc) as JSONDocument

  return { textDoc, jsonDoc }
}

describe('JSON Schema Validation for ASL', () => {
  test('JSON Schema Validation works', async () => {
    const { textDoc, jsonDoc } = toDocument('{}')

    const ls = getLanguageService({})
    const res = await ls.doValidation(textDoc, jsonDoc)
    assert.strictEqual(res.length, 2)
    assert.ok(res.some((item) => item.message === 'Missing property "States".'))
    assert.ok(res.some((item) => item.message === 'Missing property "StartAt".'))
  })
})
