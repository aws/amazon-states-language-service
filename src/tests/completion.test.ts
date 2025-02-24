/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import * as assert from 'assert'
import { CompletionItemKind } from 'vscode-json-languageservice'
import { errorHandlingSnippets, stateSnippets } from '../completion/completeSnippets'
import { getLanguageService, Position, Range } from '../service'
import { asTextEdit, toDocument } from './utils/testUtilities'
import { documentWithAssignAndCatch, documentWithAssignAndCatchInvalidJson } from './json-strings/variableStrings'
import { ASLOptions } from '../utils/astUtilityFunctions'
import { globalJsonataDocument, stateLevelJsonataDocument } from './json-strings/jsonataStrings'
import { getJSONataFunctionList } from '../asl-utils'
import {
  document1,
  document2,
  document3,
  document4,
  document5,
  document6,
  documentNested,
  completionsEdgeCase1,
  completionsEdgeCase2,
  itemLabels,
  nestedItemLabels,
} from './json-strings/completionStrings'

interface TestCompletionOptions {
  labels: string[]
  json: string
  position: [number, number]
  start: [number, number]
  end: [number, number]
  labelToInsertText(label: string): string
  aslOptions?: ASLOptions
}

interface TestScenario {
  json: string
  position: [number, number]
  start: [number, number]
  end: [number, number]
}

async function getCompletions(json: string, position: [number, number], aslOptions?: ASLOptions) {
  const { textDoc, jsonDoc } = toDocument(json)
  const pos = Position.create(...position)
  const ls = getLanguageService({ aslOptions })

  return await ls.doComplete(textDoc, pos, jsonDoc)
}

async function testCompletions(options: TestCompletionOptions) {
  const { labels, json, position, start, end, labelToInsertText } = options

  const res = await getCompletions(json, position, options.aslOptions)
  assert.strictEqual(res?.items.length, labels.length)

  // space before quoted item
  const itemInsertTexts = labels.map(labelToInsertText)

  assert.deepEqual(
    res?.items.map((item) => item.label),
    labels,
  )
  assert.deepEqual(
    res?.items.map((item) => item.textEdit?.newText),
    itemInsertTexts,
  )

  const leftPos = Position.create(...start)
  const rightPos = Position.create(...end)

  res?.items.forEach((item) => {
    assert.deepEqual(asTextEdit(item.textEdit)?.range, Range.create(leftPos, rightPos))
  })
}

function getArrayIntersection(arrayOne: string[] | undefined, arrayTwo: string[] | undefined): string[] {
  if (arrayOne === undefined || arrayTwo === undefined) {
    return []
  }
  const arrayIntersection = arrayOne.filter((x) => arrayTwo.includes(x))

  return arrayIntersection
}

async function getSuggestedSnippets(options: TestScenario) {
  const { json, position } = options
  const { textDoc, jsonDoc } = toDocument(json)

  const pos = Position.create(...position)

  const ls = getLanguageService({})

  const res = await ls.doComplete(textDoc, pos, jsonDoc)

  const suggestedSnippetLabels = res?.items
    .filter((item) => item.kind === CompletionItemKind.Snippet)
    .map((item) => item.label)

  return suggestedSnippetLabels
}

