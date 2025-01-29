/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import { InsertReplaceEdit, TextEdit } from 'vscode-languageserver-types'
import { FILE_EXTENSIONS, LANGUAGE_IDS } from '../../constants/constants'
import { getLanguageService, JSONDocument, TextDocument } from '../../service'

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
