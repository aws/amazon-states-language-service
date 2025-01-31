/*!
 * Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */
import {
  JSONATA_TEMPLATE_WRAPPER,
  JsonataFunctionsMap,
  ExprNode,
  getJSONataAST,
  getJSONataFunctionList,
  findNodeInJSONataAST,
  JSONataASTResult,
} from '../../asl-utils'
import { ASTNode, Position, TextDocument } from 'vscode-json-languageservice'

export async function getJSONataNodeData(
  document: TextDocument,
  offset: number,
  node: ASTNode,
): Promise<
  | {
      jsonataNode: JSONataASTResult
      nodePosition: Position
      jsonataNodePosition: number
      jsonataFunctions: JsonataFunctionsMap
    }
  | undefined
> {
  const { start: JSONATA_PREFIX, end: JSONATA_SUFFIX } = JSONATA_TEMPLATE_WRAPPER

  const nodeValue = node.value?.toString()

  if (!nodeValue || !nodeValue.startsWith(JSONATA_PREFIX) || !nodeValue.endsWith(JSONATA_SUFFIX)) {
    return
  }

  const cursorPosition = document.positionAt(offset)
  const nodePosition = document.positionAt(node.offset)

  const positionInString = cursorPosition.character - nodePosition.character - JSONATA_PREFIX.length - 1

  let jsonataFunctions: JsonataFunctionsMap
  let jsonataAst: ExprNode
  try {
    const jsonataStringCursorPosition = positionInString + JSONATA_PREFIX.length

    ;[jsonataAst, jsonataFunctions] = await Promise.all([
      getJSONataAST(nodeValue.slice(JSONATA_PREFIX.length, jsonataStringCursorPosition)),
      getJSONataFunctionList(),
    ])
  } catch (_err) {
    return
  }

  const jsonataNode = findNodeInJSONataAST(jsonataAst, positionInString)
  const jsonataNodePosition = jsonataNode?.node.position || jsonataNode?.node.error?.position

  if (!jsonataNode || !jsonataNodePosition) {
    return
  }

  return {
    jsonataNode,
    nodePosition,
    jsonataNodePosition,
    jsonataFunctions,
  }
}
