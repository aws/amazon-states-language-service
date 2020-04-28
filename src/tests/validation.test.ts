/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import * as assert from 'assert';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { MESSAGES } from '../constants/diagnosticStrings'
import { getLanguageService, Position, Range } from '../service'

import {
  documentChoiceDefaultBeforeChoice,
  documentChoiceInvalidDefault,
  documentChoiceInvalidNext,
  documentChoiceNoDefault,
  documentChoiceValidDefault,
  documentChoiceValidNext,
  documentInvalidNext,
  documentInvalidNextNested,
  documentInvalidPropertiesCatch,
  documentInvalidPropertiesChoices,
  documentInvalidPropertiesState,
  documentNestedNoTerminalState,
  documentNestedUnreachableState,
  documentNoTerminalState,
  documentParallelCatchTemplate,
  documentParallelCatchTemplateInvalidNext,
  documentStartAtInvalid,
  documentStartAtNestedInvalid,
  documentStartAtValid,
  documentSucceedFailTerminalState,
  documentTaskCatchTemplate,
  documentTaskCatchTemplateInvalidNext,
  documentUnreachableState,
  documentValidNext,
} from './json-strings/validationStrings'

import { toDocument } from './utils/testUtilities'

export interface TestValidationOptions {
    json: string,
    diagnostics: {
        message: string,
        start: [number, number],
        end: [number, number]
    }[],
    filterMessages?: string[]
}

async function getValidations(json: string) {
    const { textDoc, jsonDoc } = toDocument(json);
    const ls = getLanguageService({});

    return await ls.doValidation(textDoc, jsonDoc)
}

async function testValidations(options: TestValidationOptions) {
    const { json, diagnostics, filterMessages } = options

    let res = await getValidations(json)

    res = res.filter(diagnostic => {
        if (filterMessages && filterMessages.find(message => message === diagnostic.message) ) {
            return false
        }

        return true
    })

    assert.strictEqual(res.length, diagnostics.length)

    res.forEach((item, index) => {
        const leftPos = Position.create(...diagnostics[index].start)
        const rightPos = Position.create(...diagnostics[index].end)

        const diagnostic = Diagnostic.create(
            Range.create(leftPos, rightPos),
            diagnostics[index].message,
            DiagnosticSeverity.Error
        )

        assert.deepStrictEqual(diagnostic, item)
    })

}

