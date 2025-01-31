/*!
 * Copyright 2025 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import {
  DistributedMapProcessingMode,
  getItemSelectorDefinition,
  getItemSelectorFieldName,
  getProcessorDefinition,
  getProcessorFieldName,
  isAslWithStates,
  isChoice,
  isChoiceWithChoices,
  isDistributedMap,
  isErrorHandled,
  isFail,
  isMap,
  isMapWithIterator,
  isNonTerminal,
  isParallel,
  isParallelWithBranches,
  isWithErrorHandled,
  isWithVariables,
  isPass,
  isPlaceholder,
  isSucceed,
  isTask,
  isTerminal,
  isWait,
  isWithParameters,
} from '../definitions'

describe('ASL definition type guards', () => {
  it('checks state types correctly', () => {
    // TODO: Separate each function into its own 'it' block
    expect(isPass({ Type: 'Pass' })).toBeTruthy()
    expect(isWait({ Type: 'Wait' })).toBeTruthy()
    expect(isFail({ Type: 'Fail' })).toBeTruthy()
    expect(isSucceed({ Type: 'Succeed' })).toBeTruthy()
    expect(isTask({ Type: 'Task' })).toBeTruthy()
    expect(isChoice({ Type: 'Choice' })).toBeTruthy()
    expect(isMap({ Type: 'Map' })).toBeTruthy()
    expect(isParallel({ Type: 'Parallel' })).toBeTruthy()
    expect(isPlaceholder({ Type: 'Placeholder', PlaceholderLabel: 'x' })).toBeTruthy()

    expect(isPass({ Type: 'Map' })).toBeFalsy()
    expect(isWait({ Type: 'Map' })).toBeFalsy()
    expect(isFail({ Type: 'Map' })).toBeFalsy()
    expect(isSucceed({ Type: 'Map' })).toBeFalsy()
    expect(isTask({ Type: 'Map' })).toBeFalsy()
    expect(isChoice({ Type: 'Map' })).toBeFalsy()
    expect(isMap({ Type: 'Parallel' })).toBeFalsy()
    expect(isParallel({ Type: 'Map' })).toBeFalsy()
    expect(isPlaceholder({ Type: 'Map' })).toBeFalsy()

    expect(isTerminal({ Type: 'Fail' })).toBeTruthy()
    expect(isTerminal({ Type: 'Succeed' })).toBeTruthy()
    expect(isTerminal({ Type: 'Pass' })).toBeFalsy()
    expect(isNonTerminal({ Type: 'Pass' })).toBeTruthy()

    expect(isErrorHandled({ Type: 'Map' })).toBeTruthy()
    expect(isErrorHandled({ Type: 'Task' })).toBeTruthy()
    expect(isErrorHandled({ Type: 'Parallel' })).toBeTruthy()
    expect(isErrorHandled({ Type: 'Pass' })).toBeFalsy()

    expect(isWithParameters({ Type: 'Map' })).toBeTruthy()
    expect(isWithParameters({ Type: 'Task' })).toBeTruthy()
    expect(isWithParameters({ Type: 'Parallel' })).toBeTruthy()
    expect(isWithParameters({ Type: 'Pass' })).toBeTruthy()
    expect(isWithParameters({ Type: 'Succeed' })).toBeFalsy()

    expect(isAslWithStates(null)).toBeFalsy()
    expect(isAslWithStates(undefined)).toBeFalsy()
    expect(isAslWithStates({})).toBeFalsy()
    expect(isAslWithStates({ States: {} })).toBeTruthy()

    expect(isChoiceWithChoices(null)).toBeFalsy()
    expect(isChoiceWithChoices(undefined)).toBeFalsy()
    expect(isChoiceWithChoices({ Type: 'Choice' })).toBeFalsy()
    expect(isChoiceWithChoices({ Type: 'Pass' })).toBeFalsy()
    expect(isChoiceWithChoices({ Type: 'Choice', Choices: [] })).toBeTruthy()

    expect(isMapWithIterator(null)).toBeFalsy()
    expect(isMapWithIterator(undefined)).toBeFalsy()
    expect(isMapWithIterator({ Type: 'Map' })).toBeFalsy()
    expect(isMapWithIterator({ Type: 'Pass' })).toBeFalsy()
    expect(isMapWithIterator({ Type: 'Map', Iterator: {} })).toBeTruthy()

    expect(isParallelWithBranches(null)).toBeFalsy()
    expect(isParallelWithBranches(undefined)).toBeFalsy()
    expect(isParallelWithBranches({ Type: 'Parallel' })).toBeFalsy()
    expect(isParallelWithBranches({ Type: 'Pass' })).toBeFalsy()
    expect(isParallelWithBranches({ Type: 'Parallel', Branches: [] })).toBeTruthy()

    expect(isWithVariables({ Type: 'Map' })).toBeTruthy()
    expect(isWithVariables({ Type: 'Task' })).toBeTruthy()
    expect(isWithVariables({ Type: 'Choice' })).toBeTruthy()
    expect(isWithVariables({ Type: 'Parallel' })).toBeTruthy()
    expect(isWithVariables({ Type: 'Pass' })).toBeTruthy()
    expect(isWithVariables({ Type: 'Wait' })).toBeTruthy()
    expect(isWithVariables({ Type: 'Succeed' })).toBeFalsy()
    expect(isWithVariables({ Type: 'Fail' })).toBeFalsy()

    expect(isWithErrorHandled({ Type: 'Map' })).toBeTruthy()
    expect(isWithErrorHandled({ Type: 'Task' })).toBeTruthy()
    expect(isWithErrorHandled({ Type: 'Choice' })).toBeFalsy()
    expect(isWithErrorHandled({ Type: 'Map' })).toBeTruthy()
    expect(isWithErrorHandled({ Type: 'Pass' })).toBeFalsy()
  })
  it('getProcessorDefinition', () => {
    expect(
      getProcessorDefinition({
        Type: 'Map',
        ItemProcessor: {
          ProcessorConfig: {
            Mode: DistributedMapProcessingMode.Distributed,
          },
          StartAt: 'parallel-b-3-1',
          States: {
            'parallel-b-3-1': {
              Type: 'Pass',
              End: true,
            },
          },
        },
      }),
    ).toStrictEqual({
      ProcessorConfig: {
        Mode: DistributedMapProcessingMode.Distributed,
      },
      StartAt: 'parallel-b-3-1',
      States: {
        'parallel-b-3-1': {
          Type: 'Pass',
          End: true,
        },
      },
    })
    expect(
      getProcessorDefinition({
        Type: 'Map',
        Iterator: {
          ProcessorConfig: {
            Mode: DistributedMapProcessingMode.Distributed,
          },
          StartAt: 'parallel-b-3-1',
          States: {
            'parallel-b-3-1': {
              Type: 'Pass',
              End: true,
            },
          },
        },
      }),
    ).toStrictEqual({
      ProcessorConfig: {
        Mode: DistributedMapProcessingMode.Distributed,
      },
      StartAt: 'parallel-b-3-1',
      States: {
        'parallel-b-3-1': {
          Type: 'Pass',
          End: true,
        },
      },
    })
  })

  it('getItemSelectorDefinition', () => {
    expect(
      getItemSelectorDefinition({
        Type: 'Map',
        ItemProcessor: {
          ProcessorConfig: {
            Mode: DistributedMapProcessingMode.Distributed,
          },
          StartAt: 'parallel-b-3-1',
          States: {
            'parallel-b-3-1': {
              Type: 'Pass',
              End: true,
            },
          },
        },
        ItemSelector: {
          a: 'a',
        },
      }),
    ).toStrictEqual({
      a: 'a',
    })
  })

  expect(
    getItemSelectorDefinition({
      Type: 'Map',
      Iterator: {
        ProcessorConfig: {
          Mode: DistributedMapProcessingMode.Distributed,
        },
        StartAt: 'parallel-b-3-1',
        States: {
          'parallel-b-3-1': {
            Type: 'Pass',
            End: true,
          },
        },
      },
      Parameters: {
        a: 'a',
      },
    }),
  ).toStrictEqual({
    a: 'a',
  })

  it('getItemSelectorFieldName', () => {
    expect(
      getItemSelectorFieldName({
        Type: 'Map',
        ItemProcessor: {
          ProcessorConfig: {
            Mode: DistributedMapProcessingMode.Distributed,
          },
          StartAt: 'parallel-b-3-1',
          States: {
            'parallel-b-3-1': {
              Type: 'Pass',
              End: true,
            },
          },
        },
        ItemSelector: {
          a: 'a',
        },
      }),
    ).toStrictEqual('ItemSelector')
  })

  expect(
    getItemSelectorFieldName({
      Type: 'Map',
      Iterator: {
        ProcessorConfig: {
          Mode: DistributedMapProcessingMode.Distributed,
        },
        StartAt: 'parallel-b-3-1',
        States: {
          'parallel-b-3-1': {
            Type: 'Pass',
            End: true,
          },
        },
      },
      Parameters: {
        a: 'a',
      },
    }),
  ).toStrictEqual('Parameters')

  it('isDistributedMap', () => {
    expect(
      isDistributedMap({
        Type: 'Map',
        Iterator: {
          ProcessorConfig: {
            Mode: DistributedMapProcessingMode.Distributed,
          },
          StartAt: 'parallel-b-3-1',
          States: {
            'parallel-b-3-1': {
              Type: 'Pass',
              End: true,
            },
          },
        },
      }),
    ).toBe(true)
    expect(
      isDistributedMap({
        Type: 'Map',
        Iterator: {
          StartAt: 'parallel-b-3-1',
          States: {
            'parallel-b-3-1': {
              Type: 'Pass',
              End: true,
            },
          },
        },
      }),
    ).toBe(true)
  })
  it('getProcessorFieldName', () => {
    expect(
      getProcessorFieldName({
        Type: 'Map',
        Iterator: {
          ProcessorConfig: {
            Mode: DistributedMapProcessingMode.Distributed,
          },
          StartAt: 'parallel-b-3-1',
          States: {
            'parallel-b-3-1': {
              Type: 'Pass',
              End: true,
            },
          },
        },
      }),
    ).toBe('Iterator')
    expect(
      getProcessorFieldName({
        Type: 'Map',
        ItemProcessor: {
          ProcessorConfig: {
            Mode: DistributedMapProcessingMode.Distributed,
          },
          StartAt: 'parallel-b-3-1',
          States: {
            'parallel-b-3-1': {
              Type: 'Pass',
              End: true,
            },
          },
        },
      }),
    ).toBe('ItemProcessor')
  })
})
