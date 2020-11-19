/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import * as assert from 'assert'
import { CompletionItemKind } from 'vscode-json-languageservice'
import { stateSnippets } from '../completion/completeSnippets'
import { getYamlLanguageService, Position, Range } from '../service'
import { toDocument } from './utils/testUtilities'

const document1 = `
  StartAt:
  States:
    FirstState:
    ChoiceState:
    FirstMatchState:
    SecondMatchState:
    DefaultState:
    NextState:
      Next: ""
    ChoiceStateX:
      Type: Choice
      Choices:
        - Next: ""
        - Next: FirstState
        - Next: NextState
      Default: ""
`
const document2 = `
  StartAt:
  States:
    FirstState:
    ChoiceState:
    FirstMatchState:
    SecondMatchState:
    DefaultState:
    NextState:
      Next: ""
    ChoiceStateX:
      Type: Choice,
      Choices:
        - Next: ""
        - Next: FirstState
        - Next: NextState
      Default: ""
`

const document3 = `
  StartAt: ""
  States:
    FirstState:
    ChoiceState:
    FirstMatchState:
    SecondMatchState:
    DefaultState:
    NextState:
      Next: ""
    ChoiceStateX:
`
const document4 = `
  StartAt: First
  States:
    FirstState:
    ChoiceState:
    FirstMatchState:
    SecondMatchState:
    DefaultState:
    NextState:
      Next: First
    ChoiceStateX:
`

const documentNested = `
  StartAt: First
  States:
    FirstState:
    MapState:
      Iterator:
        StartAt: ""
        States:
          Nested1:
          Nested2:
          Nested3:
          Nested4:
            Next: ""
`
const completionsEdgeCase1 = `
  Comment: An example of the Amazon States Language using a map state to process elements of an array with a max concurrency of 2.
  StartAt: Map
  States:
    Map:
      Type: Map
      ItemsPath: $.array
      ResultPath: \\\$$$$$.array$$$
      MaxConcurrency: 2
      Next: Final State
      Iterator:
        StartAt: Pass
        States:
          Pass:
            Type: Pass
            Result: Done!
            End: true
    "Net 2":
      Type: Fail
      Next: Final State
    Final State:
      Type: Pass
      Next: "Net 2"
`

const completionsEdgeCase2 = `
  StartAt: MyState
  States:

`

const snippetsCompletionCase1 = `
StartAt: Hello
States:
\u0020\u0020
  Hello:
    Type: Pass
    Result: Hello
    Next: World

  World:
    Type: Pass
    Result: World
    End: true
`

const snippetsCompletionCase2 = `
StartAt: Hello
States:

  Hello:
    Type: Pass
    Result: Hello
    Next: World

  World:
    Type: Pass
    Result: World
    End: true
`

const snippetsCompletionCase3 = `
StartAt: Hello
States:
  Hello:
    Type: Pass
    Result: Hello
    Next: World
\u0020\u0020

  World:
    Type: Pass
    Result: World
    End: true
`

const snippetsCompletionCase4 = `
StartAt: Hello
States:
  Hello:
    Type: Pass
    Result: Hello
    Next: World

  World:
    Type: Pass
    Result: World
    End: true
\u0020\u0020\u0020\u0020
`

const snippetsCompletionCase5 = `
StartAt: Hello
States:
  Hello:
    Type: Pass
    Result: Hello
    Next: World

  World:
    Type: Pass
    Result: World
    End: true


\u0020\u0020
`

const snippetsCompletionWithinMap = `
StartAt: Map
States:
  Map:
    Type: Map
    Next: Final State
    Iterator:
      StartAt: Pass
      States:
        Pass:
          Type: Pass
          Result: Done!
          End: true
\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020
  Final State:
    Type: Pass
    End: true
`

const snippetsCompletionWithinParallel = `
StartAt: Parallel
States:
  Parallel:
    Type: Parallel
    Next: Final State
    Branches:
    - StartAt: Wait 20s
      States:
        Wait 20s:
          Type: Wait
          Seconds: 20
          End: true
\u0020\u0020\u0020\u0020\u0020\u0020\u0020\u0020
  Final State:
    Type: Pass
    End: true
`

