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
    documentChoiceNextBeforeChoice,
    documentChoiceNoDefault,
    documentChoiceValidDefault,
    documentChoiceValidNext,
    documentChoiceWaitJSONata,
    documentChoiceWithAssign,
    documentDistributedMapInvalidNextInNestedState,
    documentFailCauseAndCausePathInvalid,
    documentFailCausePathJsonPathInvalid,
    documentFailErrorAndCausePathValid,
    documentFailErrorAndCauseValid,
    documentFailErrorAndErrorPathInvalid,
    documentFailErrorAndNoCauseValid,
    documentFailErrorPathAndCausePathContextValid,
    documentFailErrorPathAndCausePathIntrinsicInvalid,
    documentFailErrorPathAndCausePathIntrinsicNestedValid,
    documentFailErrorPathAndCausePathIntrinsicValid,
    documentFailErrorPathAndCausePathJsonPathInvalid,
    documentFailErrorPathAndCausePathValid,
    documentFailErrorPathAndCauseValid,
    documentFailErrorPathAndNoCauseValid,
    documentFailErrorPathJsonPathInvalid,
    documentFailNoErrorAndCausePathValid,
    documentFailNoErrorAndCauseValid,
    documentFailNoErrorAndNoCauseValid,
    documentInvalidFailWithAssign,
    documentInvalidNext,
    documentInvalidNextNested,
    documentInvalidParametersIntrinsicFunction,
    documentInvalidParametersJsonPath,
    documentInvalidPropertiesCatch,
    documentInvalidPropertiesChoices,
    documentInvalidPropertiesRoot,
    documentInvalidPropertiesRootNested,
    documentInvalidPropertiesState,
    documentInvalidResultSelectorIntrinsicFunction,
    documentInvalidResultSelectorJsonPath,
    documentInvalidSuccessWithAssign,
    documentMapCatchTemplate,
    documentMapCatchTemplateInvalidNext,
    documentMapInvalidItemProcessorConfig,
    documentMapJSONata,
    documentMapProcessorConfig,
    documentMapWithAssign,
    documentNestedNoTerminalState,
    documentNestedUnreachableState,
    documentNoTerminalState,
    documentParallelCatchTemplate,
    documentParallelCatchTemplateInvalidNext,
    documentParallelPassSuccessJSONata,
    documentParallelWithAssign,
    documentPassWithAssign,
    documentStartAtInvalid,
    documentStartAtNestedInvalid,
    documentStartAtValid,
    documentSucceedFailTerminalState,
    documentTaskCatchTemplate,
    documentTaskCatchTemplateInvalidNext,
    documentTaskInvalidArn,
    documentTaskJSONata,
    documentTaskJSONataInvalid,
    documentTaskRetryInvalid,
    documentTaskRetryValid,
    documentTaskValidVariableSubstitution,
    documentTaskWithAssign,
    documentUnreachableState,
    documentValidAslImprovements,
    documentValidNext,
    documentValidParametersIntrinsicFunction,
    documentValidParametersJsonPath,
    documentValidResultSelectorIntrinsicFunction,
    documentValidResultSelectorJsonPath
} from './json-strings/validationStrings'

import { toDocument } from './utils/testUtilities'

const JSON_SCHEMA_MULTIPLE_SCHEMAS_MSG = 'Matches multiple schemas when only one must validate.'

export interface TestValidationOptions {
    json: string,
    diagnostics: {
        message: string,
        start: [number, number],
        end: [number, number],
        code?: string | number | undefined
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
        if (filterMessages && filterMessages.find(message => message === diagnostic.message)) {
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
            DiagnosticSeverity.Error,
            diagnostics[index].code
        )

        assert.deepStrictEqual(diagnostic, item)
    })

}

