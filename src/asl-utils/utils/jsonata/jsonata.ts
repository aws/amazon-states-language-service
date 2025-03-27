/*!
 * Copyright 2025 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import type jsonata from 'jsonata'
import type { FunctionParam, JsonataFunctionsMap } from './functions'

// There are additional properties in the object not specified in the library's typescript interface
export interface ExprNode extends Omit<jsonata.ExprNode, 'lhs'> {
  lhs?: jsonata.ExprNode | jsonata.ExprNode[]
  body?: jsonata.ExprNode
  then?: jsonata.ExprNode
  else?: jsonata.ExprNode
  condition?: jsonata.ExprNode
  error?: jsonata.JsonataError
}

export interface JSONataASTResult {
  node: ExprNode
  parent: ExprNode | null
}

export const exprPropertiesToRecurse = [
  'arguments',
  'procedure',
  'expressions',
  'stages',
  'lhs',
  'rhs',
  'body',
  'stages',
  'steps',
  'then',
  'else',
  'condition',
] satisfies (keyof ExprNode)[]

export const JSONATA_TEMPLATE_WRAPPER = {
  start: '{%',
  end: '%}',
} as const

export const MAX_AST_DEPTH = 100

function findNodeInASTRecursive(
  ast: ExprNode | ExprNode[],
  parent: ExprNode | null,
  position: number,
  depth = 0,
): JSONataASTResult | null {
  if (depth > MAX_AST_DEPTH) {
    return null
  }

  // Some AST children are arrays, so we should iterate through each of the children
  if (Array.isArray(ast)) {
    let currentNode: ExprNode | null = null
    for (const node of ast) {
      const currentPosition = node.position || node.error?.position
      if (!currentPosition) {
        const found = findNodeInASTRecursive(node, parent, position, depth + 1)
        if (found) {
          return found
        }

        continue
      }

      if (currentPosition > position) {
        continue
      }

      if (currentPosition === position) {
        return {
          node: node,
          parent,
        }
      }

      if (!currentNode?.position || (currentPosition < position && currentNode.position < currentPosition)) {
        currentNode = node
      }
    }

    if (!currentNode) {
      return null
    }

    return findNodeInASTRecursive(currentNode, parent, position, depth + 1)
  }

  if (ast.position && ast.position > position) {
    return null
  }

  if (ast.position === position) {
    return {
      node: ast,
      parent,
    }
  }

  for (const key of exprPropertiesToRecurse) {
    const value = ast[key]
    if (value) {
      const found = findNodeInASTRecursive(value, ast, position, depth + 1)
      if (found) {
        return found
      }
    }
  }

  return null
}

let jsonataLibrary: typeof import('jsonata') | null = null

/**
 * Dynamically imports jsonata and gets the AST of the string
 * @param input JSONata string to parse
 * @returns The root node of the JSONata AST
 */
export async function getJSONataAST(
  input: string,
  params: jsonata.JsonataOptions = {
    recover: true,
  },
): Promise<ExprNode> {
  if (!jsonataLibrary) {
    jsonataLibrary = (await import('jsonata')).default
  }

  return jsonataLibrary(input, params).ast()
}

export async function getJSONataFunctionList(): Promise<JsonataFunctionsMap> {
  return (await import('./functions')).jsonataFunctions
}

/**
 * Searches the JSONata AST to find the node at a specified position. If the AST has nodes
 * that have a position past the position parameter, this function will return null.
 * @param ast The JSONata AST provided by the JSONata library
 * @param position The position to search the JSONata AST
 * @returns The node at the position
 */
export function findNodeInJSONataAST(ast: ExprNode, position: number): JSONataASTResult | null {
  return findNodeInASTRecursive(ast, null, position)
}

/**
 * Generates the function argument string from a given list of JSONata function parameters.
 * Recursively surrounds optional arguments with [] and separates arguments with commas.
 * @param functionParams Function parameters properties used for generating the argument string
 * @param index The index of the parameter to start traversal at
 * @returns The function argument string
 */
export function getFunctionArguments(functionParams: ReadonlyArray<FunctionParam>, index = 0): string {
  if (index > functionParams.length - 1) {
    return ''
  }

  const prefix = index === 0 ? '' : ', '
  const argument = functionParams[index].name

  const info = `${prefix}${argument}${getFunctionArguments(functionParams, index + 1)}`

  if (functionParams[index].optional) {
    return `[${info}]`
  }

  return info
}
