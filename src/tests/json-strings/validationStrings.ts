/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

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
