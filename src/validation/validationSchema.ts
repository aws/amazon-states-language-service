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
        QueryLanguage: true,
        Type: true
    },
    StateTypes: {
        Pass: {
            Properties: {
                Assign: true,
                Result: true,
                ResultPath: true,
                Parameters: true,
                Output: true,
            },
            hasCommonProperties: true
        },
        Task: {
            Properties: {
                Assign: true,
                Resource: true,
                Parameters: true,
                Credentials: true,
                ResultSelector: true,
                ResultPath: true,
                TimeoutSeconds: true,
                TimeoutSecondsPath: true,
                HeartbeatSeconds: true,
                HeartbeatSecondsPath: true,
                Retry: {
                    'Fn:ArrayOf': 'Retrier'
                },
                Catch: {
                    'Fn:ArrayOf': 'Catcher'
                },
                Arguments: true,
                Output: true
            },
            hasCommonProperties: true
        },
        Choice: {
            Properties: {
                Comment: true,
                InputPath: true,
                OutputPath: true,
                QueryLanguage: true,
                Type: true,
                Choices: {
                    'Fn:ArrayOf': 'ChoiceRule'
                },
                Output: true,
                Assign: true,
                Default: true,
            }
        },
        Wait: {
            Properties: {
                Assign: true,
                Seconds: true,
                Timestamp: true,
                SecondsPath: true,
                TimestampPath: true,
                Output: true,
            },
            hasCommonProperties: true
        },
        Succeed: {
            Properties: {
                QueryLanguage: true,
                Type: true,
                Comment: true,
                InputPath: true,
                OutputPath: true,
                Output: true,
            }
        },
        Fail: {
            Properties: {
                Error: true,
                ErrorPath: true,
                Cause: true,
                CausePath: true,
                Comment: true,
                QueryLanguage: true,
                Type: true
            }
        },
        Parallel: {
            Properties: {
                QueryLanguage: true,
                Assign: true,
                Branches: true,
                ResultPath: true,
                Parameters: true,
                ResultSelector: true,
                Arguments: true,
                Output: true,
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
                QueryLanguage: true,
                Assign: true,
                Iterator: true,
                ItemsPath: true,
                Items: true,
                MaxConcurrency: true,
                MaxConcurrencyPath: true,
                ResultPath: true,
                Output: true,
                Parameters: true,
                ResultSelector: true,
                ItemReader: true,
                ItemSelector: true,
                ItemBatcher: true,
                ResultWriter: true,
                ItemProcessor: true,
                ToleratedFailurePercentage: true,
                ToleratedFailurePercentagePath: true,
                ToleratedFailureCount: true,
                ToleratedFailureCountPath: true,
                Label: true,
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
            Not: {
                'Fn:ValueOf': 'NestedChoiceRule'
            },
            Or: {
                'Fn:ArrayOf': 'NestedChoiceRule'
            },
            BooleanEquals: true,
            NumericEquals: true,
            NumericGreaterThan: true,
            NumericGreaterThanEquals: true,
            NumericLessThan: true,
            NumericLessThanEquals: true,
            StringEquals: true,
            StringGreaterThan: true,
            StringGreaterThanEquals: true,
            StringLessThan: true,
            StringLessThanEquals: true,
            TimestampEquals: true,
            TimestampGreaterThan: true,
            TimestampGreaterThanEquals: true,
            TimestampLessThan: true,
            TimestampLessThanEquals: true,
            BooleanEqualsPath: true,
            NumericEqualsPath: true,
            NumericGreaterThanPath: true,
            NumericGreaterThanEqualsPath: true,
            NumericLessThanPath: true,
            NumericLessThanEqualsPath: true,
            StringEqualsPath: true,
            StringGreaterThanPath: true,
            StringGreaterThanEqualsPath: true,
            StringLessThanPath: true,
            StringLessThanEqualsPath: true,
            TimestampEqualsPath: true,
            TimestampGreaterThanPath: true,
            TimestampGreaterThanEqualsPath: true,
            TimestampLessThanPath: true,
            TimestampLessThanEqualsPath: true,
            StringMatches: true,
            IsNull: true,
            IsPresent: true,
            IsNumeric: true,
            IsString: true,
            IsBoolean: true,
            IsTimestamp: true
        },
        ChoiceRule: {
            'Fn:OneOf': 'ComparisonOperators',
            Assign: true,
            Variable: true,
            Condition: true,
            Output: true,
            Next: true,
            Comment: true
        },
        NestedChoiceRule: {
            'Fn:OneOf': 'ComparisonOperators',
            Assign: true,
            Variable: true,
            Comment: true
        },
        Catcher: {
            ErrorEquals: true,
            ResultPath: true,
            Output: true,
            Next: true,
            Comment: true,
            Assign: true,
        },
        Retrier: {
            ErrorEquals: true,
            IntervalSeconds: true,
            MaxAttempts: true,
            BackoffRate: true,
            Comment: true,
            MaxDelaySeconds: true,
            JitterStrategy: true
        }
    },
    Root: {
        Comment: true,
        StartAt: true,
        TimeoutSeconds: true,
        Version: true,
        QueryLanguage: true,
        States: true
    },
    // State machines nested within Map and Parallel states
    NestedParallelRoot: {
        Comment: true,
        StartAt: true,
        QueryLanguage: true,
        States: true
    },
    NestedMapRoot: {
        Comment: true,
        StartAt: true,
        QueryLanguage: true,
        States: true,
        ProcessorConfig: true
    }
}