const itemLabels = [
    'FirstState',
    'ChoiceState',
    'FirstMatchState',
    'SecondMatchState',
    'DefaultState',
    'NextState',
    'ChoiceStateX',
]
const nestedItemLabels = ['Nested1', 'Nested2', 'Nested3', 'Nested4']

interface TestCompletionOptions {
    labels: string[]
    json: string
    position: [number, number]
    start: [number, number]
    end: [number, number]
    labelToInsertText(label: string): string
}

async function getCompletions(json: string, position: [number, number]) {
    const { textDoc, jsonDoc } = toDocument(json)
    const pos = Position.create(...position)
    const ls = getYamlLanguageService({})

    return await ls.doComplete(textDoc, pos, jsonDoc)
}

async function testCompletions(options: TestCompletionOptions) {
    const { labels, json, position, start, end, labelToInsertText } = options

    const res = await getCompletions(json, position)

    assert.strictEqual(res?.items.length, labels.length)

    // space before quoted item
    const itemInsertTexts = labels.map(labelToInsertText)

    assert.deepEqual(
        res?.items.map(item => item.label),
        labels
    )
    assert.deepEqual(
        res?.items.map(item => item.textEdit?.newText),
        itemInsertTexts
    )

    const leftPos = Position.create(...start)
    const rightPos = Position.create(...end)

    res?.items.forEach(item => {
        assert.deepEqual(item.textEdit?.range, Range.create(leftPos, rightPos))
    })
}

interface TestScenario {
  json: string,
  position: [number, number],
  start: [number, number],
  end: [number, number],
}

export async function getSuggestedSnippets(options: TestScenario) {
  const { json, position } = options
  const { textDoc, jsonDoc } = toDocument(json)
  const pos = Position.create(...position)
  const ls = getYamlLanguageService({})
  const res = await ls.doComplete(textDoc, pos, jsonDoc)
  const suggestedSnippetLabels = res?.items.filter(item => item.kind === CompletionItemKind.Snippet).map(item => item.label)

  return suggestedSnippetLabels
}

