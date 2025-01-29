/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

// tslint:disable:no-floating-promises

import * as assert from 'assert'
import { CompletionItemKind } from 'vscode-json-languageservice'
import { errorHandlingSnippets, stateSnippets } from '../completion/completeSnippets'
import { getLanguageService, Position, Range } from '../service'
import { asTextEdit, toDocument } from './utils/testUtilities'

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
}

interface TestScenario {
  json: string
  position: [number, number]
  start: [number, number]
  end: [number, number]
}

async function getCompletions(json: string, position: [number, number]) {
  const { textDoc, jsonDoc } = toDocument(json)
  const pos = Position.create(...position)
  const ls = getLanguageService({})

  return await ls.doComplete(textDoc, pos, jsonDoc)
}

async function testCompletions(options: TestCompletionOptions) {
  const { labels, json, position, start, end, labelToInsertText } = options

  const res = await getCompletions(json, position)

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
  const { json, position, start, end } = options
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
})
