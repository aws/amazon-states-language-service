/*!
 * Copyright 2025 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import { Asl } from '../definitions'
import { getAllChildren } from '../asl'

describe('getAllChildren', () => {
  it('returns empty when state not found', () => {
    const asl: Asl = {
      StartAt: 'a',
      States: {
        a: {
          Type: 'Pass',
          End: true,
        },
      },
    }

    const children = getAllChildren(asl, 'b')

    expect(children).toEqual([])
  })

  it('returns children', () => {
    const asl: Asl = {
      StartAt: 'a',
      States: {
        a: {
          Type: 'Map',
          Iterator: {
            StartAt: 'a-1',
            States: {
              'a-1': {
                Type: 'Pass',
                Next: 'a-2',
              },
              'a-2': {
                Type: 'Parallel',
                Branches: [
                  {
                    StartAt: 'a-2-1',
                    States: {
                      'a-2-1': {
                        Type: 'Pass',
                        End: true,
                      },
                    },
                  },
                  {
                    StartAt: 'a-2-2',
                    States: {
                      'a-2-2': {
                        Type: 'Pass',
                        End: true,
                      },
                    },
                  },
                ],
                End: true,
              },
            },
          },
        },
      },
    }

    const children = getAllChildren(asl, 'a')

    expect(children).toStrictEqual(['a-1', 'a-2', 'a-2-1', 'a-2-2'])
  })

  it('returns all children of a distributed Map', () => {
    const asl: Asl = {
      StartAt: 'a',
      States: {
        a: {
          Type: 'Map',
          ItemProcessor: {
            StartAt: 'a-1',
            States: {
              'a-1': {
                Type: 'Pass',
                Next: 'a-2',
              },
              'a-2': {
                Type: 'Parallel',
                Branches: [
                  {
                    StartAt: 'a-2-1',
                    States: {
                      'a-2-1': {
                        Type: 'Pass',
                        End: true,
                      },
                    },
                  },
                  {
                    StartAt: 'a-2-2',
                    States: {
                      'a-2-2': {
                        Type: 'Pass',
                        End: true,
                      },
                    },
                  },
                ],
                End: true,
              },
            },
          },
        },
      },
    }

    const children = getAllChildren(asl, 'a')

    expect(children).toStrictEqual(['a-1', 'a-2', 'a-2-1', 'a-2-2'])
  })

  it('returns all children of a nested distributed Map', () => {
    const asl: Asl = {
      StartAt: 'a',
      States: {
        a: {
          Type: 'Map',
          ItemProcessor: {
            StartAt: 'a-1',
            States: {
              'a-1': {
                Type: 'Pass',
                Next: 'a-2',
              },
              'a-2': {
                Type: 'Map',
                ItemProcessor: {
                  StartAt: 'a-2-1',
                  States: {
                    'a-2-1': {
                      Type: 'Parallel',
                      Branches: [
                        {
                          StartAt: 'a-2-1-1',
                          States: {
                            'a-2-1-1': {
                              Type: 'Pass',
                              End: true,
                            },
                          },
                        },
                        {
                          StartAt: 'a-2-1-2',
                          States: {
                            'a-2-1-2': {
                              Type: 'Pass',
                              End: true,
                            },
                          },
                        },
                      ],
                      End: true,
                    },
                  },
                },
                End: true,
              },
            },
          },
        },
      },
    }

    const children = getAllChildren(asl, 'a')

    expect(children).toStrictEqual(['a-1', 'a-2', 'a-2-1', 'a-2-1-1', 'a-2-1-2'])
  })
})
