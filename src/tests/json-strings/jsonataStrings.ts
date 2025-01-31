/*!
 * Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

export const globalJsonataDocument = `
{
  "Comment": "{% $ %}",
  "StartAt": "Lambda1",
  "QueryLanguage": "JSONata",
  "States": {
    "Lambda1": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Next": "Lambda2",
      "Assign": {
        "var_lambda1": 123
      }
    },
    "Lambda2": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Arguments": {
        "Payload": "{% $ %}",
        "FunctionName": "{% myFunction"
      },
      "Assign": {
        "var_lambda2": "{% $states. %}",
        "var_lambda3": "{% $states.context. %}",
        "var_lambda4": "{% $states.cont %}",
        "var_lambda5": "{% $states.context.Ex %}",
        "var_lambda6": "{% ,.$/$ %}"
      }
    }
  }
}
`

export const stateLevelJsonataDocument = `
{
  "Comment": "A description of my state machine",
  "StartAt": "Lambda1",
  "QueryLanguage": "JSONPath",
  "States": {
    "Lambda1": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Next": "Lambda2",
      "Parameters": {
        "Payload": "{% $ %}"
      },
      "Assign": {
        "var_lambda1": 123
      }
    },
    "Lambda2": {
      "Type": "Task",
      "QueryLanguage": "JSONata",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Arguments": {
        "Payload": "{% $ %}"
      },
      "End": true
    }
  }
}
`
