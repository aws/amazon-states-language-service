/*!
 * Copyright 2025 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import { Asl } from '../../asl/definitions'
import { DistributedMapProcessingMode } from '../../asl/definitions'

export const getMapAsl: (mode: DistributedMapProcessingMode) => Asl = (mode) => {
  return {
    Comment: 'Assign variable with map states',
    StartAt: 'Pass_Parent',
    States: {
      Pass_Parent: {
        Type: 'Pass',
        Next: 'Map',
        Assign: {
          var_parent: 1,
        },
      },
      Map: {
        Type: 'Map',
        Iterator: {
          StartAt: 'Pass_SubWorkflow1',
          States: {
            Pass_SubWorkflow1: {
              Type: 'Pass',
              Next: 'Pass_SubWorkflow2',
              Assign: {
                var_sub1: 1,
              },
            },
            Pass_SubWorkflow2: {
              Type: 'Pass',
              End: true,
              Assign: {
                var_sub2: 1,
              },
            },
          },
          ProcessorConfig: {
            Mode: mode,
            ExecutionType: 'STANDARD',
          },
        },
        End: true,
        ItemsPath: '$',
        MaxConcurrency: 5,
        Assign: {
          map: 'map params',
        },
      },
    },
  }
}

export const mockLocalScopeAsl: Asl = {
  Comment: 'A description of my state machine',
  StartAt: 'Pass_BeforeLambda',
  States: {
    Pass_BeforeLambda: {
      Type: 'Pass',
      Next: 'Lambda',
      Assign: {
        ValueEnteredInForm: '{\n "brancOne2.$": "$.branch1",\n}',
        var_pass_before: 1,
        var_nested: {
          array: [
            {
              key1: 123,
            },
          ],
          object: {
            nestedObjectKey: 1,
          },
        },
      },
    },
    Lambda: {
      Type: 'Task',
      Resource: 'arn:aws:states:::lambda:invoke',
      OutputPath: '$.Payload',
      Parameters: {
        'Payload.$': '$',
      },
      Assign: {
        var_lambda_pass: 1,
      },
      Next: 'Pass_Success',
      Catch: [
        {
          ErrorEquals: [],
          Next: 'Pass_ErrorFallback',
          Assign: {
            var_lambda_error: 1,
          },
        },
      ],
    },
    Pass_Success: {
      Type: 'Pass',
      Assign: {
        var_pass_success: 1,
      },
      Next: 'Pass_End',
    },
    Pass_ErrorFallback: {
      Type: 'Pass',
      Next: 'Pass_End',
      Assign: {
        var_pass_error: 1,
      },
    },
    Pass_End: {
      Type: 'Pass',
      Next: 'Success',
      Assign: {
        var_pass_end: 1,
      },
    },
    Success: {
      Type: 'Succeed',
    },
  },
}

export const mockParallelAssign: Asl = {
  Comment: 'A description of my parallel state machine',
  StartAt: 'Pass_Parent',
  States: {
    Pass_Parent: {
      Type: 'Pass',
      Next: 'Parallel',
      Assign: {
        var_parent: 1,
      },
    },
    Parallel: {
      Type: 'Parallel',
      Branches: [
        {
          StartAt: 'Branch2-1',
          States: {
            'Branch2-1': {
              Type: 'Pass',
              Assign: {
                var_branch2_1: 1,
              },
              End: true,
            },
          },
        },
        {
          StartAt: 'Branch1-1',
          States: {
            'Branch1-1': {
              Type: 'Task',
              Resource: 'arn:aws:states:::lambda:invoke',
              OutputPath: '$.Payload',
              Parameters: {
                'Payload.$': '$',
              },
              Assign: {
                var_branch1_1: 1,
              },
              Next: 'Branch1-2',
            },
            'Branch1-2': {
              Type: 'Pass',
              Assign: {
                var_branch1_2: 1,
              },
              End: true,
            },
          },
        },
      ],
      End: true,
      Assign: {
        var_parallel: 1,
      },
    },
  },
}

export const mockChoiceAssignAsl: Asl = {
  Comment: 'A description of my state machine',
  StartAt: 'Pass_Before_Choice',
  States: {
    Pass_Parent: {
      Type: 'Pass',
      Next: 'Choice',
      Assign: {
        var_pass_before: 1,
      },
    },
    Choice: {
      Type: 'Choice',
      Choices: [
        {
          Next: 'Rule1-1',
          Assign: {
            var_rule1: 1,
          },
        },
      ],
      Default: 'Rule-default-1',
      Assign: {
        var_rule_default: 1,
      },
    },
    'Rule1-1': {
      Type: 'Task',
      Resource: 'arn:aws:states:::lambda:invoke',
      OutputPath: '$.Payload',
      Parameters: {
        'Payload.$': '$',
      },
      Assign: {
        var_branch_1: 1,
      },
      Next: 'Rule1-2',
    },
    'Rule1-2': {
      Type: 'Pass',
      Assign: {
        var_branch_2: 1,
      },
      End: true,
    },
    'Rule-default-1': {
      Type: 'Pass',
      Assign: {
        var_default_1: 1,
      },
      End: true,
    },
  },
}

export const mockManualLoopAsl: Asl = {
  Comment: 'A description of my state machine',
  StartAt: 'Wait_BeforeLoop',
  States: {
    Wait_BeforeLoop: {
      Type: 'Wait',
      Seconds: 5,
      Next: 'Pass_Before_Choice',
      Assign: {
        var_before_loop: 1,
      },
    },
    Pass_Before_Choice: {
      Type: 'Pass',
      Next: 'Choice',
      Assign: {
        var_pass_before: '$',
      },
    },
    Choice: {
      Type: 'Choice',
      Choices: [
        {
          Next: 'Rule1-1',
          Assign: {
            var_rule1: 1,
          },
        },
      ],
      Default: 'Rule-default-1',
      Assign: {
        var_rule_default: 1,
      },
    },
    'Rule1-1': {
      Type: 'Task',
      Resource: 'arn:aws:states:::lambda:invoke',
      OutputPath: '$.Payload',
      Parameters: {
        'Payload.$': '$',
      },
      Assign: {
        var_branch_1: 1,
      },
      Next: 'Rule1-2',
    },
    'Rule1-2': {
      Type: 'Pass',
      Assign: {
        var_branch_2: 1,
      },
      End: true,
    },
    'Rule-default-1': {
      Type: 'Pass',
      Assign: {
        var_default_1: 1,
      },
      Next: 'Pass_Before_Choice',
    },
  },
}
