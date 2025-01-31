/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import assert from 'assert'
import { ASTNode } from 'vscode-json-languageservice'
import { getLanguageService, PropertyASTNode, TextDocument } from '../service'
import {
  ASTTree,
  findClosestAncestorStateNode,
  findNodeAtLocation,
  getListOfStateNamesFromStateNode,
  insideStateNode,
  isChildOfStates,
  getStateInfo,
  findClosestAncestorNodeByName,
} from '../utils/astUtilityFunctions'
import { documentWithAssignAndCatch } from './json-strings/variableStrings'
import { QueryLanguages } from '../asl-utils'

const document = `
{
    "Comment": "A comment",
    "States": {
      "FirstState": {},
      "ChoiceState": {},
      "FirstMatchState": {},
      "SecondMatchState": {},
      "DefaultState": {},
      "NextState": {},
      "MapState1": {
        "Type": "Map",
        "Iterator": {
          "States": {
            "MapState2": {
                "Type": "Map",
                "Iterator": {
                "States": {
                    "State1": {
                        "Type": "Task",
                    },
                    "State2": {
                        "Type": "Task",
                    },
                    "State3": {
                        "Type": "Task",
                    },
                    "State4": {
                        "Type": "Task",
                    },
                }
                },
            }
          }
        }
      }
    }
  }
`

const documentJSONata = `
{
    "Comment": "A comment",
    "QueryLanguage": "JSONata",
    "States": {
      "FirstState": {}
    }
  }
`

const documentJSONPath = `
{
    "Comment": "A comment",
    "QueryLanguage": "JSONPath",
    "States": {
      "FirstState": {
        "QueryLanguage": "JSONata"
      },
      "SecondState": {
        "QueryLanguage": "JSONPath"
      }
    }
  }
`

// Invalid state name property
const documentInvalid = `
{
    "States": {
      "FirstState": {
      },
      "SecondState": {
      },
      "Invalid:
`

function toDocument(text: string): { textDoc: TextDocument; jsonDoc: ASTTree } {
  const textDoc = TextDocument.create('foo://bar/file.asl', 'json', 0, text)

  const ls = getLanguageService({})
  const jsonDoc = ls.parseJSONDocument(textDoc) as ASTTree

  return { textDoc, jsonDoc }
}

