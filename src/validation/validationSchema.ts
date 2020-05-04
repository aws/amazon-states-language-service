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
    Specific: {
        Pass: {
            Properties: {
                Result: true,
                ResultPath: true,
                Parameters: true
            }
        },
        Task: {
            Properties: {
                Resource: true,
                Parameters: true,
                ResultPath: true,
                TimeoutSeconds: true,
                HeartbeatSeconds: true,
                Retry: {
                    'Fn:ArrayOf': 'Retry'
                },
                Catch: {
                    'Fn:ArrayOf': 'Catch'
                }
            }
        },
        Choice: {
            Properties: {
                Comment: true,
                InputPath: true,
                OutputPath: true,
                Type: true,
                Choices: {
                    'Fn:ArrayOf': 'Choices'
                },
                Default: true,
                hasCommonFields: false
            }
        },
        Wait: {
            Properties: {
                Seconds: true,
                Timestamp: true,
                SecondsPath: true,
                TimestampPath: true
            }
        },
        Succeed: {
            Properties: {
                Type: true,
                Comment: true,
                InputPath: true,
                OutputPath: true,
            },
            hasCommonFields: false
        },
        Fail: {
            Properties: {
                Cause: true,
                Error: true,
                Comment: true,
                Type:  true
            },
            hasCommonFields: false
        },
        Parallel: {
            Properties: {
                Branches: true,
                ResultPath: true,
                Parameters: true,
                Retry: {
                    'Fn:ArrayOf': 'Retry'
                },
                Catch: {
                    'Fn:ArrayOf': 'Catch'
                }
            }
        },
        Map: {
            Properties: {
                Iterator: true,
                ItemsPath: true,
                MaxConcurrency: true,
                ResultPath: true,
                Parameters: true,
                Retry: {
                    'Fn:ArrayOf': 'Retry'
                },
                Catch: {
                    'Fn:ArrayOf': 'Catch'
                }
            }
        }
    },
    Sets: {
        ChoiceRules: {
            And: {
                'Fn:ArrayOf': 'Choices'
            },
            BooleanEquals: true,
            Not: {
                'Fn:ValueOf': 'Choices'
            },
            NumericEquals: true,
            NumericGreaterThan: true,
            NumericGreaterThanEquals: true,
            NumericLessThan: true,
            NumericLessThanEquals: true,
            Or: {
                'Fn:ArrayOf': 'Choices'
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
        Choices: {
            'Fn:OneOf': 'ChoiceRules',
            Variable: true,
            Next: true
        },
        Catch: {
            ErrorEquals: true,
            ResultPath: true,
            Next: true
        },
        Retry: {
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
