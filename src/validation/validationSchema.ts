/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

export default {
    Common: {
        Next: true,
        End: true,
        Comment: true,
        InputPath: true,
        OutputPath: true,
        Type: true
    },
    StateTypes: {
        Pass: {
            Properties: {
                Result: true,
                ResultPath: true,
                Parameters: true
            },
            hasCommonProperties: true
        },
        Task: {
            Properties: {
                Resource: true,
                Parameters: true,
                ResultPath: true,
                TimeoutSeconds: true,
                HeartbeatSeconds: true,
                Retry: {
                    'Fn:ArrayOf': 'Retrier'
                },
                Catch: {
                    'Fn:ArrayOf': 'Catcher'
                }
            },
            hasCommonProperties: true
        },
        Choice: {
            Properties: {
                Comment: true,
                InputPath: true,
                OutputPath: true,
                Type: true,
                Choices: {
                    'Fn:ArrayOf': 'ChoiceRule'
                },
                Default: true,
            }
        },
        Wait: {
            Properties: {
                Seconds: true,
                Timestamp: true,
                SecondsPath: true,
                TimestampPath: true
            },
            hasCommonProperties: true
        },
        Succeed: {
            Properties: {
                Type: true,
                Comment: true,
                InputPath: true,
                OutputPath: true,
            }
        },
        Fail: {
            Properties: {
                Cause: true,
                Error: true,
                Comment: true,
                Type:  true
            }
        },
        Parallel: {
            Properties: {
                Branches: true,
                ResultPath: true,
                Parameters: true,
                Retry: {
                    'Fn:ArrayOf': 'Retrier'
                },
                Catch: {
                    'Fn:ArrayOf': 'Catcher'
                }
            },
            hasCommonProperties: true
        },
        Map: {
            Properties: {
                Iterator: true,
                ItemsPath: true,
                MaxConcurrency: true,
                ResultPath: true,
                Parameters: true,
                Retry: {
                    'Fn:ArrayOf': 'Retrier'
                },
                Catch: {
                    'Fn:ArrayOf': 'Catcher'
                }
            },
            hasCommonProperties: true
        }
    },
    ReferenceTypes: {
        ComparisonOperators: {
            And: {
                'Fn:ArrayOf': 'NestedChoiceRule'
            },
            BooleanEquals: true,
            Not: {
                'Fn:ValueOf': 'ChoiceRule'
            },
            NumericEquals: true,
            NumericGreaterThan: true,
            NumericGreaterThanEquals: true,
            NumericLessThan: true,
            NumericLessThanEquals: true,
            Or: {
                'Fn:ArrayOf': 'NestedChoiceRule'
            },
            StringEquals: true,
            StringGreaterThan: true,
            StringGreaterThanEquals: true,
            StringLessThan: true,
            StringLessThanEquals: true,
            TimestampEquals: true,
            TimestampGreaterThan: true,
            TimestampGreaterThanEquals: true,
            TimestampLessThan: true,
            TimestampLessThanEquals: true
        },
        ChoiceRule: {
            'Fn:OneOf': 'ComparisonOperators',
            Variable: true,
            Next: true
        },
        NestedChoiceRule: {
            'Fn:OneOf': 'ComparisonOperators',
             Variable: true,
        },
        Catcher: {
            ErrorEquals: true,
            ResultPath: true,
            Next: true
        },
        Retrier: {
            ErrorEquals: true,
            IntervalSeconds: true,
            MaxAttempts: true,
            BackoffRate: true
        }
    },
    Root: {
        Comment: true,
        StartAt: true,
        TimeoutSeconds: true,
        Version: true,
        States: true
    },
    // State machines nested within Map and Parallel states
    NestedRoot: {
        Comment: true,
        StartAt: true,
        States: true
    }
}
