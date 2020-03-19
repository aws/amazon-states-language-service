/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import {
    ASTNode,
    CompletionItem,
    CompletionItemKind,
    InsertTextFormat,
    ObjectASTNode,
    PropertyASTNode} from 'vscode-json-languageservice'

import {
    findPropChildByName,
    insideStateNode,
    isChildOfStates,
    isObjectNode,
} from '../utils/astUtilityFunctions'

import errorHandlingSnippetsRaw from '../snippets/error_handling.json'
import stateSnippetsRaw from '../snippets/states.json'

interface Snippet {
    name: string,
    body: string[],
    description: string
}

const ERROR_HANDLING_STATES = ['Task', 'Parallel', 'Map']
export const stateSnippets = parseSnippetsFromJson(stateSnippetsRaw)
export const errorHandlingSnippets = parseSnippetsFromJson(errorHandlingSnippetsRaw)

function parseSnippetsFromJson(json: Snippet[]): CompletionItem[] {
    return json.map(snippet => {
        const item = CompletionItem.create(snippet.name)
        item.kind = CompletionItemKind.Snippet
        item.insertTextFormat = InsertTextFormat.Snippet
        item.insertText = snippet.body.join('\n')
        item.documentation = snippet.description

        return item
    })
}

function doesStateSupportErrorHandling(node: ASTNode): boolean {
    let typeNode: PropertyASTNode

    if(isObjectNode(node)) {
        typeNode = findPropChildByName(node, 'Type')
    }

    return ERROR_HANDLING_STATES.includes(typeNode?.valueNode?.value as string)
}

export default function completeSnippets(node: ASTNode | undefined): CompletionItem[] {
    if (node) {
        if (isChildOfStates(node)) {
            return stateSnippets
        }
        if (insideStateNode(node) && doesStateSupportErrorHandling(node)) {
            return errorHandlingSnippets
        }
    }

    return []
}