suite('ASL YAML context-aware completion', () => {
    suite('StartAt', () => {
        test('Both quotation marks present and cursor between them', async () => {
            await testCompletions({
                labels: itemLabels,
                json: document3,
                position: [1, 12],
                start: [1, 12],
                end: [1, 13],
                labelToInsertText: label => `${label}"`,
            })
        })

        test('Suggests completions when text present and cursor is on it', async () => {
            await testCompletions({
                labels: itemLabels,
                json: document4,
                position: [1, 13],
                start: [1, 12],
                end: [1, 16],
                labelToInsertText: label => `${label}"`,
            })
        })

        test('Suggests nested completions when StartAt is nested within Map state', async () => {
            await testCompletions({
                labels: nestedItemLabels,
                json: documentNested,
                position: [6, 18],
                start: [6, 18],
                end: [6, 19],
                labelToInsertText: label => `${label}"`,
            })
        })
    })

    suite('Next', () => {
        test('Cursor after colon but no quotes', async () => {
            await testCompletions({
                // remove last label as it is the name of the current state
                labels: itemLabels.filter(label => label !== 'NextState'),
                json: document2,
                position: [9, 12],
                start: [9, 12],
                end: [9, 14],
                labelToInsertText: label => `"${label}"`,
            })
        })

        test('Both quotation marks present and cursor between them', async () => {
            await testCompletions({
                // remove last label as it is the name of the current state
                labels: itemLabels.filter(label => label !== 'NextState'),
                json: document3,
                position: [9, 13],
                start: [9, 13],
                end: [9, 14],
                labelToInsertText: label => `${label}"`,
            })
        })

        test('Suggests completions when text present and cursor is on it', async () => {
            await testCompletions({
                // remove last label as it is the name of the current state
                labels: itemLabels.filter(label => label !== 'NextState'),
                json: document4,
                position: [9, 18],
                start: [9, 16],
                end: [9, 17],
                labelToInsertText: label => `${label}"`,
            })
        })

        test('Suggests nested completions when Next is nested within Map state', async () => {
            await testCompletions({
                // remove last label as it is the name of the current state
                labels: nestedItemLabels.filter(label => label !== 'Nested4'),
                json: documentNested,
                position: [12, 21],
                start: [12, 19],
                end: [12, 20],
                labelToInsertText: label => `${label}"`,
            })
        })

        test('Suggests completions for the Next property within Choice state', async () => {
            await testCompletions({
                labels: itemLabels.filter(label => label !== 'ChoiceStateX'),
                json: document1,
                position: [13, 17],
                start: [13, 17],
                end: [13, 18],
                labelToInsertText: label => `${label}"`,
            })
        })
    })

    suite('Default', () => {
        test('Suggests completion items for Default property of the Choice state when cursor positioned after first quote', async () => {
            await testCompletions({
                labels: itemLabels.filter(label => label !== 'ChoiceStateX'),
                json: document1,
                position: [16, 16],
                start: [16, 16],
                end: [16, 17],
                labelToInsertText: label => `${label}"`,
            })
        })

        test('Suggests completion items for Default property of the Choice state when cursor is a space after colon', async () => {
            await testCompletions({
                labels: itemLabels.filter(label => label !== 'ChoiceStateX'),
                json: document2,
                position: [16, 15],
                start: [16, 15],
                end: [16, 17],
                labelToInsertText: label => `"${label}"`,
            })
        })
    })

    suite('Edge Cases', () => {
        test('Requested completion in state name position does not throw error', async () => {
            await assert.doesNotReject(getCompletions(completionsEdgeCase1, [17, 4]), TypeError)

            await assert.doesNotReject(getCompletions(completionsEdgeCase2, [3, 5]), TypeError)
        })
    })

    suite('Snippets', () => {
        test('Shows state snippets when cursor placed on first line after States prop with greater indendation', async () => {
          const expectedSnippets = stateSnippets.map(item => item.label)
          const suggestedSnippets = await getSuggestedSnippets({
            json: snippetsCompletionCase1,
            position: [3, 2],
            start: [3, 2],
            end: [3, 2]
          })

          assert.deepEqual(suggestedSnippets, expectedSnippets)
        })

        test('Does not show state snippets when cursor placed on first line after States prop with same indentation indendation', async () => {
          const suggestedSnippets = await getSuggestedSnippets({
            json: snippetsCompletionCase2,
            position: [3, 0],
            start: [3, 0],
            end: [3, 0]
          })

          assert.deepEqual(suggestedSnippets, [])
        })

        test('Shows state snippets when cursor placed on line after state declaration with the indentation same as the previous state name ', async () => {
          const expectedSnippets = stateSnippets.map(item => item.label)
          const suggestedSnippets = await getSuggestedSnippets({
            json: snippetsCompletionCase1,
            position: [7, 2],
            start: [7, 2],
            end: [7, 2]
          })

          assert.deepEqual(suggestedSnippets, expectedSnippets)
        })

        test('Does not show state snippets when cursor placed on line after state declaration with the indentation same as the nested state property name ', async () => {
          const suggestedSnippets = await getSuggestedSnippets({
            json: snippetsCompletionCase1,
            position: [7, 4],
            start: [7, 4],
            end: [7, 4]
          })

          assert.deepEqual(suggestedSnippets, [])
        })

        test('Shows state snippets when cursor placed 2 lines below last declared state machine with same indentation level as its name', async () => {
          const expectedSnippets = stateSnippets.map(item => item.label)
          const suggestedSnippets = await getSuggestedSnippets({
            json: snippetsCompletionCase5,
            position: [14, 2],
            start: [14, 2],
            end: [14, 2]
          })

          assert.deepEqual(suggestedSnippets, expectedSnippets)
        })

        test('Shows state snippets when cursor placed within States object of Map state', async () => {
          const expectedSnippets = stateSnippets.map(item => item.label)
          const suggestedSnippets = await getSuggestedSnippets({
            json: snippetsCompletionWithinMap,
            position: [13, 8],
            start: [13, 8],
            end: [13, 8]
          })

          assert.deepEqual(suggestedSnippets, expectedSnippets)
        })

        test('Shows state snippets when cursor placed within States object of Parallel state', async () => {
          const expectedSnippets = stateSnippets.map(item => item.label)
          const suggestedSnippets = await getSuggestedSnippets({
            json: snippetsCompletionWithinParallel,
            position: [13, 8],
            start: [13, 8],
            end: [13, 8]
          })

          assert.deepEqual(suggestedSnippets, expectedSnippets)
        })
    })
})