suite('ASL context-aware validation', () => {
    suite('Invalid JSON Input', () => {
      test("Empty string doesn't throw errors", async () => {
        await getValidations('')
      })

      test("[] string doesn't throw type errors", async () => {
        await assert.doesNotReject(
          getValidations('[]'),
          TypeError
        )
      })
    })

    suite('Default of Choice state', () => {
        test('Shows diagnostic for invalid state name', async () => {
            await testValidations({
                json: documentChoiceInvalidDefault,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_DEFAULT,
                        start: [17, 21],
                        end: [17, 41]
                    },
                    {
                        message: MESSAGES.UNREACHABLE_STATE,
                        start: [24, 6],
                        end: [24, 20]
                    },
                ],
            })

        })

        test('Doesn\'t show Diagnostic for valid state name', async () => {
            await testValidations({
                json: documentChoiceValidDefault,
                diagnostics: []
            })
        })

        test('Doesn\'t show Diagnostic when default property is absent', async () => {
            await testValidations({
                json: documentChoiceNoDefault,
                diagnostics: []
            })
        })

        test('Doesn\'t show Diagnostic for valid state name when default state is declared before Choice state', async () => {
            await testValidations({
                json: documentChoiceDefaultBeforeChoice,
                diagnostics: []
            })
        })
    })

    suite('StartAt', () => {
        test('Shows Diagnostic for state name that doesn\'t exist', async () => {
            await testValidations({
                json: documentStartAtInvalid,
                diagnostics: [{
                    message: MESSAGES.INVALID_START_AT,
                    start: [1, 13],
                    end: [1, 20]
                }],
                filterMessages: [MESSAGES.UNREACHABLE_STATE, MESSAGES.NO_TERMINAL_STATE]
            })
        })

        test('Doesn\'t show Diagnostic for valid state name', async () => {
            await testValidations({
                json: documentStartAtValid,
                diagnostics: []
            })
        })

        test('Shows Diagnostic for state name that doesn\'t exist in nested StartAt property', async () => {
            await testValidations({
                json: documentStartAtNestedInvalid,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_START_AT,
                        start: [8, 21],
                        end: [8, 26]
                    },
                    {
                        message: MESSAGES.INVALID_START_AT,
                        start: [31, 23],
                        end: [31, 29]
                    },
                ],
                filterMessages: [MESSAGES.UNREACHABLE_STATE, MESSAGES.NO_TERMINAL_STATE]
            })
        })
    })

    suite('Next', () => {
        test('Shows Diagnostic for state name that doesn\'t exist', async () => {
            await testValidations({
                json: documentInvalidNext,
                diagnostics: [{
                    message: MESSAGES.INVALID_NEXT,
                    start: [5, 14],
                    end: [5, 20]
                }],
                filterMessages: [MESSAGES.UNREACHABLE_STATE, MESSAGES.NO_TERMINAL_STATE]
            })
        })

        test('Doesn\'t show Diagnostic for valid state name', async () => {
            await testValidations({
                json: documentValidNext,
                diagnostics: [],
                filterMessages: [MESSAGES.UNREACHABLE_STATE, MESSAGES.NO_TERMINAL_STATE]
            })
        })

        test('Shows Diagnostic for state name that doesn\'t exist in nested Next property', async () => {
            await testValidations({
                json: documentInvalidNextNested,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_NEXT,
                        start: [12, 22],
                        end: [12, 35]
                    },
                    {
                        message: MESSAGES.INVALID_NEXT,
                        start: [43, 20],
                        end: [43, 33]
                    },
                ],
                filterMessages: [MESSAGES.UNREACHABLE_STATE, MESSAGES.NO_TERMINAL_STATE]
            })
        })

        test('Validates next property of the Choice state', async () => {
            await testValidations({
                json: documentChoiceInvalidNext,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_NEXT,
                        start: [20, 26],
                        end: [20, 30]
                    },
                ],
                filterMessages: [MESSAGES.UNREACHABLE_STATE, MESSAGES.NO_TERMINAL_STATE]
            })
        })
    })

    suite('Unreachable State', () => {
        test('Shows diagnostic for an unreachable state', async () => {
            await testValidations({
                json: documentUnreachableState,
                diagnostics: [
                    {
                        message: MESSAGES.UNREACHABLE_STATE,
                        start: [3, 4],
                        end: [3, 13]
                    },
                    {
                        message: MESSAGES.UNREACHABLE_STATE,
                        start: [15, 4],
                        end: [15, 16]
                    },
                    {
                        message: MESSAGES.UNREACHABLE_STATE,
                        start: [19, 4],
                        end: [19, 17]
                    },
                ],
                filterMessages: [MESSAGES.NO_TERMINAL_STATE, MESSAGES.INVALID_START_AT]
            })
        })

        test('Shows diagnostic for an unreachable state in nested list of states', async () => {
            await testValidations({
                json: documentNestedUnreachableState,
                diagnostics: [
                    {
                        message: MESSAGES.UNREACHABLE_STATE,
                        start: [14, 12],
                        end: [14, 20]
                    },
                    {
                        message: MESSAGES.UNREACHABLE_STATE,
                        start: [45, 10],
                        end: [45, 18]
                    }
                ],
                filterMessages: [MESSAGES.NO_TERMINAL_STATE]
            })
        })
    })

    suite('Terminal State', () => {
        test('Shows diagnostic for lack of terminal state', async () => {
            await testValidations({
                json: documentNoTerminalState,
                diagnostics: [{
                    message: MESSAGES.NO_TERMINAL_STATE,
                    start: [2, 2],
                    end: [2, 10]
                }]
            })
        })

        test('Shows diagnostic for lack of terminal state in nested list of states', async () => {
            await testValidations({
                json: documentNestedNoTerminalState,
                diagnostics: [
                    {
                      message: MESSAGES.NO_TERMINAL_STATE,
                      start: [22, 10],
                      end: [22, 18]
                    },
                    {
                      message: MESSAGES.NO_TERMINAL_STATE,
                      start: [40, 8],
                      end: [40, 16]
                    },
               ],
               filterMessages: [MESSAGES.UNREACHABLE_STATE]
            })
        })

        test('Accepts "Succeed" and "Fail" state as terminal states', async () => {
            await testValidations({
                json: documentSucceedFailTerminalState,
                diagnostics: []
            })
        })

        test('No terminal state error when state referenced from next property of Choice state within Parallel state', async () => {
            await testValidations({
                json: documentChoiceValidNext,
                diagnostics: []
            })
        })
    })

    suite('Catch property of "Parallel" and "Task" state', async () => {
      test('Does not show diagnostic on valid next property within Catch block of Task state', async () => {
        await testValidations({
            json: documentTaskCatchTemplate,
            diagnostics: []
        })
      })

      test('Does not show diagnostic on valid next property within Catch block of Parallel state', async () => {
        await testValidations({
            json: documentParallelCatchTemplate,
            diagnostics: []
        })
      })

      test('Shows diagnostics on invalid next property within Catch block of Task state', async () => {
        await testValidations({
            json: documentTaskCatchTemplateInvalidNext,
            diagnostics: [
                {
                    message: MESSAGES.INVALID_NEXT,
                    start: [18, 26],
                    end: [18, 40]
                },
                {
                    message: MESSAGES.INVALID_NEXT,
                    start: [24, 26],
                    end: [24, 44]
                },
            ],
            filterMessages: [MESSAGES.UNREACHABLE_STATE]
        })
      })

      test('Shows diagnostics on invalid next property within Catch block o Parallel', async () => {
        await testValidations({
            json: documentParallelCatchTemplateInvalidNext,
            diagnostics: [
                {
                    message: MESSAGES.INVALID_NEXT,
                    start: [11, 18],
                    end: [11, 28]
                }
            ],
            filterMessages: [MESSAGES.UNREACHABLE_STATE]
        })
      })
    })

    suite('Additional properties that are not valid', async () => {
        test('Shows diagnostics for additional invalid properties of a given state', async () => {
            await testValidations({
                json: documentInvalidPropertiesState,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [7, 10],
                        end: [7, 29]
                    },
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [8, 10],
                        end: [8, 29]
                    }
                ],
                filterMessages: [MESSAGES.UNREACHABLE_STATE]
            })
        })

        test('Shows diagnostics for additional invalid properties within Catch block', async () => {
            await testValidations({
                json: documentInvalidPropertiesCatch,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [12, 20],
                        end: [12, 32]
                    },
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [19, 20],
                        end: [19, 32]
                    },
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [20, 20],
                        end: [20, 34]
                    }
                ],
                filterMessages: [MESSAGES.UNREACHABLE_STATE]
            })
        })

        test('Shows diagnostics for additional invalid properties within Choice state', async () => {
            await testValidations({
                json: documentInvalidPropertiesChoices,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [17, 22],
                        end: [17, 40]
                    },
                    {
                        message: MESSAGES.MUTUALLY_EXCLUSIVE_PROPERTIES + 'StringEquals, NumericGreaterThanEquals',
                        start: [15, 22],
                        end: [15, 36]
                    },
                    {
                        message: MESSAGES.MUTUALLY_EXCLUSIVE_PROPERTIES + 'StringEquals, NumericGreaterThanEquals',
                        start: [16, 22],
                        end: [16, 48]
                    },
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [23, 18],
                        end: [23, 37]
                    },
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [29, 30],
                        end: [29, 48]
                    },
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [37, 34],
                        end: [37, 53]
                    },
                ],
                filterMessages: [MESSAGES.UNREACHABLE_STATE, 'Matches multiple schemas when only one must validate.']
            })
        })
    })
})
