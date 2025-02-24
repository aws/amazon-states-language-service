/*!
 * Copyright 2025 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import { FunctionParam } from '../jsonata'
import {
  MAX_AST_DEPTH,
  exprPropertiesToRecurse,
  findNodeInJSONataAST,
  getFunctionArguments,
  getJSONataAST,
  getJSONataFunctionList,
} from '../jsonata/jsonata'

// eslint-disable-next-line no-var
var jsonataSpy: jest.SpyInstance | undefined = undefined
jest.mock('jsonata', () => {
  const original = jest.requireActual('jsonata')
  jsonataSpy = jest.fn(original)
  return {
    __esModule: true,
    default: jsonataSpy,
  }
})

describe('jsonataHelper', () => {
  describe('getJSONataAST', () => {
    it('should call JSONata library function with the correct default parameters', async () => {
      const result = await getJSONataAST('myString')
      expect(jsonataSpy).toHaveBeenCalledWith('myString', {
        recover: true,
      })

      expect(result).toBeTruthy()
    })

    it('should call JSONata library function with the correct provided parameters', async () => {
      const result = await getJSONataAST('myString', {
        recover: false,
      })
      expect(jsonataSpy).toHaveBeenCalledWith('myString', {
        recover: false,
      })

      expect(result).toBeTruthy()
    })
  })

  describe('findNodeInJSONataAST', () => {
    it('should return the correct node with just $ expression', async () => {
      const expression = '$'

      const ast = await getJSONataAST(expression)

      const node = findNodeInJSONataAST(ast, expression.length)

      expect(node).toEqual({
        node: {
          value: '',
          type: 'variable',
          position: expression.length,
        },
        parent: null,
      })
    })

    it('should return the correct node with simple variable expression', async () => {
      const expression = '$length'

      const ast = await getJSONataAST(expression)

      const node = findNodeInJSONataAST(ast, expression.length)

      expect(node).toEqual({
        node: {
          value: 'length',
          type: 'variable',
          position: expression.length,
        },
        parent: null,
      })
    })

    it('should return the correct node with nested function argument', async () => {
      const expression = '$length($'

      const ast = await getJSONataAST(expression)
      expect(ast.arguments).toBeTruthy()

      const node = findNodeInJSONataAST(ast, expression.length)

      expect(node).toEqual({
        node: {
          value: '',
          type: 'variable',
          position: expression.length,
        },
        parent: ast,
      })
    })

    it('should return the correct node with multipled function arguments', async () => {
      const expression = '$length($myVar1, $myVar2, $myVar3'

      const ast = await getJSONataAST(expression)
      expect(ast.arguments).toBeTruthy()

      const node = findNodeInJSONataAST(ast, expression.length)

      expect(node).toEqual({
        node: {
          value: 'myVar3',
          type: 'variable',
          position: expression.length,
        },
        parent: ast,
      })
    })

    it('should return the correct node with a property path', async () => {
      const expression = '$states.context.'

      const ast = await getJSONataAST(expression)

      const node = findNodeInJSONataAST(ast, expression.length)

      expect(node).toEqual({
        node: {
          type: 'error',
          error: {
            code: expect.any(String),
            position: expression.length,
            token: expect.any(String),
          },
        },
        parent: {
          type: 'path',
          steps: expect.any(Array),
        },
      })
    })

    it('should return null if the recursion is too deep', async () => {
      const expression = '$a('.repeat(MAX_AST_DEPTH + 1) + ')'.repeat(MAX_AST_DEPTH + 1)

      const ast = await getJSONataAST(expression)

      const node = findNodeInJSONataAST(ast, expression.length)

      expect(node).toEqual(null)
    })

    it('should return null if a node is greater than the current position', async () => {
      const expression = '$states'

      const ast = await getJSONataAST(expression)

      const node = findNodeInJSONataAST(ast, 1)

      expect(node).toEqual(null)
    })

    it('should return null if a nested node is greater than the current position', async () => {
      const expression = '$states.context.'

      const ast = await getJSONataAST(expression)

      const node = findNodeInJSONataAST(ast, 1)

      expect(node).toEqual(null)
    })

    it('should return value for expression without position in AST', async () => {
      const expression = '($states.'

      const ast = await getJSONataAST(expression)

      expect(ast).toEqual({
        type: 'block',
        position: 1,
        expressions: [
          {
            type: 'path',
            steps: expect.any(Array),
          },
        ],
      })

      const node = findNodeInJSONataAST(ast, expression.length)

      expect(node).toEqual({
        node: {
          type: 'error',
          error: {
            code: expect.any(String),
            position: expression.length,
            token: expect.any(String),
          },
        },
        parent: {
          type: 'path',
          steps: expect.any(Array),
        },
      })
    })

    it('should return value for multiple expressions without position in AST', async () => {
      const expression = '($states.context; $length('

      const ast = await getJSONataAST(expression)

      expect(ast).toEqual({
        type: 'block',
        position: 1,
        expressions: [
          {
            type: 'path',
            steps: expect.any(Array),
          },
          {
            type: 'function',
            name: undefined,
            value: expect.any(String),
            position: 26,
            arguments: expect.any(Array),
            procedure: expect.any(Object),
          },
        ],
      })

      const node = findNodeInJSONataAST(ast, expression.length)

      expect(node).toEqual({
        node: {
          type: 'function',
          name: undefined,
          value: expect.any(String),
          position: 26,
          arguments: expect.any(Array),
          procedure: expect.any(Object),
        },
        parent: ast,
      })
    })

    it('should return value for function declarations', async () => {
      const expression = '$product := function($a, $b) { $a * $b'

      const ast = await getJSONataAST(expression)

      expect(ast).toEqual({
        type: 'bind',
        value: ':=',
        position: 11,
        lhs: { value: 'product', type: 'variable', position: 8 },
        rhs: {
          type: 'lambda',
          arguments: expect.any(Array),
          signature: undefined,
          position: 21,
          body: {
            type: 'binary',
            value: '*',
            position: 35,
            lhs: expect.any(Object),
            rhs: expect.any(Object),
          },
        },
      })

      const node = findNodeInJSONataAST(ast, expression.length)
      expect(node).toEqual({
        node: { value: 'b', type: 'variable', position: expression.length },
        parent: {
          type: 'binary',
          value: '*',
          position: 35,
          lhs: expect.any(Object),
          rhs: { value: 'b', type: 'variable', position: expression.length },
        },
      })
    })

    it('should return value for ternary condition', async () => {
      const expression = '$states ? $'

      const ast = await getJSONataAST(expression)

      expect(ast).toEqual({
        type: 'condition',
        position: 9,
        condition: { value: 'states', type: 'variable', position: 7 },
        then: { value: '', type: 'variable', position: expression.length },
      })

      const node = findNodeInJSONataAST(ast, expression.length)
      expect(node).toEqual({
        node: { value: '', type: 'variable', position: expression.length },
        parent: ast,
      })
    })

    it('should return value for ternary else', async () => {
      const expression = '$states ? 3 : $'

      const ast = await getJSONataAST(expression)

      expect(ast).toEqual({
        type: 'condition',
        position: 9,
        condition: { value: 'states', type: 'variable', position: 7 },
        then: expect.any(Object),
        else: { value: '', type: 'variable', position: expression.length },
      })

      const node = findNodeInJSONataAST(ast, expression.length)
      expect(node).toEqual({
        node: { value: '', type: 'variable', position: expression.length },
        parent: ast,
      })
    })
  })

  describe('exprPropertiesToRecurse', () => {
    it.each(exprPropertiesToRecurse)('should return the correct node when recursing for %s', (propertyToRecurse) => {
      const ast = {
        type: 'function',
        [propertyToRecurse]: {
          value: 'myValue',
          type: 'variable',
          position: 100,
        },
      }

      const node = findNodeInJSONataAST(ast, 100)

      expect(node).toEqual({
        node: {
          value: 'myValue',
          type: 'variable',
          position: 100,
        },
        parent: ast,
      })

      const astWithNestedArray = {
        type: 'function',
        [propertyToRecurse]: [
          {
            value: 'myValue',
            type: 'variable',
            position: 100,
          },
        ],
      }

      const nodeFromArray = findNodeInJSONataAST(astWithNestedArray, 100)
      expect(nodeFromArray).toEqual({
        node: {
          value: 'myValue',
          type: 'variable',
          position: 100,
        },
        parent: astWithNestedArray,
      })
    })
  })

  describe('getJSONataFunctionList', () => {
    it('should return list of JSONata functions', async () => {
      const functions = await getJSONataFunctionList()
      expect(functions).toBeInstanceOf(Map)
      expect(functions.size).toBeGreaterThan(0)
      for (const [key, value] of functions.entries()) {
        expect(typeof key).toEqual('string')
        expect(value).toEqual({
          params: expect.any(Array),
          category: expect.any(String),
          description: expect.any(String),
        })
      }
    })
  })

  describe('getFunctionArguments', () => {
    it('should return the correct arguments for optional params', async () => {
      const functionParams: FunctionParam[] = [
        {
          name: 'myParam',
        },
        {
          name: 'myParam2',
        },
        {
          name: 'myParam3',
          optional: true,
        },
      ]

      expect(getFunctionArguments(functionParams)).toEqual('myParam, myParam2[, myParam3]')
    })

    it('should return the correct arguments for variable params', async () => {
      const functionParams: FunctionParam[] = [
        {
          name: 'myParam',
        },
        {
          name: '...',
        },
      ]

      expect(getFunctionArguments(functionParams)).toEqual('myParam, ...')
    })

    it('should return the correct arguments for nested optional params', async () => {
      const functionParams: FunctionParam[] = [
        {
          name: 'myParam',
        },
        {
          name: 'myParam2',
          optional: true,
        },
        {
          name: 'myParam3',
          optional: true,
        },
      ]

      expect(getFunctionArguments(functionParams)).toEqual('myParam[, myParam2[, myParam3]]')
    })
  })
})
