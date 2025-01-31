/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */
import { Asl, VARIABLE_PREFIX } from '../asl-utils'
import {
  ASTNode,
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  Range,
  TextDocument,
  TextEdit,
} from 'vscode-json-languageservice'
import { LANGUAGE_IDS } from '../constants/constants'
import { CompleteStateNameOptions, isPropertyNode, isStringNode } from '../utils/astUtilityFunctions'
import { getVariableCompletions } from './utils/variableUtils'

function getCompletionList(
  prefix: string,
  items: string[],
  replaceRange: Range,
  languageId: string,
  options: CompleteStateNameOptions,
) {
  const { shouldAddLeftQuote, shouldAddRightQuote, shouldAddLeadingSpace, shoudlAddTrailingComma } = options

  const list: CompletionList = {
    isIncomplete: false,
    items: items.map((name) => {
      const item = CompletionItem.create(name)
      item.commitCharacters = [',']

      item.kind = CompletionItemKind.Variable
      const completeVal = (prefix ? `${VARIABLE_PREFIX}${prefix}.` : '') + name

      const newText =
        (shouldAddLeadingSpace ? ' ' : '') +
        (shouldAddLeftQuote ? '"' : '') +
        completeVal +
        (shouldAddRightQuote ? '"' : '') +
        (shoudlAddTrailingComma ? ',' : '')
      item.textEdit = TextEdit.replace(replaceRange, newText)
      item.filterText = completeVal
      item.label = name

      return item
    }),
  }

  return list
}

export default function completeVariables(
  node: ASTNode | undefined,
  offset: number,
  document: TextDocument,
  asl: Asl,
): CompletionList | undefined {
  if (!node || document.languageId === LANGUAGE_IDS.YAML) {
    return
  }

  const variableCompletions = getVariableCompletions(node, node.value?.toString(), asl)
  if (!variableCompletions) {
    return
  }

  const { varList, completionList } = variableCompletions

  if (isPropertyNode(node) && node.colonOffset) {
    if (varList.length) {
      const colonPosition = document.positionAt(node.colonOffset + 1)
      let endPosition = document.positionAt(node.offset + node.length)

      // The range shouldn't span multiple lines, if lines are different it is due to
      // lack of comma and text should be inserted in place
      if (colonPosition.line !== endPosition.line) {
        endPosition = colonPosition
      }

      const range = Range.create(colonPosition, endPosition)

      const completeOptions = {
        shouldAddLeftQuote: true,
        shouldAddRightQuote: true,
        shouldAddLeadingSpace: true,
        shoudlAddTrailingComma: false,
      }

      return getCompletionList(completionList.parentPath, varList, range, document.languageId, completeOptions)
    }
  }

  // For string nodes that have a parent that is a property node
  if (node && node.parent && isPropertyNode(node.parent)) {
    const isValueNode = node.parent.valueNode?.offset === node.offset
    if (isStringNode(node) && isValueNode) {
      if (varList.length) {
        // Text edit will only work when start position is higher than the node offset
        const startPosition = document.positionAt(node.offset + 1)
        const endPosition = document.positionAt(node.offset + node.length - 1)

        const range = Range.create(startPosition, endPosition)

        const completeStateNameOptions = {
          shouldAddLeftQuote: false,
          shouldAddRightQuote: false,
          shouldAddLeadingSpace: false,
          shoudlAddTrailingComma: false,
        }
        return getCompletionList(
          completionList.parentPath,
          varList,
          range,
          document.languageId,
          completeStateNameOptions,
        )
      }
    }
  }
}
