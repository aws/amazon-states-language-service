/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

export const documentDistributedMapInvalidNextInNestedState = `
{
  "StartAt": "Map",
  "States": {
      "Map": {
          "Type": "Map",
          "ItemsPath": "$.array",
          "ResultPath": "$.array",
          "MaxConcurrency": 2,
          "Next": "Final State",
          "ItemProcessor": {
              "StartAt": "Pass",
              "States": {
                  "Pass": {
                      "Type": "Pass",
                      "Result": "Done!",
                      "Next": "StateThatDoesNotExist"
                  }
              }
          }
      },
      "Final State": {
          "Type": "Pass",
          "End": true
      }
  }
}
`

export const documentStartAtInvalid = `{
  "StartAt": "First",
  "States": {
    "FirstState": {
      "Type": "Pass",
      "End": true
    }
  }
}`

export const documentStartAtValid = `{
  "StartAt": "FirstState",
  "States": {
    "FirstState": {
      "Type": "Pass",
      "End": true
    }
  }
}`

export const documentStartAtNestedInvalid = `{
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

export const documentInvalidNext = `{
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

export const documentValidNext = `{
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

export const documentInvalidNextNested = `{
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

export const documentUnreachableState = `{
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

export const documentNestedUnreachableState = `{
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

export const documentNoTerminalState = `{
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

export const documentNestedNoTerminalState = `{
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

export const documentSucceedFailTerminalState = `{
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

export const documentTaskValidVariableSubstitution = `{
  "Comment": "A Catch example of the Amazon States Language using an AWS Lambda Function",
  "StartAt": "HelloWorld",
  "States": {
      "HelloWorld": {
          "Type": "Task",
          "Resource": "\${variableName}",
          "End": true
      }
  }
}`

export const documentTaskInvalidArn = `{
  "Comment": "A Catch example of the Amazon States Language using an AWS Lambda Function",
  "StartAt": "HelloWorld",
  "States": {
      "HelloWorld": {
          "Type": "Task",
          "Resource": "InvalidArn",
          "End": true
      }
  }
}`

export const documentTaskCatchTemplate = `{
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

export const documentParallelCatchTemplate = `{
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

export const documentMapCatchTemplate = `
{
  "StartAt": "Map",
  "States": {
      "Map": {
          "Type": "Map",
          "ItemsPath": "$.array",
          "ResultPath": "$.array",
          "MaxConcurrency": 2,
          "Next": "Final State",
          "Iterator": {
              "StartAt": "Pass",
              "States": {
                  "Pass": {
                      "Type": "Pass",
                      "Result": "Done!",
                      "End": true
                  }
              }
          },
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
          ]
      },

      "Final State": {
          "Type": "Pass",
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
}
`

export const documentMapCatchTemplateInvalidNext = `
{
  "StartAt": "Map",
  "States": {
      "Map": {
          "Type": "Map",
          "ItemsPath": "$.array",
          "ResultPath": "$.array",
          "MaxConcurrency": 2,
          "Next": "Final State",
          "Iterator": {
              "StartAt": "Pass",
              "States": {
                  "Pass": {
                      "Type": "Pass",
                      "Result": "Done!",
                      "End": true
                  }
              }
          },
          "Catch": [
              {
                  "ErrorEquals": [
                      "CustomError"
                  ],
                  "Next": "invalid"
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
                  "Next": "invalid2"
              }
          ]
      },

      "Final State": {
          "Type": "Pass",
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
}
`

export const documentTaskCatchTemplateInvalidNext = `{
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

export const documentParallelCatchTemplateInvalidNext = `{
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

export const documentChoiceValidNext = `{
  "StartAt": "Parallel",
  "States": {
    "Parallel": {
      "Type": "Parallel",
      "Next": "Final State",
      "Branches": [
        {
          "StartAt": "FirstState",
          "States": {
            "FirstState": {
              "Type": "Pass",
              "Next": "ChoiceState"
            },
            "ChoiceState": {
              "Type": "Choice",
              "Choices": [
                {
                  "Variable": "$.Comment",
                  "NumericEquals": 1,
                  "Next": "Last"
                }
              ],
              "Default": "FirstState"
            },
            "Last": {
              "Type": "Pass",
              "End": true
            }
          }
        }
      ]
    },
    "Final State": {
      "Type": "Pass",
      "End": true
    }
  }
}`

export const documentChoiceInvalidNext = `{
  "StartAt": "Parallel",
  "States": {
    "Parallel": {
      "Type": "Parallel",
      "Next": "Final State",
      "Branches": [
        {
          "StartAt": "FirstState",
          "States": {
            "FirstState": {
              "Type": "Pass",
              "Next": "ChoiceState"
            },
            "ChoiceState": {
              "Type": "Choice",
              "Choices": [
                {
                  "Variable": "$.Comment",
                  "NumericEquals": 1,
                  "Next": "La"
                }
              ],
              "Default": "FirstState"
            }
          }
        }
      ]
    },
    "Final State": {
      "Type": "Pass",
      "End": true
    }
  }
}`

export const documentChoiceValidDefault = `{
  "StartAt": "FirstState",
  "States": {
      "FirstState": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:111111111111:function:FUNCTION_NAME",
          "Next": "ChoiceState"
      },
      "ChoiceState": {
          "Type": "Choice",
          "Choices": [
              {
                  "Variable": "$.foo",
                  "NumericEquals": 1,
                  "Next": "FirstMatchState"
              }
          ],
          "Default": "DefaultState"
      },
      "FirstMatchState": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:111111111111:function:OnFirstMatch",
          "Next": "NextState"
      },
      "DefaultState": {
          "Type": "Fail",
          "Error": "DefaultStateError",
          "Cause": "No Matches!"
      },
      "NextState": {
          "Type": "Pass",
          "End": true
      }
  }
}`

export const documentChoiceInvalidDefault = `{
  "StartAt": "FirstState",
  "States": {
      "FirstState": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:111111111111:function:FUNCTION_NAME",
          "Next": "ChoiceState"
      },
      "ChoiceState": {
          "Type": "Choice",
          "Choices": [
              {
                  "Variable": "$.foo",
                  "NumericEquals": 1,
                  "Next": "FirstMatchState"
              }
          ],
          "Default": "DefaultStatexxxxxx"
      },
      "FirstMatchState": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:111111111111:function:OnFirstMatch",
          "Next": "NextState"
      },
      "DefaultState": {
          "Type": "Fail",
          "Error": "DefaultStateError",
          "Cause": "No Matches!"
      },
      "NextState": {
          "Type": "Pass",
          "End": true
      }
  }
}`

export const documentChoiceNoDefault = `{
  "StartAt": "ChoiceState",
  "States": {
      "ChoiceState": {
          "Type": "Choice",
          "Choices": [
              {
                  "Variable": "$.foo",
                  "NumericEquals": 1,
                  "Next": "FirstMatchState"
              }
          ]
      },
      "FirstMatchState": {
          "Type": "Pass",
          "End": true
      }
  }
}`

export const documentChoiceDefaultBeforeChoice = `{
  "StartAt": "ChoiceState",
  "States": {
      "DefaultState": {
          "Type": "Fail",
          "Error": "DefaultStateError",
          "Cause": "No Matches!"
      },
      "ChoiceState": {
          "Type": "Choice",
          "Choices": [
              {
                  "Variable": "$.foo",
                  "NumericEquals": 1,
                  "Next": "FirstMatchState"
              }
          ],
          "Default": "DefaultState"
      },
      "FirstMatchState": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:111111111111:function:OnFirstMatch",
          "End": true
      }
  }
}`

export const documentChoiceNextBeforeChoice = `{
  "StartAt": "ChoiceState",
  "States": {
    "FailState": {
      "Type": "Fail"
    },
    "ChoiceState": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.myVariable",
          "StringEquals": "bug",
          "Next": "FailState"
        }
      ]
    }
  }
}`

export const documentInvalidPropertiesState = `{
  "StartAt": "FirstState",
  "States": {
      "FirstState": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:111111111111:function:FUNCTION_NAME",
          "Next": "ChoiceState",
          "SomethingInvalid1": "dddd",
          "SomethingInvalid2": "eeee",
          "Credentials": {
              "RoleArn": "arn:aws:iam::111122223333:role/LambdaRole"
          }
      },
      "ChoiceState": {
          "Type": "Choice",
          "Choices": [
              {
                  "Variable": "$.foo",
                  "NumericEquals": 1,
                  "Next": "FirstMatchState"
              }
          ],
          "Default": "DefaultState"
      },
      "FirstMatchState": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:111111111111:function:OnFirstMatch",
          "Next": "NextState"
      },
      "DefaultState": {
          "Type": "Fail",
          "Error": "DefaultStateError",
          "Cause": "No Matches!"
      },
      "NextState": {
          "Type": "Pass",
          "End": true
      }
  }
}`

export const documentInvalidPropertiesCatch = `{
    "StartAt": "HelloWorld",
    "States": {
        "HelloWorld": {
            "Type": "Task",
            "Resource": "arn:aws:lambda:us-east-1:111111111111:function:FUNCTION_NAME",
            "Catch": [
                {
                    "ErrorEquals": [
                        "CustomError"
                    ],
                    "Next": "CustomErrorFallback",
                    "OneInvalid": "something"
                },
                {
                    "ErrorEquals": [
                        "States.TaskFailed"
                    ],
                    "Next": "ReservedTypeFallback",
                    "TwoInvalid": "something",
                    "ThreeInvalid": "something"
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

export const documentInvalidPropertiesChoices = `{
  "Comment": "An example of the Amazon States Language using a choice state.",
  "StartAt": "FirstState",
  "States": {
      "FirstState": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:111111111111:function:FUNCTION_NAME",
          "Next": "ChoiceState"
      },
      "ChoiceState": {
          "Type": "Choice",
          "Choices": [
              {
                  "Not": {
                      "Variable": "$.foo",
                      "StringEquals": "blabla",
                      "NumericGreaterThanEquals": 20,
                      "FirstInvalidProp": {}
                  },
                  "Next": "FirstMatchState"
              },
              {

                  "SecondInvalidProp": {},
                  "And": [
                      {
                          "Not": {
                              "Variable": "$.foo",
                              "StringEquals": "blabla",
                              "ThirdInvalidProp": {},
                              "Next": "FirstMatchState"
                          }
                      },
                      {
                          "Or": [
                              {
                                  "Variable": "$.value",
                                  "NumericGreaterThanEquals": 20,
                                  "FourthInvalidProp": {},
                                  "Next": "FirstMatchState"
                              },
                              {
                                  "Variable": "$.value",
                                  "NumericLessThan": 30
                              }
                          ]
                      },
                      {
                        "Variable": "$.foo",
                        "NumericGreaterThanEquals": 20,
                        "Next": "SecondMatchState"
                      }
                  ],
                  "Next": "SecondMatchState"
              }
          ],
          "Default": "DefaultState"
      },
      "FirstMatchState": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:111111111111:function:OnFirstMatch",
          "Next": "NextState"
      },
      "SecondMatchState": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:111111111111:function:OnSecondMatch",
          "Next": "NextState"
      },
      "DefaultState": {
          "Type": "Fail",
          "Error": "DefaultStateError",
          "Cause": "No Matches!"
      },
      "NextState": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:111111111111:function:FUNCTION_NAME",
          "End": true
      }
  }
}`

export const documentInvalidPropertiesRoot = `{
  "StartAt": "Succeed",
  "TimeoutSeconds": 3,
  "Version": "1.0",
  "Comment": "It's a test",
  "NewTopLevelField": "This field is not supported",
  "States": {
      "Succeed": {
          "Type": "Succeed"
      }
  }
}`

export const documentInvalidPropertiesRootNested = `{
  "StartAt": "Map",
  "States": {
      "Map": {
          "Type": "Map",
          "ItemsPath": "$.array",
          "Next": "Final State",
          "Iterator": {
              "StartAt": "Pass",
              "Comment": "Nested comment",
              "InvalidProp": "This is invalid",
              "States": {
                  "Pass": {
                      "Type": "Pass",
                      "Result": "Done!",
                      "End": true
                  }
              }
          }
      },
      "Final State": {
          "Type": "Pass",
          "End": true
      }
  }
}`

export const documentValidParametersJsonPath = `
{
  "StartAt": "GetManualReview",
  "States": {
      "GetManualReview": {
          "Type": "Task",
          "Resource": "arn:aws:states:::lambda:invoke.waitForTaskToken",
          "Parameters": {
              "FunctionName": "get-model-review-decision",
              "Payload": {
                  "model.$": "$.new_model",
                  "token.$": "$$.Task.Token",
                  "someProp": {
                      "nested_model.$": "$.new_model",
                      "nested_token.$": "$$.Task.Token"
                  }
              },
              "Qualifier": "prod-v1"
          },
          "End": true
      }
  }
}
`

export const documentInvalidParametersJsonPath = `
{
  "StartAt": "GetManualReview",
  "States": {
      "GetManualReview": {
          "Type": "Task",
          "Resource": "arn:aws:states:::lambda:invoke.waitForTaskToken",
          "Parameters": {
              "FunctionName": "get-model-review-decision",
              "Payload": {
                  "model.$": "",
                  "token.$": "$$.Task.Token",
                  "someProp": {
                      "nested_model.$": 22,
                      "nested_token.$": true
                  }
              },
              "Qualifier.$": "prod-v1"
          },
          "End": true
      }
  }
}
`

export const documentValidParametersIntrinsicFunction = `
{
  "StartAt": "Invoke Lambda function",
  "States": {
    "Invoke Lambda function": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "arn:aws:lambda:REGION:ACCOUNT_ID:function:FUNCTION_NAME",
        "Payload": {
          "Input1.$": "States.Format($.template, $.firstName, $.lastName)",
          "Input2.$": "States.JsonToString($)",
          "Input3.$": "States.StringToJson($.escaped)",
          "Input4.$": "States.Format($.template, $.firstName, $.lastName)    ",
          "Input5.$": "States.JsonToString($)    ",
          "Input6.$": "States.StringToJson($.escaped)    ",
          "Input7.$": "States.Format('one {}\\ntwo {}', $.firstName, 'literal')"
        }
      },
      "Next": "Succeed state"
    },
    "Succeed state": {
      "Type": "Succeed"
    }
  }
}
`

export const documentInvalidParametersIntrinsicFunction = `
{
  "StartAt": "Invoke Lambda function",
  "States": {
    "Invoke Lambda function": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "arn:aws:lambda:REGION:ACCOUNT_ID:function:FUNCTION_NAME",
        "Payload": {
          "Input1.$": "  States.Format($.template, $.firstName, $.lastName)",
          "Input2.$": "States.JsonToString($",
          "Input3.$": "States.StringToJson $.escaped)",
          "Input4.$": "States. ",
          "Input5.$": "JsonToString($)",
          "Input6.$": "something else    ",
          "Input7.$": "States\\nJsonToString($)"
        }
      },
      "Next": "Succeed state"
    },
    "Succeed state": {
      "Type": "Succeed"
    }
  }
}
`

export const documentValidAslImprovements = `
{
  "StartAt": "Invoke Lambda function",
  "States": {
      "Invoke Lambda function": {
          "Type": "Task",
          "TimeoutSecondsPath": "$.path",
          "HeartbeatSecondsPath": "$.path",
          "InputPath": "$$.Execution.Id",
          "OutputPath": "$$.Execution.Id",
          "Resource": "arn:aws:states:::lambda:invoke",
          "Parameters": {
              "FunctionName": "arn:aws:lambda:REGION:ACCOUNT_ID:function:FUNCTION_NAME",
              "Payload": {
                  "Input.$": "$"
              }
          },
          "ResultSelector": {
              "example.$": "$",
              "example2": {
                  "nested.$": "$.path"
              }
          },
          "Next": "MapState"
      },
      "MapState": {
          "Type": "Map",
          "ItemsPath": "$.array",
          "MaxConcurrency": 0,
          "Iterator": {
              "StartAt": "Pass",
              "States": {
                  "Pass": {
                      "Type": "Pass",
                      "Result": "Done!",
                      "End": true
                  }
              }
          },
          "ResultSelector": {
              "example.$": "$",
              "example2": {
                  "nested.$": "$.path"
              }
          },
          "ResultPath": "$.output",
          "Next": "ParallelState"
      },
      "ParallelState": {
          "Type": "Parallel",
          "Branches": [
              {
                  "StartAt": "State1",
                  "States": {
                      "State1": {
                          "Type": "Pass",
                          "End": true
                      }
                  }
              },
              {
                  "StartAt": "State2",
                  "States": {
                      "State2": {
                          "Type": "Pass",
                          "End": true
                      }
                  }
              }
          ],
          "ResultSelector": {
              "example.$": "$",
              "example2": {
                  "nested.$": "$.path"
              }
          },
          "Next": "Compare 2 variables"
      },
      "Compare 2 variables": {
          "Type": "Choice",
          "Choices": [
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "IsNull": true
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "IsPresent": true
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "IsNumeric": true
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "IsString": true
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "IsBoolean": true
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "IsTimestamp": true
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "StringMatches": "uuu*"
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "StringEqualsPath": "$.some.path"
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "StringLessThanPath": "$.some.path"
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "StringGreaterThanPath": "$.some.path"
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "StringLessThanEqualsPath": "$.some.path"
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "StringGreaterThanEqualsPath": "$.some.path"
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "NumericEqualsPath": "$.some.path"
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "NumericLessThanPath": "$.some.path"
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "NumericGreaterThanPath": "$.some.path"
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "NumericLessThanEqualsPath": "$.some.path"
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "NumericGreaterThanEqualsPath": "$.some.path"
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "BooleanEqualsPath": "$.some.path"
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "TimestampEqualsPath": "$.some.path"
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "TimestampLessThanPath": "$.some.path"
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "TimestampGreaterThanPath": "$.some.path"
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "TimestampLessThanEqualsPath": "$.some.path"
              },
              {
                  "Variable": "$.var1",
                  "Next": "Succeed state",
                  "TimestampGreaterThanEqualsPath": "$.some.path"
              },
              {
                  "And": [
                      {
                          "Variable": "$.var1",
                          "IsNull": true
                      },
                      {
                          "Variable": "$.var1",
                          "IsPresent": true
                      },
                      {
                          "Variable": "$.var1",
                          "IsNumeric": true
                      },
                      {
                          "Variable": "$.var1",
                          "IsString": true
                      },
                      {
                          "Variable": "$.var1",
                          "IsBoolean": true
                      },
                      {
                          "Variable": "$.var1",
                          "IsTimestamp": true
                      },
                      {
                          "Variable": "$.var1",
                          "StringMatches": "uuu*"
                      },
                      {
                          "Variable": "$.var1",
                          "StringEqualsPath": "$.some.path"
                      },
                      {
                          "Variable": "$.var1",
                          "StringLessThanPath": "$.some.path"
                      },
                      {
                          "Variable": "$.var1",
                          "StringGreaterThanPath": "$.some.path"
                      },
                      {
                          "Variable": "$.var1",
                          "StringLessThanEqualsPath": "$.some.path"
                      },
                      {
                          "Variable": "$.var1",
                          "StringGreaterThanEqualsPath": "$.some.path"
                      },
                      {
                          "Variable": "$.var1",
                          "NumericEqualsPath": "$.some.path"
                      },
                      {
                          "Variable": "$.var1",
                          "NumericLessThanPath": "$.some.path"
                      },
                      {
                          "Variable": "$.var1",
                          "NumericGreaterThanPath": "$.some.path"
                      },
                      {
                          "Variable": "$.var1",
                          "NumericLessThanEqualsPath": "$.some.path"
                      },
                      {
                          "Variable": "$.var1",
                          "NumericGreaterThanEqualsPath": "$.some.path"
                      },
                      {
                          "Variable": "$.var1",
                          "BooleanEqualsPath": "$.some.path"
                      },
                      {
                          "Variable": "$.var1",
                          "TimestampEqualsPath": "$.some.path"
                      },
                      {
                          "Variable": "$.var1",
                          "TimestampLessThanPath": "$.some.path"
                      },
                      {
                          "Variable": "$.var1",
                          "TimestampGreaterThanPath": "$.some.path"
                      },
                      {
                          "Variable": "$.var1",
                          "TimestampLessThanEqualsPath": "$.some.path"
                      },
                      {
                          "Variable": "$.var1",
                          "TimestampGreaterThanEqualsPath": "$.some.path"
                      }
                  ],
                  "Next": "Succeed state"
              }
          ],
          "Default": "Fail state"
      },
      "Fail state": {
          "Type": "Fail"
      },
      "Succeed state": {
          "Type": "Succeed"
      }
  }
}
`

export const documentValidResultSelectorJsonPath = `
{
  "StartAt": "GetManualReview",
  "States": {
      "GetManualReview": {
          "Type": "Task",
          "Resource": "arn:aws:states:::lambda:invoke.waitForTaskToken",
          "ResultSelector": {
              "prop1": "get-model-review-decision",
              "prop2": {
                  "model.$": "$.new_model",
                  "token.$": "$$.Task.Token",
                  "someProp": {
                      "nested_model.$": "$.new_model",
                      "nested_token.$": "$$.Task.Token"
                  }
              },
              "Qualifier": "prod-v1"
          },
          "Parameters": {
            "FunctionName": "arn:aws:lambda:REGION:ACCOUNT_ID:function:FUNCTION_NAME"
          },
          "End": true
      }
  }
}
`

export const documentInvalidResultSelectorJsonPath = `
{
  "StartAt": "GetManualReview",
  "States": {
      "GetManualReview": {
          "Type": "Task",
          "Resource": "arn:aws:states:::lambda:invoke.waitForTaskToken",
          "ResultSelector": {
              "prop1": "get-model-review-decision",
              "prop2": {
                  "model.$": "",
                  "token.$": "$$.Task.Token",
                  "someProp": {
                      "nested_model.$": 22,
                      "nested_token.$": true
                  }
              },
              "Qualifier.$": "prod-v1"
          },
          "Parameters": {
            "FunctionName": "arn:aws:lambda:REGION:ACCOUNT_ID:function:FUNCTION_NAME"
          },
          "End": true
      }
  }
}
`

export const documentValidResultSelectorIntrinsicFunction = `
{
  "StartAt": "Invoke Lambda function",
  "States": {
    "Invoke Lambda function": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "ResultSelector": {
        "prop1": "arn:aws:lambda:REGION:ACCOUNT_ID:function:FUNCTION_NAME",
        "prop2": {
          "Input1.$": "States.Format($.template, $.firstName, $.lastName)",
          "Input2.$": "States.JsonToString($)",
          "Input3.$": "States.StringToJson($.escaped)",
          "Input4.$": "States.Format($.template, $.firstName, $.lastName)    ",
          "Input5.$": "States.JsonToString($)    ",
          "Input6.$": "States.StringToJson($.escaped)    "
        },
        "prop3": {
            "Array.$": "States.Array($.foo, $.baz.quz, $.boo)",
            "Format.$": "States.Format('formatting {}', $.foo)",
            "JsonToString.$": "States.JsonToString($.baz)",
            "StringToJson.$": "States.StringToJson($.str)",
            "ArrayContains.$": "States.ArrayContains($.boo, $.boo[0])",
            "ArrayGetItem.$": "States.ArrayGetItem($.boo, 0)",
            "ArrayLength.$": "States.ArrayLength($.boo)",
            "ArrayPartition.$": "States.ArrayPartition($.boo, 1)",
            "ArrayRange.$": "States.ArrayRange(1, 9, 2)",
            "ArrayUnique.$": "States.ArrayUnique($.boo)",
            "Base64Decode.$": "States.Base64Decode($.base)",
            "Base64Encode.$": "States.Base64Encode($.foo)",
            "Hash.$": "States.Hash($.foo, $.hash)",
            "JsonMerge.$": "States.JsonMerge($.baz, $.bar, false)",
            "MathAdd.$": "States.MathAdd($.boo[0], $.boo[1])",
            "MathRandom.$": "States.MathRandom($.boo[0], $.boo[2])",
            "StringSplit.$": "States.StringSplit($.bar.bub, $.o)",
            "UUID.$": "States.UUID()"
          }
      },
      "Parameters": {
        "FunctionName": "arn:aws:lambda:REGION:ACCOUNT_ID:function:FUNCTION_NAME"
      },
      "Next": "Succeed state"
    },
    "Succeed state": {
      "Type": "Succeed"
    }
  }
}
`

export const documentInvalidResultSelectorIntrinsicFunction = `
{
  "StartAt": "Invoke Lambda function",
  "States": {
    "Invoke Lambda function": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "ResultSelector": {
        "prop1": "arn:aws:lambda:REGION:ACCOUNT_ID:function:FUNCTION_NAME",
        "prop2": {
          "Input1.$": "  States.Format($.template, $.firstName, $.lastName)",
          "Input2.$": "States.JsonToString($",
          "Input3.$": "States.StringToJson $.escaped)",
          "Input4.$": "States. ",
          "Input5.$": "JsonToString($)",
          "Input6.$": "something else    "
        }
      },
      "Parameters": {
        "FunctionName": "arn:aws:lambda:REGION:ACCOUNT_ID:function:FUNCTION_NAME"
      },
      "Next": "Succeed state"
    },
    "Succeed state": {
      "Type": "Succeed"
    }
  }
}
`
export const documentMapProcessorConfig = `
{
  "StartAt": "Map",
  "States": {
      "Map": {
          "Type": "Map",
          "ItemsPath": "$.array",
          "ResultPath": "$.array",
          "MaxConcurrency": 2,
          "Next": "Final State",
          "ItemProcessor": {
              "StartAt": "Pass",
              "States": {
                  "Pass": {
                      "Type": "Pass",
                      "End": true
                  }
              },
              "ProcessorConfig": {
                "ExecutionType": "EXPRESS",
                "Mode": "DISTRIBUTED"
              }
          }
      },
      "Final State": {
          "Type": "Pass",
          "End": true
      }
  }
}
`

export const documentMapInvalidItemProcessorConfig = `
{
  "StartAt": "Map",
  "States": {
      "Map": {
          "Type": "Map",
          "ItemsPath": "$.array",
          "ResultPath": "$.array",
          "MaxConcurrency": 2,
          "Next": "Final State",
          "ItemProcessor": {
              "ProcessorConfig": {
                "ExecutionType": "EXPRESS",
                "Mode": "DISTRIBUTED"
              }
          }
      },
      "Final State": {
          "Type": "Pass",
          "End": true
      }
  }
}
`

export const documentFailErrorAndCauseValid = `
{
  "StartAt": "fail",
  "States": {
      "fail": {
          "Type": "Fail",
          "Error": "error-value",
          "Cause": "cause-value"
      }
  }
}
`

export const documentFailErrorAndNoCauseValid = `
{
  "StartAt": "fail",
  "States": {
      "fail": {
          "Type": "Fail",
          "Error": "error-value"
      }
  }
}
`

export const documentFailNoErrorAndCauseValid = `
{
  "StartAt": "fail",
  "States": {
      "fail": {
          "Type": "Fail",
          "Cause": "cause-value"
      }
  }
}
`

export const documentFailNoErrorAndNoCauseValid = `
{
  "StartAt": "fail",
  "States": {
      "fail": {
          "Type": "Fail"
      }
  }
}
`

export const documentFailErrorPathAndCausePathValid = `
{
  "StartAt": "fail",
  "States": {
      "fail": {
          "Type": "Fail",
          "ErrorPath": "$.Error",
          "CausePath": "$.Cause"
      }
  }
}
`

export const documentFailErrorPathAndNoCauseValid = `
{
  "StartAt": "fail",
  "States": {
      "fail": {
          "Type": "Fail",
          "ErrorPath": "$.Error"
      }
  }
}
`

export const documentFailNoErrorAndCausePathValid = `
{
  "StartAt": "fail",
  "States": {
      "fail": {
          "Type": "Fail",
          "CausePath": "$.Cause"
      }
  }
}
`

export const documentFailErrorPathAndCauseValid = `
{
  "StartAt": "fail",
  "States": {
      "fail": {
          "Type": "Fail",
          "ErrorPath": "$.Error",
          "Cause": "cause-value"
      }
  }
}
`

export const documentFailErrorAndCausePathValid = `
{
  "StartAt": "fail",
  "States": {
      "fail": {
          "Type": "Fail",
          "Error": "error-value",
          "CausePath": "$.Cause"
      }
  }
}
`

export const documentFailErrorPathAndCausePathContextValid = `
{
  "StartAt": "fail",
  "States": {
      "fail": {
          "Type": "Fail",
          "ErrorPath": "$$.StateMachine.Name",
          "CausePath": "$$.State.Name"
      }
  }
}
`

export const documentFailErrorPathAndCausePathIntrinsicValid = `
{
  "StartAt": "fail",
  "States": {
      "fail": {
          "Type": "Fail",
          "ErrorPath": "States.UUID()",
          "CausePath": "States.Format('this is the error: {}, and this is the cause: {}', $.Error, $.Cause)"
      }
  }
}
`

export const documentFailErrorPathAndCausePathIntrinsicNestedValid = `
{
  "StartAt": "fail",
  "States": {
      "fail": {
          "Type": "Fail",
          "ErrorPath": "States.JsonToString($.unescapedJson)",
          "CausePath": "States.Format('this is the error: {}, and this is the cause: {}', States.ArrayGetItem($.inputArray, $.index), $.Cause)"
      }
  }
}
`

export const documentFailErrorPathAndCausePathJsonPathInvalid = `
{
  "StartAt": "fail",
  "States": {
      "fail": {
          "Type": "Fail",
          "ErrorPath": "Error",
          "CausePath": "Cause"
      }
  }
}
`

export const documentFailErrorPathJsonPathInvalid = `
{
  "StartAt": "fail",
  "States": {
      "fail": {
          "Type": "Fail",
          "ErrorPath": "Error",
          "CausePath": "$.Cause"
      }
  }
}
`

export const documentFailCausePathJsonPathInvalid = `
{
  "StartAt": "fail",
  "States": {
      "fail": {
          "Type": "Fail",
          "ErrorPath": "$.Error",
          "CausePath": "Cause"
      }
  }
}
`

export const documentFailErrorPathAndCausePathIntrinsicInvalid = `
{
  "StartAt": "fail",
  "States": {
      "fail": {
          "Type": "Fail",
          "ErrorPath": "States.StringToJson($.escapedJsonString)",
          "CausePath": "States.MathAdd($.value1, $.step)"
      }
  }
}
`

export const documentFailErrorAndErrorPathInvalid = `
{
  "StartAt": "fail",
  "States": {
      "fail": {
          "Type": "Fail",
          "Error": "Error",
          "ErrorPath": "$.Error"
      }
  }
}
`

export const documentFailCauseAndCausePathInvalid = `
{
  "StartAt": "fail",
  "States": {
      "fail": {
          "Type": "Fail",
          "Cause": "Cause",
          "CausePath": "$.Cause"
      }
  }
}
`

export const documentTaskRetryValid = `{
  "Comment": "A Retry example of the Amazon States Language using an AWS Lambda Function",
  "StartAt": "HelloWorld",
  "States": {
      "HelloWorld": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:111111111111:function:myFunction",
          "Retry": [
            {
              "ErrorEquals": [ "States.Timeout" ],
              "MaxAttempts": 0
            },
            {
              "ErrorEquals": [ "A" ],
              "IntervalSeconds": 123
            },
            {
              "ErrorEquals": [ "B" ],
              "BackoffRate": 1.5
            },
            {
              "ErrorEquals": [ "C" ],
              "MaxAttempts": 123
            },
            {
              "ErrorEquals": [ "D" ],
              "MaxDelaySeconds": 123
            },
            {
              "ErrorEquals": [ "E" ],
              "JitterStrategy": "FULL"
            },
            {
              "ErrorEquals": [ "F" ],
              "JitterStrategy": "NONE"
            },
            {
              "ErrorEquals": [ "G" ],
              "IntervalSeconds": 3,
              "MaxAttempts": 2,
              "BackoffRate": 1.5,
              "MaxDelaySeconds": 4,
              "JitterStrategy": "FULL"
            },
            {
              "ErrorEquals": [ "H" ],
              "MaxDelaySeconds": 4,
              "JitterStrategy": "FULL"
            },
            {
              "ErrorEquals": [ "I" ],
              "MaxAttempts": 20,
              "MaxDelaySeconds": 4,
              "JitterStrategy": "FULL"
            },
            {
              "ErrorEquals": [ "J" ],
              "MaxAttempts": 20,
              "MaxDelaySeconds": 4
            },
            {
              "ErrorEquals": [ "K" ],
              "MaxAttempts": 20,
              "MaxDelaySeconds": 4
            },
            {
              "ErrorEquals": [ "States.ALL" ]
            }
        ],
          "End": true
      }
  }
}`

export const documentTaskRetryInvalid = `{
  "Comment": "A Retry example with invalid inputs",
  "StartAt": "HelloWorld",
  "States": {
      "HelloWorld": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:111111111111:function:myFunction",
          "Retry": [
            {
              "ErrorEquals": [ "States.Timeout" ],
              "MaxAttempts": -1
            },
            {
              "ErrorEquals": [ "A" ],
              "IntervalSeconds": 3.5
            },
            {
              "ErrorEquals": [ "B" ],
              "BackoffRate": -2
            },
            {
              "ErrorEquals": [ "C" ],
              "MaxAttempts": 99.5
            },
            {
              "ErrorEquals": [ "E" ],
              "MaxDelaySeconds": 0
            },
            {
              "ErrorEquals": [ "D" ],
              "MaxDelaySeconds": 3.5
            },
            {
              "ErrorEquals": [ "E" ],
              "MaxDelaySeconds": 31622401
            },
            {
              "ErrorEquals": [ "F" ],
              "JitterStrategy": "invalid"
            },
            {
              "ErrorEquals": [ "G" ],
              "IntervalSeconds": 3,
              "MaxAttempts": 2,
              "BackoffRate": 1.5,
              "MaxDelaySeconds": -1,
              "JitterStrategy": "full"
            },
            {
              "ErrorEquals": [ "States.ALL" ]
            }
        ],
          "End": true
      }
  }
}`

export const documentTaskJSONata = `{
  "Comment": "A Catch example of the Amazon States Language using an AWS Lambda Function",
  "StartAt": "Lambda Invoke",
  "States": {
    "Lambda Invoke": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Output": "{% $states.result.Payload %}",
      "Arguments": {
        "FunctionName": "{% $states.function %}",
        "Payload": "{% $states.input %}"
      },
      "End": true,
      "TimeoutSeconds": "{% $states.input.timeout %}",
      "HeartbeatSeconds": "{% $states.input.heartbeat %}",
      "Catch": [
        {
          "ErrorEquals": [
            "States.ALL"
          ],
          "Output": "{% $states.result.Payload %}",
          "Next": "Lambda Invoke"
        }
      ]
    }
  },
  "QueryLanguage": "JSONata"
}`

export const documentTaskJSONataInvalid = `{
  "Comment": "A Catch example of the Amazon States Language using an AWS Lambda Function",
  "StartAt": "Lambda Invoke",
  "States": {
    "Lambda Invoke": {
      "QueryLanguage": "notValid",
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Output": "{% $states.result.Payload %}",
      "Arguments": 123,
      "End": true,
      "TimeoutSeconds": false,
      "HeartbeatSeconds": true,
      "Catch": [
        {
          "ErrorEquals": [
            "States.ALL"
          ],
          "Output": "{% $states.result.Payload %}",
          "Next": "Lambda Invoke"
        }
      ]
    }
  }
}`

export const documentMapJSONata = `{
  "QueryLanguage": "JSONPath",
  "Comment": "A description of my state machine",
  "StartAt": "Map",
  "States": {
    "Map": {
      "Type": "Map",
      "Items": "{% $states %}",
      "ItemProcessor": {
        "ProcessorConfig": {
          "Mode": "DISTRIBUTED",
          "ExecutionType": "STANDARD"
        },
        "StartAt": "Pass",
        "States": {
          "Pass": {
            "Type": "Pass",
            "End": true
          }
        }
      },
      "End": true,
      "Label": "Map",
      "MaxConcurrency": "{% $states %}",
      "ItemReader": {
        "Resource": "arn:aws:states:::s3:listObjectsV2",
        "Arguments": {
          "Bucket": "{% $states %}",
          "Prefix": "{% $states %}"
        },
        "ReaderConfig": {
          "MaxItems": "{% $states %}"
        }
      },
      "ItemBatcher": {
        "MaxItemsPerBatch": "{% $states %}",
        "MaxInputBytesPerBatch": "{% $states %}",
        "BatchInput": "{% $states %}"
      },
      "ToleratedFailurePercentage": "{% $states %}",
      "QueryLanguage": "JSONata",
      "ItemSelector": "{% $states %}",
      "ResultWriter": {
        "Resource": "arn:aws:states:::s3:putObject",
        "Arguments": "{% $states %}"
      }
    }
  }
}`

export const documentParallelPassSuccessJSONata = `{
  "QueryLanguage": "JSONata",
  "Comment": "A description of my state machine",
  "StartAt": "Parallel",
  "States": {
    "Parallel": {
      "Type": "Parallel",
      "Branches": [
        {
          "StartAt": "Pass",
          "States": {
            "Pass": {
              "Type": "Pass",
              "End": true,
              "Output": {
                "Placeholder": "{% $states %}"
              }
            }
          }
        },
        {
          "StartAt": "Success",
          "States": {
            "Success": {
              "Type": "Succeed",
              "Output": "{% $states %}"
            }
          }
        }
      ],
      "End": true,
      "Arguments": "{% $states %}",
      "Output": "{% $states %}"
    }
  }
}`

export const documentChoiceWaitJSONata = `{
  "QueryLanguage": "JSONata",
  "Comment": "A description of my state machine",
  "StartAt": "Choice",
  "States": {
    "Choice": {
      "Type": "Choice",
      "Choices": [
        {
          "Next": "Pass",
          "Condition": "{% $states %}",
          "Output": "{% $states %}"
        }
      ],
      "Default": "Wait",
      "Output": "{% $states %}"
    },
    "Wait": {
      "Type": "Wait",
      "Timestamp": "{% $states %}",
      "End": true
    },
    "Pass": {
      "Type": "Pass",
      "End": true
    }
  }
}`

export const documentTaskWithAssign = `{
  "Comment": "An example of the Amazon States Language using a Task state with Assign field",
  "StartAt": "HelloWorld",
  "States": {
      "HelloWorld": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:us-east-1:111111111111:function:myFunction",
          "Assign": {},
          "Catch": [
            {
              "ErrorEquals": [
                "States.ALL"
              ],
              "Next": "HelloWorld",
              "Assign": {}
            }
          ],
          "End": true
      }
  }
}`

export const documentMapWithAssign = `{
  "StartAt": "Map",
  "States": {
      "Map": {
          "Type": "Map",
          "ItemsPath": "$.array",
          "ResultPath": "$.array",
          "MaxConcurrency": 2,
          "Next": "Final State",
          "ItemProcessor": {
              "StartAt": "Pass",
              "States": {
                  "Pass": {
                      "Type": "Pass",
                      "Result": "Done!",
                      "End": true
                  }
              }
          },
          "Assign": {}
      },
      "Final State": {
          "Type": "Pass",
          "End": true
      }
  }
}`

export const documentChoiceWithAssign = `{
  "Comment": "An example of the Amazon States Language using a Choice state with Assign field in the rule",
  "StartAt": "Choice",
  "States": {
    "Choice": {
      "Type": "Choice",
      "Choices": [
          {
              "Not": {
                  "Variable": "$",
                  "IsPresent": true
              },
              "Assign": {},
              "Next": "Pass"
          }
      ],
      "Default": "Pass"
    },
    "Pass": {
      "Type": "Pass",
      "End": true,
      "Assign": {}
    }
  }
}`

export const documentParallelWithAssign = `{
  "Comment": "An example of the Amazon States Language using a Parallel state with Assign field",
  "StartAt": "Parallel",
  "States": {
    "Parallel": {
      "Type": "Parallel",
      "Assign": {},
      "End": true,
      "Branches": [
        {
          "StartAt": "Pass",
          "States": {
            "Pass": {
              "Type": "Pass",
              "End": true
            }
          }
        }
      ]
    }
  }
}`

export const documentWaitWithAssign = `{
  "Comment": "An example of the Amazon States Language using a Wait state with Assign field",
  "StartAt": "HelloWorld",
  "States": {
      "HelloWorld": {
          "Type": "Wait",
          "Assign": {},
          "End": true
      }
  }
}`

export const documentPassWithAssign = `{
  "Comment": "An example of the Amazon States Language using a Pass state with Assign field",
  "StartAt": "HelloWorld",
  "States": {
      "HelloWorld": {
          "Type": "Pass",
          "Assign": {},
          "End": true
      }
  }
}`

export const documentInvalidSuccessWithAssign = `{
  "Comment": "An example of the Amazon States Language using a Success state with Assign field",
  "StartAt": "HelloWorld",
  "States": {
      "HelloWorld": {
          "Type": "Succeed",
          "Assign": {}
      }
  }
}`

export const documentInvalidFailWithAssign = `{
  "Comment": "An example of the Amazon States Language using a Fail state with Assign field",
  "StartAt": "HelloWorld",
  "States": {
      "HelloWorld": {
          "Type": "Fail",
          "Assign": {}
      }
  }
}`

export const documentMapResultWriter = `
{
  "StartAt": "Map",
  "States": {
      "Map": {
          "Type": "Map",
          "ItemsPath": "$.array",
          "ResultPath": "$.array",
          "MaxConcurrency": 2,
          "Next": "Final State",
          "ItemProcessor": {
              "StartAt": "Pass",
              "States": {
                  "Pass": {
                      "Type": "Pass",
                      "End": true
                  }
              },
              "ProcessorConfig": {
                "ExecutionType": "EXPRESS",
                "Mode": "DISTRIBUTED"
              }
          },
          "ResultWriter": {
            "WriterConfig": {
              "OutputType": "JSON"
            }
          }
      },
      "Final State": {
          "Type": "Pass",
          "End": true
      }
  }
}
`

export const documentMapResultWriterMissingOutputType = `
{
  "StartAt": "Map",
  "States": {
      "Map": {
          "Type": "Map",
          "ItemsPath": "$.array",
          "ResultPath": "$.array",
          "MaxConcurrency": 2,
          "Next": "Final State",
          "ItemProcessor": {
              "StartAt": "Pass",
              "States": {
                  "Pass": {
                      "Type": "Pass",
                      "End": true
                  }
              },
              "ProcessorConfig": {
                "ExecutionType": "EXPRESS",
                "Mode": "DISTRIBUTED"
              }
          },
          "ResultWriter": {
            "WriterConfig": {}
          }
      },
      "Final State": {
          "Type": "Pass",
          "End": true
      }
  }
}
`

export const documentMapItemReader = `
{
  "StartAt": "Map",
  "States": {
      "Map": {
          "Type": "Map",
          "ItemsPath": "$.array",
          "ResultPath": "$.array",
          "MaxConcurrency": 2,
          "Next": "Final State",
          "ItemProcessor": {
              "StartAt": "Pass",
              "States": {
                  "Pass": {
                      "Type": "Pass",
                      "End": true
                  }
              },
              "ProcessorConfig": {
                "ExecutionType": "EXPRESS",
                "Mode": "DISTRIBUTED"
              }
          },
      "ItemReader": {
        "Resource": "arn:aws:states:::s3:getObject",
        "ReaderConfig": {
          "InputType": "CSV",
          "CSVHeaderLocation": "FIRST_ROW"
        },
        "Parameters": {
          "Bucket": "abc",
          "Key": "def"
        }
      }
      },
      "Final State": {
          "Type": "Pass",
          "End": true
      }
  }
}
`

export const documentMapItemReaderWithInputTypeJSONL = `
{
  "StartAt": "Map",
  "States": {
      "Map": {
          "Type": "Map",
          "ItemsPath": "$.array",
          "ResultPath": "$.array",
          "MaxConcurrency": 2,
          "Next": "Final State",
          "ItemProcessor": {
              "StartAt": "Pass",
              "States": {
                  "Pass": {
                      "Type": "Pass",
                      "End": true
                  }
              },
              "ProcessorConfig": {
                "ExecutionType": "EXPRESS",
                "Mode": "DISTRIBUTED"
              }
          },  
      "ItemReader": {
        "Resource": "arn:aws:states:::s3:getObject",
        "ReaderConfig": {
          "InputType": "JSONL"
        },
        "Parameters": {
          "Bucket": "abc",
          "Key": "def"
        }
      }
      },
      "Final State": {
          "Type": "Pass",
          "End": true
      }
  }
}
`
