/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import {
    CompletionList,
    JSONDocument,
    Position,
    TextDocument
} from 'vscode-json-languageservice'

import {
    ASTTree,
    findNodeAtLocation,
} from '../utils/astUtilityFunctions'

import completeSnippets from './completeSnippets'
import completeStateNames from './completeStateNames'

export default function completeAsl(document: TextDocument, position: Position, doc: JSONDocument, jsonCompletions: CompletionList | null, ignoreColonOffset: boolean = false): CompletionList {

    const offset = document.offsetAt(position)
    const rootNode = (doc as ASTTree).root

    if (!rootNode) {
        return {
            isIncomplete: false,
            items: []
        }
    }

    const node = findNodeAtLocation(rootNode, offset)

    const snippetsList = completeSnippets(node)
    let completionList = completeStateNames(node, offset, document, ignoreColonOffset) ?? jsonCompletions

    if (completionList?.items) {
        completionList.items = completionList.items.concat(snippetsList)
    } else {
        completionList = {
            isIncomplete: false,
            items: snippetsList
        }
    }

    // Assign sort order for the completion items so we maintain order
    // and snippets are shown near the end of the completion list
    completionList.items.map((item,index) => ({ ...item, sortText: index.toString()}))

    return completionList
}
