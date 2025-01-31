/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

export const documentWithAssignAndCatch = `
{
  "Comment": "A description of my state machine",
  "StartAt": "Lambda1",
  "States": {
    "Lambda1": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "OutputPath": "$.Payload",
      "Next": "Lambda2",
      "Assign": {
        "var_lambda1": 123
      }
    },
    "Lambda2": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "OutputPath": "$.Payload",
      "Parameters": {
        "Payload.$": "$states."
      },
      "End": true,
      "Assign": {
        "var_lambda2": ""
      },
      "Catch": [
        {
          "ErrorEquals": [],
          "Assign": {
            "error": "$states."
          }
        }
      ]
    }
  }
}
`

export const documentWithAssignAndCatchInvalidJson = `
{
  "Comment": "A description of my state machine",
  "StartAt": "Lambda1",
  "States": {
    "Lambda1": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "OutputPath": "$.Payload",
      "Next": "Lambda2",
      "Assign": {
        "var_lambda1": 123
      }
    },
    "Lambda2": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "OutputPath": "$.Payload",
      "Parameters": {
        "Payload.$": "$states."
      },
      "End": true,
      "Assign": {
        "var_lambda2": "",
        "var_colon":
      },
      "Catch": [
        {
          "ErrorEquals": [],
          "Assign": {
            "error": "$states."
          }
        }
      ]
    }
  }
}
`

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
