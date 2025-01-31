/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import { CompletionList, JSONDocument, Position, TextDocument } from 'vscode-json-languageservice'
import { buildPreviousStatesMap, Asl, QueryLanguages } from '../asl-utils'
import { ASLOptions, ASTTree, findNodeAtLocation, getStateInfo } from '../utils/astUtilityFunctions'
import completeSnippets from './completeSnippets'
import completeStateNames from './completeStateNames'
import completeVariables from './completeVariables'
import completeJSONata from './completeJSONata'
import { LANGUAGE_IDS } from '../constants/constants'

let asl: Asl = {}

export default async function completeAsl(
  document: TextDocument,
  position: Position,
  doc: JSONDocument,
  jsonCompletions: CompletionList | null,
  aslOptions?: ASLOptions,
): Promise<CompletionList> {
  const offset = document.offsetAt(position)
  const rootNode = (doc as ASTTree).root

  if (!rootNode) {
    return {
      isIncomplete: false,
      items: [],
    }
  }

  const node = findNodeAtLocation(rootNode, offset)

  const snippetsList = completeSnippets(node, offset, aslOptions)
  let completionList = completeStateNames(node, offset, document, aslOptions) ?? jsonCompletions

  if (completionList?.items) {
    completionList.items = completionList.items.concat(snippetsList)
  } else {
    completionList = {
      isIncomplete: false,
      items: snippetsList,
    }
  }

  if (document.languageId === LANGUAGE_IDS.JSON) {
    const text = document.getText()
    // we are using the last valid asl for autocompletion list generation
    // skip to store asl when it is invalid
    try {
      asl = JSON.parse(text)
    } catch (_err) {
      // noop
    }

    // prepare dynamic variable list
    buildPreviousStatesMap(asl)
  }

  const { queryLanguage } = (node && getStateInfo(node)) || {}
  const isJSONataState = queryLanguage === QueryLanguages.JSONata || asl.QueryLanguage === QueryLanguages.JSONata

  if (isJSONataState) {
    const jsonataList = await completeJSONata(node, offset, document, asl)

    if (jsonataList?.items) {
      completionList.items = completionList.items.concat(jsonataList.items)
    }
  } else {
    const variableList = completeVariables(node, offset, document, asl)

    if (variableList?.items) {
      completionList.items = completionList.items.concat(variableList.items)
    }
  }

  // Assign sort order for the completion items so we maintain order
  // and snippets are shown near the end of the completion list
  completionList.items.map((item, index) => ({ ...item, sortText: index.toString() }))

  return completionList
}