describe('Utility functions for extracting data from AST Tree', () => {
  test('getListOfStateNamesFromStateNode - retrieves list of states from state node', async () => {
    const { jsonDoc } = toDocument(document)
    const stateNode = jsonDoc.root?.children?.[1] as PropertyASTNode
    const stateNames = getListOfStateNamesFromStateNode(stateNode)

    const expectedStateNames = [
      'FirstState',
      'ChoiceState',
      'FirstMatchState',
      'SecondMatchState',
      'DefaultState',
      'NextState',
      'MapState1',
    ]

    assert.strictEqual(stateNames?.length, expectedStateNames.length)
    assert.deepEqual(stateNames, expectedStateNames)
  })

  test('getListOfStateNamesFromStateNode - throws an error when property named "States" is not provided', async () => {
    const { jsonDoc } = toDocument(document)
    const stateNode = jsonDoc.root?.children?.[0] as PropertyASTNode

    assert.throws(() => getListOfStateNamesFromStateNode(stateNode), { message: 'Not a state name property node' })
  })

  test('getListOfStateNamesFromStateNode - retrieves only valid states', () => {
    const { jsonDoc } = toDocument(documentInvalid)
    const stateNode = jsonDoc.root?.children?.[0] as PropertyASTNode
    const stateNames = getListOfStateNamesFromStateNode(stateNode)

    const expectedStateNames = ['FirstState', 'SecondState']

    assert.strictEqual(stateNames?.length, expectedStateNames.length)
    assert.deepEqual(stateNames, expectedStateNames)
  })

  test('findNodeAtLocation - finds a correct node at a given location', () => {
    const { jsonDoc } = toDocument(document)
    const location = document.indexOf('MapState2') + 1

    const node = findNodeAtLocation(jsonDoc.root, location)

    assert.ok(!!node)

    const nodeText = document.slice(node?.offset, node?.offset + node?.length)

    assert.strictEqual(nodeText, '"MapState2"')
  })

  test('findClosestAncestorStateNode - finds the closest ancestor property node called "States"', () => {
    const { jsonDoc } = toDocument(document)
    const location = document.indexOf('State4') + 1

    const node = findNodeAtLocation(jsonDoc.root, location)
    assert(!!node)
    const statesNode = findClosestAncestorStateNode(node)

    assert(!!statesNode)
    const nodeText = statesNode?.keyNode.value

    assert.strictEqual(nodeText, 'States')

    const stateNames = getListOfStateNamesFromStateNode(statesNode)

    assert.deepEqual(stateNames, ['State1', 'State2', 'State3', 'State4'])
  })

  test('isChildOfStates - should return True if the location is a child node of a "States" node', () => {
    const { jsonDoc } = toDocument(document)
    const location = document.indexOf('MapState1') - 2

    const node = findNodeAtLocation(jsonDoc.root, location)
    assert.strictEqual(isChildOfStates(node as ASTNode), true)
  })

  test('isChildOfStates - should return False if the location is not a child node of a "States" node', () => {
    const { jsonDoc } = toDocument(document)
    const location = document.indexOf('SecondMatchState')

    const node = findNodeAtLocation(jsonDoc.root, location)
    assert.strictEqual(isChildOfStates(node as ASTNode), false)
  })

  test('insideStateNode - should return True if the location is inside a State node', () => {
    const { jsonDoc } = toDocument(document)
    const location = document.indexOf('SecondMatchState') + 1

    const node = findNodeAtLocation(jsonDoc.root, location)
    assert.strictEqual(insideStateNode(node as ASTNode), true)
  })

  test('insideStateNode - should return True if the location is a child node of a "States" node', () => {
    const { jsonDoc } = toDocument(document)
    const location = document.indexOf('MapState1') - 2

    const node = findNodeAtLocation(jsonDoc.root, location)
    assert.strictEqual(insideStateNode(node as ASTNode), false)
  })

  test('getStateInfo - should return name and type inside a map state', () => {
    const { jsonDoc } = toDocument(document)
    const location = document.indexOf('MapState1') + 2

    const node = findNodeAtLocation(jsonDoc.root, location)
    assert(node)
    const result = getStateInfo(node)

    assert.equal(result?.stateName, 'MapState1')
    assert.equal(result?.stateType, 'Map')
    assert.equal(result?.queryLanguage, undefined)
  })

  test('getStateInfo - should return name and type inside a task state', () => {
    const { jsonDoc } = toDocument(document)
    const location = document.indexOf('State3') + 2

    const node = findNodeAtLocation(jsonDoc.root, location)
    assert(node)
    const result = getStateInfo(node)

    assert.equal(result?.stateName, 'State3')
    assert.equal(result?.stateType, 'Task')
    assert.equal(result?.queryLanguage, undefined)
  })

  test('getStateInfo - should return undefined queryLanguage if not set', () => {
    const { jsonDoc } = toDocument(documentJSONata)
    const location = documentJSONata.indexOf('FirstState') + 2

    const node = findNodeAtLocation(jsonDoc.root, location)
    assert(node)
    const result = getStateInfo(node)

    assert.equal(result?.stateName, 'FirstState')
    assert.equal(result?.queryLanguage, undefined)
  })

  test('getStateInfo - should return JSONata query language of node', () => {
    const { jsonDoc } = toDocument(documentJSONPath)
    const location = documentJSONPath.indexOf('FirstState') + 2

    const node = findNodeAtLocation(jsonDoc.root, location)
    assert(node)
    const result = getStateInfo(node)

    assert.equal(result?.stateName, 'FirstState')
    assert.equal(result?.queryLanguage, QueryLanguages.JSONata)
  })

  test('findClosestAncestorNodeByName - should return Assign ancestor node', () => {
    const { jsonDoc } = toDocument(documentWithAssignAndCatch)
    const location = documentWithAssignAndCatch.indexOf('var_lambda2')

    const node = findNodeAtLocation(jsonDoc.root, location)
    assert(node)
    const result = findClosestAncestorNodeByName(node, ['Assign', 'Parameters'])

    assert(result?.node)
    assert.equal(result?.nodeName, 'Assign')
  })

  test('findClosestAncestorNodeByName - should return Catch ancestor node', () => {
    const { jsonDoc } = toDocument(documentWithAssignAndCatch)
    const location = documentWithAssignAndCatch.indexOf('error')

    const node = findNodeAtLocation(jsonDoc.root, location)
    assert(node)
    const result = findClosestAncestorNodeByName(node, ['Catch', 'Parameters'])

    assert(result?.node)
    assert.equal(result?.nodeName, 'Catch')
  })

  test('findClosestAncestorNodeByName - should return innermost ancestor node', () => {
    const { jsonDoc } = toDocument(documentWithAssignAndCatch)
    const location = documentWithAssignAndCatch.indexOf('error')

    const node = findNodeAtLocation(jsonDoc.root, location)
    assert(node)
    const result = findClosestAncestorNodeByName(node, ['Catch', 'Assign'])

    assert(result?.node)
    assert.equal(result?.nodeName, 'Assign')
  })
})
