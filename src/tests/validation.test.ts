/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import * as assert from 'assert';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { getLanguageService, Position, Range } from '../service'
import { MESSAGES } from '../validation/validateStates'
import { toDocument } from './utils/testUtilities'

const documentStartAtInvalid = `{
  "StartAt": "First",
  "States": {
    "FirstState": {
      "Type": "Pass",
      "End": true
    }
  }
}`

const documentStartAtValid = `{
  "StartAt": "FirstState",
  "States": {
    "FirstState": {
      "Type": "Pass",
      "End": true
    }
  }
}`

const documentStartAtNestedInvalid = `{
  "StartAt": "LookupCustomerInfo",
  "States": {
    "LookupCustomerInfo": {
      "Type": "Parallel",
      "End": true,
      "Branches": [
        {
          "StartAt": "Loo",
          "States": {
            "LookupAddress": {
              "Type": "Pass",
              "End": true
            }
          }
        },
        {
          "StartAt": "LookupPhone",
          "States": {
            "LookupPhone": {
              "Type": "Pass",
              "End": true
            }
          }
        }
      ]
    },
    "Validate-All": {
        "Type": "Map",
        "ItemsPath": "$.items",
        "Iterator": {
            "StartAt": "Vali",
            "States": {
                "Validate": {
                    "Type": "Pass",
                    "End": true
                }
            }
        },
        "End": true
    }
  }
}`

const documentInvalidNext = `{
  "StartAt": "FirstState",
  "States": {
    "FirstState": {
      "Type": "Pass",
      "Next": "Next"
    },
    "NextState": {
      "Type": "Pass",
      "End": true
    }
  }
}`

const documentValidNext = `{
  "StartAt": "FirstState",
  "States": {
    "FirstState": {
      "Type": "Pass",
      "Next": "NextState"
    },
    "NextState": {
      "Type": "Pass",
      "End": true
    }
  }
}`

const documentInvalidNextNested = `{
  "StartAt": "LookupCustomerInfo",
  "States": {
    "LookupCustomerInfo": {
      "Type": "Parallel",
      "End": true,
      "Branches": [
        {
          "StartAt": "LookupAddress",
          "States": {
            "LookupAddress": {
              "Type": "Pass",
              "Next": "InvalidName"
            },
            "Second": {
              "Type": "Pass",
              "End": true
            }
          }
        },
        {
          "StartAt": "LookupPhone",
          "States": {
            "LookupPhone": {
              "Type": "Pass",
              "Next": "Second"
            },
            "Second": {
              "Type": "Pass",
              "End": true
            }
          }
        }
      ]
    },
    "Validate-All": {
      "Type": "Map",
      "ItemsPath": "$.items",
      "Iterator": {
        "StartAt": "Validate",
        "States": {
          "Validate": {
            "Type": "Pass",
            "Next": "InvalidName"
          },
          "Second": {
            "Type": "Pass",
            "End": true
          }
        }
      },
      "End": true
    }
  }
}`

const documentUnreachableState = `{
  "StartAt": "FirstS",
  "States": {
    "AndHere": {
      "Type": "Pass",
      "Next": "FirstState"
    },
    "FirstState": {
      "Type": "Pass",
      "Next": "SecondState"
    },
    "SecondState": {
      "Type": "Pass",
      "End": true
    },
    "ThirdState": {
      "Type": "Pass",
      "End": true
    },
    "FourthState": {
      "Type": "Pass",
      "End": true
    }
  }
}`

const documentNestedUnreachableState = `{
  "StartAt": "LookupCustomerInfo",
  "States": {
    "LookupCustomerInfo": {
      "Type": "Parallel",
      "Next": "Validate-All",
      "Branches": [
        {
          "StartAt": "LookupAddress",
          "States": {
            "LookupAddress": {
              "Type": "Pass",
              "End": true
            },
            "Second": {
              "Type": "Pass",
              "End": true
            }
          }
        },
        {
          "StartAt": "LookupPhone",
          "States": {
            "LookupPhone": {
              "Type": "Pass",
              "Next": "Second"
            },
            "Second": {
              "Type": "Pass",
              "End": true
            }
          }
        }
      ]
    },
    "Validate-All": {
      "Type": "Map",
      "ItemsPath": "$.items",
      "Iterator": {
        "StartAt": "Validate",
        "States": {
          "Validate": {
            "Type": "Pass",
            "End": true
          },
          "Second": {
            "Type": "Pass",
            "End": true
          }
        }
      },
      "End": true
    }
  }
}`

const documentNoTerminalState = `{
  "StartAt": "FirstState",
  "States": {
    "AndHere": {
      "Type": "Pass",
      "Next": "SecondState"
    },
    "FirstState": {
      "Type": "Pass",
      "Next": "SecondState"
    },
    "SecondState": {
      "Type": "Pass",
      "Next": "AndHere"
    }
  }
}`

const documentNestedNoTerminalState = `{
  "StartAt": "LookupCustomerInfo",
  "States": {
    "LookupCustomerInfo": {
      "Type": "Parallel",
      "Next": "Validate-All",
      "Branches": [
        {
          "StartAt": "LookupAddress",
          "States": {
            "LookupAddress": {
              "Type": "Pass",
              "Next": "Second"
            },
            "Second": {
              "Type": "Pass",
              "End": true
            }
          }
        },
        {
          "StartAt": "LookupPhone",
          "States": {
            "LookupPhone": {
              "Type": "Pass",
              "Next": "Second"
            },
            "Second": {
              "Type": "Pass",
              "Next": "LookupPhone"
            }
          }
        }
      ]
    },
    "Validate-All": {
      "Type": "Map",
      "ItemsPath": "$.items",
      "Iterator": {
        "StartAt": "Validate",
        "States": {
          "Validate": {
            "Type": "Pass",
            "Next": "Second"
          },
          "Second": {
            "Type": "Pass",
            "Next": "Third"
          },
          "Third": {
            "Type": "Pass",
            "Next": "Validate"
          }
        }
      },
      "End": true
    }
  }
}`