describe('ASL context-aware validation', () => {
    describe('Invalid JSON Input', () => {
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

    describe('Default of Choice state', () => {
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

    describe('StartAt', () => {
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

    describe('Map State', () => {

        test('Doesn\'t show diagnostics for valid processor config', async () => {
            await testValidations({
                json: documentMapProcessorConfig,
                diagnostics: []
            })
        })

        test('Shows diagnostics on ItemProcessor that does not have required states', async () => {
            await testValidations({
                json: documentMapInvalidItemProcessorConfig,
                diagnostics: [{
                    message: 'Missing property "StartAt".',
                    start: [10, 10],
                    end: [10, 25]
                },
                {
                    message: 'Missing property "States".',
                    start: [10, 10],
                    end: [10, 25]
                },]
            })
        })

    })

    describe('Next', () => {
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

        test('Doesn\'t show Diagnostic for valid state name when Next state is declared before Choice state', async () => {
            await testValidations({
                json: documentChoiceNextBeforeChoice,
                diagnostics: []
            })
        })
    })

    describe('Unreachable State', () => {
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

    describe('Terminal State', () => {
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

    describe('Catch property of "Parallel" and "Task" state', () => {
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

        test('Does not show diagnostic on valid next property within Catch block of Map state', async () => {
            await testValidations({
                json: documentMapCatchTemplate,
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

        test('Shows diagnostics on invalid next property within Catch block of Parallel', async () => {
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

        test('Shows diagnostics on invalid next property within Catch block of Map', async () => {
            await testValidations({
                json: documentMapCatchTemplateInvalidNext,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_NEXT,
                        start: [25, 26],
                        end: [25, 35]
                    },
                    {
                        message: MESSAGES.INVALID_NEXT,
                        start: [37, 26],
                        end: [37, 36],
                    },
                ],
                filterMessages: [MESSAGES.UNREACHABLE_STATE]
            })
        })

        test('Shows diagnostics on invalid next property of a nested state withing DistributedMap', async () => {
            await testValidations({
                json: documentDistributedMapInvalidNextInNestedState,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_NEXT,
                        start: [16, 30],
                        end: [16, 53],
                    },
                    {
                        message: MESSAGES.NO_TERMINAL_STATE,
                        start: [12, 14],
                        end: [12, 22],
                    },
                ],
            })
        })
    })

    describe('Additional properties that are not valid', () => {
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
                        message: MESSAGES.MUTUALLY_EXCLUSIVE_CHOICE_PROPERTIES,
                        start: [15, 22],
                        end: [15, 36]
                    },
                    {
                        message: MESSAGES.MUTUALLY_EXCLUSIVE_CHOICE_PROPERTIES,
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
                        start: [30, 30],
                        end: [30, 36]
                    },
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [38, 34],
                        end: [38, 53]
                    },
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [39, 34],
                        end: [39, 40]
                    },
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [50, 24],
                        end: [50, 30]
                    },
                ],
                filterMessages: [MESSAGES.UNREACHABLE_STATE, JSON_SCHEMA_MULTIPLE_SCHEMAS_MSG]

            })

        })

        test('Shows diagnostics for additional invalid properties within root of state machine', async () => {
            await testValidations({
                json: documentInvalidPropertiesRoot,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [5, 2],
                        end: [5, 20]
                    }
                ]
            })
        })

        test('Shows diagnostics for additional invalid properties within root of nested state machine', async () => {
            await testValidations({
                json: documentInvalidPropertiesRootNested,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [10, 14],
                        end: [10, 27]
                    }
                ]
            })
        })
    })

    describe('Test validation of Resource arn for Task State', () => {
        test('Does not show diagnostic on invalid arn', async () => {
            await testValidations({
                json: documentTaskInvalidArn,
                diagnostics: []
            })
        })

        test('Does not show diagnostic on valid variable substitution', async () => {
            await testValidations({
                json: documentTaskValidVariableSubstitution,
                diagnostics: []
            })
        })
    })

    describe('Test validation of Properties field', () => {
        test('Does not show diagnostics for valid JSON paths', async () => {
            await testValidations({
                json: documentValidParametersJsonPath,
                diagnostics: []
            })
        })

        test('Does not show diagnostics for valid Intrinsic Functions', async () => {
            await testValidations({
                json: documentValidParametersIntrinsicFunction,
                diagnostics: []
            })
        })

        test('Shows diagnostics for invalid JSON paths', async () => {
            await testValidations({
                json: documentInvalidParametersJsonPath,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [10, 29],
                        end: [10, 31]
                    },
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [13, 40],
                        end: [13, 42]
                    },
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [14, 40],
                        end: [14, 44]
                    },
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [17, 29],
                        end: [17, 38]
                    },
                ]
            })
        })

        test('Shows diagnostics for invalid Intrinsic Functions', async () => {
            await testValidations({
                json: documentInvalidParametersIntrinsicFunction,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [10, 22],
                        end: [10, 76]
                    },
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [11, 22],
                        end: [11, 45]
                    },
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [12, 22],
                        end: [12, 54]
                    },
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [13, 22],
                        end: [13, 32]
                    },
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [14, 22],
                        end: [14, 39]
                    },
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [15, 22],
                        end: [15, 42]
                    },
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [16, 22],
                        end: [16, 47]
                    },
                ]
            })
        })
    })

    describe('ASL Improvements', () => {
        test('Does not show diagnostics for valid document containing ASL Improvements', async () => {
            await testValidations({
                json: documentValidAslImprovements,
                diagnostics: []
            })
        })

        describe('Test validation of ResultSelector field', () => {
            test('Does not show diagnostics for valid JSON paths', async () => {
                await testValidations({
                    json: documentValidResultSelectorJsonPath,
                    diagnostics: []
                })
            })

            test('Does not show diagnostics for valid Intrinsic Functions', async () => {
                await testValidations({
                    json: documentValidResultSelectorIntrinsicFunction,
                    diagnostics: []
                })
            })

            test('Shows diagnostics for invalid JSON paths', async () => {
                await testValidations({
                    json: documentInvalidResultSelectorJsonPath,
                    diagnostics: [
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                            start: [10, 29],
                            end: [10, 31]
                        },
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                            start: [13, 40],
                            end: [13, 42]
                        },
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                            start: [14, 40],
                            end: [14, 44]
                        },
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                            start: [17, 29],
                            end: [17, 38]
                        },
                    ]
                })
            })

            test('Shows diagnostics for invalid Intrinsic Functions', async () => {
                await testValidations({
                    json: documentInvalidResultSelectorIntrinsicFunction,
                    diagnostics: [
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                            start: [10, 22],
                            end: [10, 76]
                        },
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                            start: [11, 22],
                            end: [11, 45]
                        },
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                            start: [12, 22],
                            end: [12, 54]
                        },
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                            start: [13, 22],
                            end: [13, 32]
                        },
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                            start: [14, 22],
                            end: [14, 39]
                        },
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                            start: [15, 22],
                            end: [15, 42]
                        },
                    ]
                })
            })
        })
    });

    describe('Fail state', () => {
        describe('Valid Error, ErrorPath, Cause & CausePath combinations', () => {
            test('Fail state with Error and Cause valid', async () => {
                await testValidations({
                    json: documentFailErrorAndCauseValid,
                    diagnostics: []
                })
            })

            test('Fail state with Error and no Cause valid', async () => {
                await testValidations({
                    json: documentFailErrorAndNoCauseValid,
                    diagnostics: []
                })
            })

            test('Fail state with no Error and Cause valid', async () => {
                await testValidations({
                    json: documentFailNoErrorAndCauseValid,
                    diagnostics: []
                })
            })

            test('Fail state with neither Error nor Cause valid', async () => {
                await testValidations({
                    json: documentFailNoErrorAndNoCauseValid,
                    diagnostics: []
                })
            })

            test('Fail state with ErrorPath and CausePath valid', async () => {
                await testValidations({
                    json: documentFailErrorPathAndCausePathValid,
                    diagnostics: []
                })
            })

            test('Fail state with ErrorPath and Cause valid', async () => {
                await testValidations({
                    json: documentFailErrorPathAndCauseValid,
                    diagnostics: []
                })
            })

            test('Fail state with Error and CausePath valid', async () => {
                await testValidations({
                    json: documentFailErrorAndCausePathValid,
                    diagnostics: []
                })
            })

            test('Fail state with ErrorPath and no Cause valid', async () => {
                await testValidations({
                    json: documentFailErrorPathAndNoCauseValid,
                    diagnostics: []
                })
            })

            test('Fail state with no Error and CausePath valid', async () => {
                await testValidations({
                    json: documentFailNoErrorAndCausePathValid,
                    diagnostics: []
                })
            })
        });

        describe('JsonPath, Context Object and Intrinsic Functions', () => {
            test('Fail state ErrorPath and CausePath Context object valid', async () => {
                await testValidations({
                    json: documentFailErrorPathAndCausePathContextValid,
                    diagnostics: []
                })
            })

            test('Fail state ErrorPath and CausePath Intrinsic functions valid', async () => {
                await testValidations({
                    json: documentFailErrorPathAndCausePathIntrinsicValid,
                    diagnostics: []
                })
            })

            test('Fail state ErrorPath and CausePath Intrinsic functions valid', async () => {
                await testValidations({
                    json: documentFailErrorPathAndCausePathIntrinsicNestedValid,
                    diagnostics: []
                })
            })

            test('Fail state ErrorPath and CausePath Intrinsic functions invalid', async () => {
                await testValidations({
                    json: documentFailErrorPathAndCausePathIntrinsicInvalid,
                    diagnostics: [
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC_STRING_ONLY,
                            start: [6, 10],
                            end: [6, 65]
                        },
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC_STRING_ONLY,
                            start: [7, 10],
                            end: [7, 57]
                        },
                    ]
                })
            })

            test('Fail state ErrorPath and CausePath JSONPath invalid', async () => {
                await testValidations({
                    json: documentFailErrorPathAndCausePathJsonPathInvalid,
                    diagnostics: [
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC_STRING_ONLY,
                            start: [6, 10],
                            end: [6, 30]
                        },
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC_STRING_ONLY,
                            start: [7, 10],
                            end: [7, 30]
                        },
                    ]
                })
            })

            test('Fail state ErrorPath JSONPath invalid', async () => {
                await testValidations({
                    json: documentFailErrorPathJsonPathInvalid,
                    diagnostics: [
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC_STRING_ONLY,
                            start: [6, 10],
                            end: [6, 30]
                        }
                    ]
                })
            })

            test('Fail state CausePath JSONPath invalid', async () => {
                await testValidations({
                    json: documentFailCausePathJsonPathInvalid,
                    diagnostics: [
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC_STRING_ONLY,
                            start: [7, 10],
                            end: [7, 30]
                        }
                    ]
                })
            })

        });

        describe('Invalid Error, ErrorPath, Cause & CausePath combinations', () => {
            test('Fail state Error and ErrorPath combination invalid', async () => {
                await testValidations({
                    json: documentFailErrorAndErrorPathInvalid,
                    diagnostics: [
                        {
                            message: 'You cannot set both Error and ErrorPath at the same time.',
                            start: [7, 10],
                            end: [7, 32]
                        }
                    ]
                })
            })

            test('Fail state Cause and CausePath combination invalid', async () => {
                await testValidations({
                    json: documentFailCauseAndCausePathInvalid,
                    diagnostics: [
                        {
                            message: 'You cannot set both Cause and CausePath at the same time.',
                            start: [7, 10],
                            end: [7, 32]
                        }
                    ]
                })
            })
        });
    });

    describe('Retry', () => {
        describe('Task retry', () => {
            test('Task retry valid', async () => {
                await testValidations({
                    json: documentTaskRetryValid,
                    diagnostics: []
                })
            })

            test('Task retry invalid', async () => {
                await testValidations({
                    json: documentTaskRetryInvalid,
                    diagnostics: [
                        {
                            message: 'Value is below the minimum of 0.',
                            start: [10, 29],
                            end: [10, 31]
                        },
                        {
                            message: 'Incorrect type. Expected "integer".',
                            start: [14, 33],
                            end: [14, 36]
                        },
                        {
                            message: 'Value is below the minimum of 1.',
                            start: [18, 29],
                            end: [18, 31]
                        },
                        {
                            message: 'Incorrect type. Expected "integer".',
                            start: [22, 29],
                            end: [22, 33]
                        },
                        {
                            message: 'Value is below the minimum of 1.',
                            start: [26, 33],
                            end: [26, 34]
                        },
                        {
                            message: 'Incorrect type. Expected "integer".',
                            start: [30, 33],
                            end: [30, 36]
                        },
                        {
                            message: 'Value is above the maximum of 31622400.',
                            start: [34, 33],
                            end: [34, 41]
                        },
                        {
                            message: 'Value is not accepted. Valid values: "FULL", "NONE".',
                            start: [38, 32],
                            end: [38, 41],
                            code: 1
                        },
                        {
                            message: 'Value is below the minimum of 1.',
                            start: [45, 33],
                            end: [45, 35]
                        },
                        {
                            message: 'Value is not accepted. Valid values: "FULL", "NONE".',
                            start: [46, 32],
                            end: [46, 38],
                            code: 1
                        },
                    ]
                })
            })
        });
    });

    describe('Test validation with JSONata fields', () => {
        test('does not show diagnostic error on valid states', async () => {
            const validJSONataStates = [
                documentTaskJSONata,
                documentMapJSONata,
                documentParallelPassSuccessJSONata,
                documentChoiceWaitJSONata,
            ]

            validJSONataStates.forEach(async (definition) => {
                await testValidations({
                    json: definition,
                    diagnostics: []
                })
            })
        })

        test('does show diagnostic error on invalid Task state', async () => {
            await testValidations({
                json: documentTaskJSONataInvalid,
                diagnostics: [{
                    message: 'Value is not accepted. Valid values: "JSONata", "JSONPath".',
                    start: [5, 23],
                    end: [5, 33],
                    code: 1
                }, {
                    message: 'Incorrect type. Expected one of integer, JSONata expression.',
                    start: [11, 24],
                    end: [11, 29]
                },
                {
                    message: 'Incorrect type. Expected one of integer, JSONata expression.',
                    start: [12, 26],
                    end: [12, 30],
                },
                {
                    message: 'Incorrect type. Expected one of object, JSONata expression.',
                    start: [9, 19],
                    end: [9, 22]
                },
                ]
            })
        })
    });

    describe('Assign property', () => {
        test('Should be valid for all state types', async () => {
            const testCases = [
                documentTaskWithAssign,
                documentMapWithAssign,
                documentChoiceWithAssign,
                documentParallelWithAssign,
                documentPassWithAssign
            ]
            for (const jsonForTestCase of testCases) {
                await testValidations({
                    json: jsonForTestCase,
                    diagnostics: []
                })
            }
        })

        test('Should be valid in choice state when it is added at top level', async () => {
            /* tslint:disable:no-unsafe-any */
            const asl = JSON.parse(documentChoiceWithAssign)
            asl.States.Choice.Assign = {}
            await testValidations({
                json: JSON.stringify(asl, undefined, 2),
                diagnostics: []
            })
        })

        test('Should be invalid when used in Success or Fail', async () => {
            await testValidations({
                json: documentInvalidSuccessWithAssign,
                diagnostics: [{
                    message: MESSAGES.INVALID_PROPERTY_NAME,
                    start: [6, 10],
                    end: [6, 18]
                }]
            })
            await testValidations({
                json: documentInvalidFailWithAssign,
                diagnostics: [{
                    message: MESSAGES.INVALID_PROPERTY_NAME,
                    start: [6, 10],
                    end: [6, 18]
                }]
            })
        })

        test('Should be valid if value is undefined', async () => {
            /* tslint:disable:no-unsafe-any */
            const asl = JSON.parse(documentTaskWithAssign)
            asl.States.HelloWorld.Assign = undefined
            await testValidations({
                json: JSON.stringify(asl, undefined, 2),
                diagnostics: []
            })
        })

        test('Should be invalid for all non-object types', async () => {
            const errorMessage = 'Incorrect type. Expected "object".'
            /* tslint:disable:no-null-keyword */
            const assignCases = [null, 'NO', 1234, true]
            for (const assignCase of assignCases) {
                /* tslint:disable:no-unsafe-any */
                const asl = JSON.parse(documentTaskWithAssign)
                asl.States.HelloWorld.Assign = assignCase
                await testValidations({
                    json: JSON.stringify(asl, undefined, 2),
                    diagnostics: [{
                        message: errorMessage,
                        start: [7, 16],
                        end: [7, 20]
                    }]
                })
            }

            /* tslint:disable:no-unsafe-any */
            const aslWithArrayForAssign = JSON.parse(documentTaskWithAssign)
            aslWithArrayForAssign.States.HelloWorld.Assign = ['']
            await testValidations({
                json: JSON.stringify(aslWithArrayForAssign, undefined, 2),
                diagnostics: [{
                    message: errorMessage,
                    start: [7, 16],
                    end: [9, 7]
                }]
            })
        })
    });
})
