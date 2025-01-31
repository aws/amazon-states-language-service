/*!
 * Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */
import {
  Asl,
  VARIABLE_PREFIX,
  JSONATA_TEMPLATE_WRAPPER,
  getFunctionArguments,
  JSONataASTResult,
  JsonataFunctionsMap,
} from '../asl-utils'
import {
  ASTNode,
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  Position,
  Range,
  TextDocument,
  TextEdit,
} from 'vscode-json-languageservice'
import { LANGUAGE_IDS } from '../constants/constants'
import { getStateInfo, isPropertyNode, isStringNode } from '../utils/astUtilityFunctions'
import { getVariableCompletions } from './utils/variableUtils'
import { getJSONataNodeData } from './utils/jsonataUtils'

interface FunctionCompletionProperties {
  jsonataNode: JSONataASTResult
  node: ASTNode
  asl: Asl
  nodePosition: Position
  endPosition: Position
}

/**
 * Generates completion list for variables
 * @returns
 */
function getVariablesCompletionList({
  node,
  value,
  asl,
  replaceRange,
}: {
  node: ASTNode
  value: string
  asl: Asl
  replaceRange: Range
}) {
  const variableCompletions = getVariableCompletions(node, value, asl)
  return (
    variableCompletions?.varList.map((name) => {
      const item = CompletionItem.create(name)
      item.commitCharacters = ['.']

      item.kind = CompletionItemKind.Variable
      const prefix = variableCompletions.completionList.parentPath
      const completeVal = (prefix ? `${VARIABLE_PREFIX}${prefix}.` : '') + name

      item.textEdit = TextEdit.replace(replaceRange, completeVal)
      item.filterText = completeVal
      item.label = name

      return item
    }) || []
  )
}

/**
 * Generate completion list for partial paths such as `$states.cont`
 * @returns CompletionList if a partial path exists, otherwise undefined
 */
function getPartialPathCompletion({
  jsonataNode,
  node,
  asl,
  nodePosition,
  endPosition,
}: FunctionCompletionProperties): CompletionList | undefined {
  const isJsonataPathNode = jsonataNode.node.type === 'name' && jsonataNode.node.position && jsonataNode.node.value

  const isParentNodePath = jsonataNode.parent?.type === 'path'
  const parentPath = jsonataNode.parent?.steps

  if (isJsonataPathNode && isParentNodePath && parentPath) {
    const parentPathKey: string = parentPath
      .map((step) => step.value)
      .filter((value) => typeof value === 'string' && value)
      .join('.')

    const range = Range.create(
      Position.create(nodePosition.line, endPosition.character - parentPathKey.length),
      endPosition,
    )
    return {
      isIncomplete: true,
      items: getVariablesCompletionList({
        node,
        value: parentPathKey,
        asl,
        replaceRange: range,
      }),
    }
  }
}

/**
 * Generate completion list for incomplete paths such as `$states.`
 * @returns CompletionList if an incomplete path exists, otherwise undefined
 */
function getIncompletePathCompletion({
  jsonataNode,
  nodePosition,
  endPosition,
  node,
  asl,
}: FunctionCompletionProperties): CompletionList | undefined {
  const isErrorNode = jsonataNode.node.type === 'error' && jsonataNode.node.error && jsonataNode.node.error.position

  const isParentNodePath = jsonataNode.parent?.type === 'path'
  const parentPath = jsonataNode.parent?.steps
  if (isErrorNode && isParentNodePath && parentPath) {
    const parentPathKey: string =
      parentPath
        .map((step) => step.value)
        .filter((value) => typeof value === 'string' && value)
        .join('.') + '.'

    const range = Range.create(
      Position.create(nodePosition.line, endPosition.character - parentPathKey.length),
      endPosition,
    )

    return {
      isIncomplete: true,
      items: getVariablesCompletionList({
        node,
        value: parentPathKey,
        asl,
        replaceRange: range,
      }),
    }
  }
}

/**
 * Generate completion list for functions
 * @returns CompletionList if a function exists, otherwise undefined
 */
function getFunctionCompletions({
  jsonataNodeLength,
  jsonataFunctions,
  properties,
}: {
  jsonataNodeLength: number
  jsonataFunctions: JsonataFunctionsMap
  properties: FunctionCompletionProperties
}): CompletionList | undefined {
  const { jsonataNode, node, asl, nodePosition, endPosition } = properties

  const range = Range.create(Position.create(nodePosition.line, endPosition.character - jsonataNodeLength), endPosition)

  const functions = jsonataNode.node.type === 'variable' ? Array.from(jsonataFunctions.keys()) : []

  const functionCompletionItems = functions.map((name) => {
    const item = CompletionItem.create(name)
    item.commitCharacters = ['(']

    item.kind = CompletionItemKind.Function
    const completeVal = name
    const functionProps = jsonataFunctions.get(name)

    item.textEdit = TextEdit.replace(range, completeVal)
    item.filterText = completeVal
    item.label = name

    item.detail = `${name}(${getFunctionArguments(functionProps?.params || [])})`

    item.documentation = functionProps?.description && {
      kind: 'markdown',
      value: functionProps?.description,
    }

    return item
  })

  const variableCompletionItems = getVariablesCompletionList({
    node,
    value: jsonataNode.node.value,
    asl,
    replaceRange: range,
  }).map(
    (item) =>
      ({
        ...item,
        // Place variables at the top of the list
        sortText: `!${item.label}`,
      }) as CompletionItem,
  )

  return {
    isIncomplete: false,
    items: variableCompletionItems.concat(functionCompletionItems),
  }
}

export default async function completeJSONata(
  node: ASTNode | undefined,
  offset: number,
  document: TextDocument,
  asl: Asl,
): Promise<CompletionList | undefined> {
  if (!node || document.languageId === LANGUAGE_IDS.YAML) {
    return
  }

  if (!node || !node.parent || !isPropertyNode(node.parent)) {
    return
  }

  const isValueNode = node.parent.valueNode?.offset === node.offset
  if (!isStringNode(node) || !isValueNode) {
    return
  }

  const stateInfo = getStateInfo(node)
  // don't generate JSONata autocomplete strings if not inside a state
  if (!stateInfo) {
    return
  }

  const jsonataNodeData = await getJSONataNodeData(document, offset, node)

  if (!jsonataNodeData) {
    return
  }

  const { jsonataNode, nodePosition, jsonataNodePosition, jsonataFunctions } = jsonataNodeData

  const jsonataNodeLength = jsonataNode.node.value ? String(jsonataNode?.node.value).length : 0

  const endPosition = Position.create(
    nodePosition.line,
    jsonataNodePosition + JSONATA_TEMPLATE_WRAPPER.start.length + nodePosition.character,
  )

  const partialPathCompletion = getPartialPathCompletion({
    jsonataNode,
    nodePosition,
    endPosition,
    node,
    asl,
  })
  if (partialPathCompletion) {
    return partialPathCompletion
  }

  const incompletePathCompletion = getIncompletePathCompletion({
    jsonataNode,
    nodePosition,
    endPosition,
    node,
    asl,
  })
  if (incompletePathCompletion) {
    return incompletePathCompletion
  }

  const variableAndFunctionCompletions = getFunctionCompletions({
    jsonataNodeLength,
    jsonataFunctions,
    properties: {
      jsonataNode,
      nodePosition,
      endPosition,
      node,
      asl,
    },
  })

  return variableAndFunctionCompletions
}