const documentSucceedFailTerminalState = `{
  "StartAt": "LookupCustomerInfo",
  "States": {
    "LookupCustomerInfo": {
      "Type": "Parallel",
      "Next": "Validate-All",
      "Branches": [
        {
          "StartAt": "LookupAddress",
          "States": {
            "LookupAddress": {
              "Type": "Pass",
              "Next": "Second"
            },
            "Second": {
              "Type": "Succeed"
            }
          }
        },
        {
          "StartAt": "LookupPhone",
          "States": {
            "LookupPhone": {
              "Type": "Pass",
              "Next": "Second"
            },
            "Second": {
              "Type": "Fail"
            }
          }
        }
      ]
    },
    "Validate-All": {
      "Type": "Map",
      "ItemsPath": "$.items",
      "Iterator": {
        "StartAt": "Validate",
        "States": {
          "Validate": {
            "Type": "Pass",
            "Next": "Second"
          },
          "Second": {
            "Type": "Pass",
            "Next": "Third"
          },
          "Third": {
            "Type": "Succeed"
          }
        }
      },
      "End": true
    }
  }
}`

const documentTaskCatchTemplate = `{
  "Comment": "A Catch example of the Amazon States Language using an AWS Lambda Function",
  "StartAt": "HelloWorld",
  "States": {
      "HelloWorld": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:111111111111:function:myFunction",
          "Catch": [
              {
                  "ErrorEquals": [
                      "CustomError"
                  ],
                  "Next": "CustomErrorFallback"
              },
              {
                  "ErrorEquals": [
                      "States.TaskFailed"
                  ],
                  "Next": "ReservedTypeFallback"
              },
              {
                  "ErrorEquals": [
                      "States.ALL"
                  ],
                  "Next": "CatchAllFallback"
              }
          ],
          "End": true
      },
      "CustomErrorFallback": {
          "Type": "Pass",
          "Result": "This is a fallback from a custom lambda function exception",
          "End": true
      },
      "ReservedTypeFallback": {
          "Type": "Pass",
          "Result": "This is a fallback from a reserved error code",
          "End": true
      },
      "CatchAllFallback": {
          "Type": "Pass",
          "Result": "This is a fallback from a reserved error code",
          "End": true
      }
  }
}`

const documentParallelCatchTemplate = `{
  "StartAt": "Parallel",
  "States": {
    "Parallel": {
      "Type": "Parallel",
      "Next": "Final State",
      "Catch": [
        {
          "ErrorEquals": [
            "States.ALL"
          ],
          "Next": "CatchState"
        }
      ],
      "Branches": [
        {
          "StartAt": "Wait 20s",
          "States": {
            "Wait 20s": {
              "Type": "Wait",
              "Seconds": 20,
              "End": true
            }
          }
        }
      ]
    },
    "Final State": {
      "Type": "Pass",
      "End": true
    },
    "CatchState": {
      "Type": "Pass",
      "End": true
    }
  }
}`

const documentTaskCatchTemplateInvalidNext = `{
  "Comment": "A Catch example of the Amazon States Language using an AWS Lambda Function",
  "StartAt": "HelloWorld",
  "States": {
      "HelloWorld": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:111111111111:function:myFunction",
          "Catch": [
              {
                  "ErrorEquals": [
                      "CustomError"
                  ],
                  "Next": "CustomErrorFallback"
              },
              {
                  "ErrorEquals": [
                      "States.TaskFailed"
                  ],
                  "Next": "ReservedType"
              },
              {
                  "ErrorEquals": [
                      "States.ALL"
                  ],
                  "Next": "CatchAllFallback"
              }
          ],
          "End": true
      },
      "CustomErrorFallback": {
          "Type": "Pass",
          "Result": "This is a fallback from a custom lambda function exception",
          "End": true
      }
  }
}`

const documentParallelCatchTemplateInvalidNext = `{
  "StartAt": "Parallel",
  "States": {
    "Parallel": {
      "Type": "Parallel",
      "Next": "Final State",
      "Catch": [
        {
          "ErrorEquals": [
            "States.ALL"
          ],
          "Next": "Catchddd"
        }
      ],
      "Branches": [
        {
          "StartAt": "Wait 20s",
          "States": {
            "Wait 20s": {
              "Type": "Wait",
              "Seconds": 20,
              "End": true
            }
          }
        }
      ]
    },
    "Final State": {
      "Type": "Pass",
      "End": true
    },
    "CatchState": {
      "Type": "Pass",
      "End": true
    }
  }
}`

interface TestValidationOptions {
    json: string,
    diagnostics: {
        message: string,
        start: [number, number],
        end: [number, number]
    }[],
    filterMessages?: string[]
}

async function testValidations(options: TestValidationOptions) {
    const { json, diagnostics, filterMessages } = options
    const { textDoc, jsonDoc } = toDocument(json);
    const ls = getLanguageService({});

    let res = await ls.doValidation(textDoc, jsonDoc)

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
})