describe('ASL context-aware completion', () => {
  describe('StartAt', () => {
    test('Cursor immedietely after colon', async () => {
      await testCompletions({
        labels: itemLabels,
        json: document1,
        position: [2, 14],
        start: [2, 14],
        end: [2, 15],
        labelToInsertText: (label) => ` "${label}",`,
      })
    })

    test('Cursor not immedietely after colon but no quotes', async () => {
      await testCompletions({
        labels: itemLabels,
        json: document2,
        position: [2, 16],
        start: [2, 14],
        end: [2, 16],
        labelToInsertText: (label) => ` "${label}",`,
      })
    })

    test('Left quotation mark present', async () => {
      await testCompletions({
        labels: itemLabels,
        json: document3,
        position: [2, 16],
        start: [2, 16],
        end: [2, 17],
        labelToInsertText: (label) => `${label}"`,
      })
    })

    test('Both quotation marks present and cursor between them', async () => {
      await testCompletions({
        labels: itemLabels,
        json: document4,
        position: [2, 16],
        start: [2, 16],
        end: [2, 17],
        labelToInsertText: (label) => `${label}"`,
      })
    })

    test('Suggests completions when text present and cursor is on it', async () => {
      await testCompletions({
        labels: itemLabels,
        json: document5,
        position: [2, 17],
        start: [2, 14],
        end: [2, 20],
        labelToInsertText: (label) => `${label}"`,
      })
    })

    test('Suggests nested completions when StartAt is nested within Map state', async () => {
      await testCompletions({
        labels: nestedItemLabels,
        json: documentNested,
        position: [7, 20],
        start: [7, 20],
        end: [7, 21],
        labelToInsertText: (label) => ` "${label}",`,
      })
    })
  })

  describe('Next', () => {
    test('Cursor immedietely after colon', async () => {
      await testCompletions({
        // remove last label as it is the name of the current state
        labels: itemLabels.filter((label) => label !== 'NextState'),
        json: document1,
        position: [10, 15],
        start: [10, 15],
        end: [10, 16],
        labelToInsertText: (label) => ` "${label}",`,
      })
    })

    test('Cursor not immedietely after colon but no quotes', async () => {
      await testCompletions({
        // remove last label as it is the name of the current state
        labels: itemLabels.filter((label) => label !== 'NextState'),
        json: document2,
        position: [10, 17],
        start: [10, 15],
        end: [10, 17],
        labelToInsertText: (label) => ` "${label}",`,
      })
    })

    test('Left quotation mark present', async () => {
      await testCompletions({
        // remove last label as it is the name of the current state
        labels: itemLabels.filter((label) => label !== 'NextState'),
        json: document3,
        position: [10, 17],
        start: [10, 17],
        end: [10, 18],
        labelToInsertText: (label) => `${label}"`,
      })
    })

    test('Both quotation marks present and cursor between them', async () => {
      await testCompletions({
        // remove last label as it is the name of the current state
        labels: itemLabels.filter((label) => label !== 'NextState'),
        json: document4,
        position: [10, 17],
        start: [10, 17],
        end: [10, 18],
        labelToInsertText: (label) => `${label}"`,
      })
    })

    test('Suggests completions when text present and cursor is on it', async () => {
      await testCompletions({
        // remove last label as it is the name of the current state
        labels: itemLabels.filter((label) => label !== 'NextState'),
        json: document5,
        position: [10, 18],
        start: [10, 17],
        end: [10, 23],
        labelToInsertText: (label) => `${label}"`,
      })
    })

    test('Suggests nested completions when Next is nested within Map state', async () => {
      await testCompletions({
        // remove last label as it is the name of the current state
        labels: nestedItemLabels.filter((label) => label !== 'Nested4'),
        json: documentNested,
        position: [13, 21],
        start: [13, 21],
        end: [13, 22],
        labelToInsertText: (label) => ` "${label}",`,
      })
    })

    test('Suggests completions for the Next property within Choice state', async () => {
      await testCompletions({
        labels: itemLabels.filter((label) => label !== 'ChoiceStateX'),
        json: document1,
        position: [16, 21],
        start: [16, 21],
        end: [16, 22],
        labelToInsertText: (label) => `${label}"`,
      })
    })
  })

  describe('Default', () => {
    test('Suggests completion items for Default property of the Choice state when cursor positioned after first quote', async () => {
      await testCompletions({
        labels: itemLabels.filter((label) => label !== 'ChoiceStateX'),
        json: document1,
        position: [25, 20],
        start: [25, 20],
        end: [25, 21],
        labelToInsertText: (label) => `${label}"`,
      })
    })

    test('Suggests completion items for Default property of the Choice state when cursor immeditely after colon', async () => {
      await testCompletions({
        labels: itemLabels.filter((label) => label !== 'ChoiceStateX'),
        json: document2,
        position: [25, 18],
        start: [25, 18],
        end: [25, 18],
        labelToInsertText: (label) => ` "${label}",`,
      })
    })
  })

  describe('Snippets', () => {
    test('Suggests state snippets when cursor positioned within `States` block but outside a state definition', async () => {
      const expectedSnippets = stateSnippets.map((item) => item.label)
      const suggestedSnippets = await getSuggestedSnippets({
        json: document1,
        position: [5, 3],
        start: [5, 3],
        end: [5, 3],
      })

      assert.deepEqual(suggestedSnippets, expectedSnippets)
    })

    test('Does not suggest state snippets when cursor is inside a state definition', async () => {
      const notExpectedSnippets = stateSnippets.map((item) => item.label)
      const suggestedSnippets = await getSuggestedSnippets({
        json: document1,
        position: [7, 28],
        start: [7, 28],
        end: [7, 28],
      })
      assert.deepEqual(getArrayIntersection(suggestedSnippets, notExpectedSnippets), [])
    })

    test('Suggests error handling snippets when cursor is positioned within a State that supports error handling', async () => {
      const expectedSnippets = errorHandlingSnippets.map((item) => item.label)
      const suggestedSnippets = await getSuggestedSnippets({
        json: document6,
        position: [5, 25],
        start: [5, 25],
        end: [5, 25],
      })

      assert.deepEqual(suggestedSnippets, expectedSnippets)
    })

    test('Does not suggest error handling snippets when cursor is positioned within a State that does not support error handling', async () => {
      const notExpectedSnippets = errorHandlingSnippets.map((item) => item.label)
      const suggestedSnippets = await getSuggestedSnippets({
        json: document6,
        position: [14, 27],
        start: [14, 27],
        end: [14, 27],
      })
      assert.deepEqual(getArrayIntersection(suggestedSnippets, notExpectedSnippets), [])
    })
  })

  describe('Edge Cases', () => {
    test('Requested completion in state name position does not throw error', async () => {
      await assert.doesNotReject(getCompletions(completionsEdgeCase1, [22, 7]), TypeError)

      await assert.doesNotReject(getCompletions(completionsEdgeCase2, [4, 7]), TypeError)
    })
  })

  describe('Variable', () => {
    test('Suggest only context variable when JSON is invalid', async () => {
      await testCompletions({
        labels: ['$states'],
        json: documentWithAssignAndCatchInvalidJson,
        position: [24, 20],
        start: [24, 20],
        end: [24, 20],
        labelToInsertText: (label) => ` "${label}"`,
      })
    })

    test('Suggest variable after colon from latest valid json', async () => {
      const position: [number, number] = [24, 20]
      const labels = ['$var_lambda1', '$states']

      const { textDoc, jsonDoc } = toDocument(documentWithAssignAndCatch)
      const pos = Position.create(...position)
      const ls = getLanguageService({ aslOptions: {} })
      // setup dynamic variable list with a valid JSON
      await ls.doComplete(textDoc, pos, jsonDoc)

      // invalid json will generate available variable list from latest valid json
      const { textDoc: invalidTextDoc, jsonDoc: invalidJsonDoc } = toDocument(documentWithAssignAndCatchInvalidJson)
      const res = await ls.doComplete(invalidTextDoc, pos, invalidJsonDoc)

      const itemInsertTexts = labels.map((label) => ` "${label}"`)
      assert.deepEqual(
        res?.items.map((item) => item.label),
        labels,
      )
      assert.deepEqual(
        res?.items.map((item) => item.textEdit?.newText),
        itemInsertTexts,
      )
    })

    test('Show variable with cursor between quotation marks', async () => {
      await testCompletions({
        labels: ['$var_lambda1', '$states'],
        json: documentWithAssignAndCatch,
        position: [23, 24],
        start: [23, 24],
        end: [23, 24],
        labelToInsertText: (label) => `${label}`,
      })
    })

    test('Suggest input reserved variable when cursor after $states variable in parameter field', async () => {
      await testCompletions({
        labels: ['input', 'context'],
        json: documentWithAssignAndCatch,
        position: [19, 22],
        start: [19, 22],
        end: [19, 30],
        labelToInsertText: (label) => `$states.${label}`,
      })
    })

    test('Suggest error reserved variable when cursor after $states variable in catcher block', async () => {
      await testCompletions({
        labels: ['input', 'context', 'errorOutput'],
        json: documentWithAssignAndCatch,
        position: [29, 22],
        start: [29, 22],
        end: [29, 30],
        labelToInsertText: (label) => `$states.${label}`,
      })
    })
  })

  describe('JSONata', () => {
    test('Suggest JSONata functions and variables when at the correct position with global JSONata is enabled', async () => {
      const functions = await getJSONataFunctionList()
      const functionLabels = Array.from(functions.keys())
      const variableLabels = ['$var_lambda1', '$states']
      await testCompletions({
        labels: variableLabels.concat(functionLabels),
        json: globalJsonataDocument,
        // Lambda2.Arguments.Payload
        position: [18, 24],
        start: [18, 23],
        end: [18, 23],
        labelToInsertText: (label) => label,
      })
    })

    test('Suggests JSONata functions and variables when at the correct position with global JSONata', async () => {
      const functions = await getJSONataFunctionList()
      const functionLabels = Array.from(functions.keys())
      const variableLabels = ['$var_lambda1', '$states']
      await testCompletions({
        labels: variableLabels.concat(functionLabels),
        json: globalJsonataDocument,
        // Lambda2.Arguments.Payload
        position: [18, 24],
        start: [18, 23],
        end: [18, 23],
        labelToInsertText: (label) => label,
      })
    })

    test('Suggest JSONata functions and variables when at the correct position with state level JSONata', async () => {
      const functions = await getJSONataFunctionList()
      const functionLabels = Array.from(functions.keys())
      const variableLabels = ['$var_lambda1', '$states']
      await testCompletions({
        labels: variableLabels.concat(functionLabels),
        json: stateLevelJsonataDocument,
        // Lambda2.Arguments.Payload
        position: [22, 24],
        start: [22, 23],
        end: [22, 23],
        labelToInsertText: (label) => label,
      })
    })

    test('Does not suggest as JSONata when not in a JSONata state', async () => {
      await testCompletions({
        labels: ['$states'],
        json: stateLevelJsonataDocument,
        // Lambda1.Parameters.Payload
        position: [11, 24],
        start: [11, 20],
        end: [11, 27],
        labelToInsertText: (label) => label,
      })
    })

    test('Does not suggest JSONata functions and variables when string is not a valid JSONata expression', async () => {
      await testCompletions({
        labels: [],
        json: globalJsonataDocument,
        // Lambda2.Arguments.FunctionName
        position: [19, 37],
        start: [19, 37],
        end: [19, 37],
        labelToInsertText: (label) => label,
      })
    })

    test('Does not suggest JSONata functions and variables when cursor is not over a string node', async () => {
      await testCompletions({
        labels: [],
        json: globalJsonataDocument,
        // Lambda2.Arguments.Payload
        position: [19, 1],
        start: [-1, -1],
        end: [-1, -1],
        labelToInsertText: (label) => label,
      })
    })

    test('Suggest variable completions for one level of incomplete paths', async () => {
      await testCompletions({
        labels: ['input', 'context', 'result'],
        json: globalJsonataDocument,
        // Lambda2.Assign.var_lambda2
        position: [22, 35],
        start: [22, 27],
        end: [22, 34],
        labelToInsertText: (label) => `$states.${label}`,
      })
    })

    test('Suggest variable completions for multi-level incomplete paths', async () => {
      await testCompletions({
        labels: ['Execution', 'State', 'StateMachine', 'Task'],
        json: globalJsonataDocument,
        // Lambda2.Assign.var_lambda3
        position: [23, 43],
        start: [23, 27],
        end: [23, 42],
        labelToInsertText: (label) => `$states.context.${label}`,
      })
    })

    test('Suggest variable completions for one level partial paths', async () => {
      await testCompletions({
        labels: ['input', 'context', 'result'],
        json: globalJsonataDocument,
        // Lambda2.Assign.var_lambda4
        position: [24, 39],
        start: [24, 27],
        end: [24, 38],
        labelToInsertText: (label) => `$states.${label}`,
      })
    })

    test('Suggest variable completions for multi-level partial paths', async () => {
      await testCompletions({
        labels: ['Execution', 'State', 'StateMachine', 'Task'],
        json: globalJsonataDocument,
        // Lambda2.Assign.var_lambda5
        position: [25, 44],
        start: [25, 27],
        end: [25, 43],
        labelToInsertText: (label) => `$states.context.${label}`,
      })
    })

    test('Does not suggest if JSONata is invalid', async () => {
      await testCompletions({
        labels: [],
        json: globalJsonataDocument,
        // Lambda2.Assign.var_lambda6
        position: [26, 32],
        start: [-1, -1],
        end: [-1, -1],
        labelToInsertText: (label) => label,
      })
    })

    test('Does not suggest if not inside a state', async () => {
      await testCompletions({
        labels: [],
        json: globalJsonataDocument,
        // Comment field
        position: [2, 17],
        start: [-1, -1],
        end: [-1, -1],
        labelToInsertText: (label) => label,
      })
    })
  })
})
