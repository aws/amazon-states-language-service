/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

export const emptyDocument = ''

export const documentWithPartialTopLevel = `
St
`

export const documentWithStates = `

StartAt:

States:
\u0020\u0020
`

export const document1 = `
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
export const document2 = `
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

export const document3 = `
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
export const document4 = `
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

export const documentNested = `
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
export const completionsEdgeCase1 = `
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

export const completionsEdgeCase2 = `
  StartAt: MyState
  States:

`

export const snippetsCompletionCase1 = `
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

export const snippetsCompletionCase2 = `
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

export const snippetsCompletionCase3 = `
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

export const snippetsCompletionCase4 = `
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

export const snippetsCompletionCase5 = `
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

export const snippetsCompletionWithinMap = `
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

export const snippetsCompletionWithinParallel = `
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

export const catchRetrySnippetsCompletionWithinMap = `
StartAt: Map
States:
  Map:
    Type: Map
    Next: Final State
\u0020\u0020\u0020\u0020
    Iterator:
      StartAt: Pass
      States:
        Pass:
          Type: Pass
          Result: Done!
          End: true
  Final State:
    Type: Pass
    End: true
`

export const catchRetrySnippetsCompletionWithinParallel = `
StartAt: Parallel
States:
  Parallel:
\u0020\u0020\u0020\u0020
    Type: Parallel
    Next: Final State
    Branches:
    - StartAt: Wait 20s
      States:
        Wait 20s:
          Type: Wait
          Seconds: 20
          End: true
  Final State:
    Type: Pass
    End: true
\u0020\u0020\u0020\u0020
\u0020\u0020
`

export const catchRetrySnippetsCompletionWithinTask = `
StartAt: FirstState
States:
  FirstState:
    Type: Task

\u0020\u0020\u0020\u0020

    Resource: 'arn:aws:lambda:REGION:ACCOUNT_ID:function:FUNCTION_NAME'
    End: true
`

export const topLevelLabels = ['Version', 'Comment', 'TimeoutSeconds', 'StartAt', 'States', 'QueryLanguage']
export const stateSnippetLabels = [
  'Pass State',
  'Lambda Task State',
  'EventBridge Task State',
  'MediaConvert Task State',
  'SNS Task State',
  'Batch Task State',
  'ECS Task State',
  'SQS Task State',
  'Choice State',
  'Wait State',
  'Succeed State',
  'Fail State',
  'Parallel State',
  'Map State',
]

export const stateNameLabels = [
  'FirstState',
  'ChoiceState',
  'FirstMatchState',
  'SecondMatchState',
  'DefaultState',
  'NextState',
  'ChoiceStateX',
]
export const nestedItemLabels = ['Nested1', 'Nested2', 'Nested3', 'Nested4']

export const passSnippetYaml =
  '${1:PassState}:\n\tType: Pass\n\tResult:\n\t\tdata1: 0.5\n\t\tdata2: 1.5\n\tResultPath: $.result\n\tNext: ${2:NextState}\n'
