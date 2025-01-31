/*!
 * Copyright 2025 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import { Asl } from '../definitions'
import { StatePath, visitAllStates, visitAllStatesInBranch, getAllStateIds } from '../asl'

describe('visitAllStates', () => {
  it('visits all states', () => {
    const asl: Asl = {
      StartAt: 'parallel',
      States: {
        parallel: {
          Type: 'Parallel',
          Branches: [
            {
              StartAt: 'parallel-0-a',
              States: {
                'parallel-0-a': {
                  Type: 'Pass',
                  Next: 'parallel-0-b',
                },
                'parallel-0-b': {
                  Type: 'Map',
                  Iterator: {
                    StartAt: 'parallel-0-b-x',
                    States: {
                      'parallel-0-b-x': {
                        Type: 'Pass',
                        Next: 'parallel-0-b-y',
                      },
                      'parallel-0-b-y': {
                        Type: 'Pass',
                        End: true,
                      },
                    },
                  },
                  Next: 'parallel-0-c',
                },
                'parallel-0-c': {
                  Type: 'Parallel',
                  End: true,
                },
              },
            },
            {
              StartAt: 'parallel-1-a',
              States: {
                'parallel-1-a': {
                  Type: 'Pass',
                  End: true,
                },
              },
            },
          ],
          Next: 'pass',
        },
        pass: {
          Type: 'Pass',
          End: true,
        },
      },
    }

    const visitedStateInfo: { id: string; path: StatePath }[] = []

    visitAllStates(asl, (id, _, __, path) => {
      visitedStateInfo.push({ id, path })
      return true
    })

    expect(visitedStateInfo).toEqual([
      { id: 'parallel', path: ['parallel'] },
      { id: 'parallel-0-a', path: ['parallel', 0, 'parallel-0-a'] },
      { id: 'parallel-0-b', path: ['parallel', 0, 'parallel-0-b'] },
      { id: 'parallel-0-b-x', path: ['parallel', 0, 'parallel-0-b', 'parallel-0-b-x'] },
      { id: 'parallel-0-b-y', path: ['parallel', 0, 'parallel-0-b', 'parallel-0-b-y'] },
      { id: 'parallel-0-c', path: ['parallel', 0, 'parallel-0-c'] },
      { id: 'parallel-1-a', path: ['parallel', 1, 'parallel-1-a'] },
      { id: 'pass', path: ['pass'] },
    ])
  })

  it('visits orphan states', () => {
    const asl: Asl = {
      StartAt: 'a',
      States: {
        a: {
          Type: 'Pass',
          End: true,
        },
        b: {
          Type: 'Pass',
          End: true,
        },
      },
    }

    const visitedStateIds: string[] = []
    visitAllStates(asl, (id) => {
      visitedStateIds.push(id)
      return true
    })

    expect(visitedStateIds).toEqual(['a', 'b'])
  })

  it('does not loop', () => {
    const asl: Asl = {
      StartAt: 'a',
      States: {
        a: {
          Type: 'Pass',
          Next: 'b',
        },
        b: {
          Type: 'Pass',
          Next: 'a',
        },
      },
    }

    const visitedStateIds: string[] = []
    visitAllStates(asl, (id) => {
      visitedStateIds.push(id)
      return true
    })

    expect(visitedStateIds).toEqual(['a', 'b'])
  })

  it('stops when visitor returns false', () => {
    const asl: Asl = {
      StartAt: 'a',
      States: {
        a: {
          Type: 'Pass',
          Next: 'b',
        },
        b: {
          Type: 'Pass',
          Next: 'c',
        },
        c: {
          Type: 'Pass',
          End: true,
        },
      },
    }

    const visitedStateIds: string[] = []
    visitAllStates(asl, (id) => {
      visitedStateIds.push(id)
      return id !== 'b'
    })

    expect(visitedStateIds).toEqual(['a', 'b'])
  })

  it('stops when visitor returns false in legacy Map', () => {
    const asl: Asl = {
      StartAt: 'a',
      States: {
        a: {
          Type: 'Pass',
          Next: 'b',
        },
        map: {
          Type: 'Map',
          Iterator: {
            StartAt: 'x',
            States: {
              x: {
                Type: 'Pass',
                Next: 'y',
              },
              y: {
                Type: 'Pass',
                End: true,
              },
            },
          },
          Next: 'c',
        },
        c: {
          Type: 'Pass',
          End: true,
        },
      },
    }

    const visitedStateIds: string[] = []
    visitAllStates(asl, (id) => {
      visitedStateIds.push(id)
      return id !== 'x'
    })

    expect(visitedStateIds).toEqual(['a', 'map', 'x'])
  })

  it('stops when visitor returns false in Distributed Map', () => {
    const asl: Asl = {
      StartAt: 'Map',
      States: {
        map: {
          Type: 'Map',
          ItemProcessor: {
            StartAt: 'x',
            States: {
              x: {
                Type: 'Pass',
                Next: 'y',
              },
              y: {
                Type: 'Pass',
                End: true,
              },
            },
          },
          Next: 'c',
        },
        c: {
          Type: 'Pass',
          End: true,
        },
      },
    }

    const visitedStateIds: string[] = []
    const stopped = !visitAllStatesInBranch(asl, ['map'], (id) => {
      visitedStateIds.push(id)
      return id !== 'x'
    })
    expect(stopped).toBe(true)

    const notStopped = visitAllStatesInBranch(asl, ['map'], (id) => {
      visitedStateIds.push(id)
      return true
    })
    expect(notStopped).toBe(true)
  })

  it('stops when visitor returns false in Parallel', () => {
    const asl: Asl = {
      StartAt: 'a',
      States: {
        a: {
          Type: 'Pass',
          Next: 'b',
        },
        parallel: {
          Type: 'Parallel',
          Branches: [
            {
              StartAt: 'x1',
              States: {
                x1: {
                  Type: 'Pass',
                  Next: 'y1',
                },
                y1: {
                  Type: 'Pass',
                  End: true,
                },
              },
            },
            {
              StartAt: 'x2',
              States: {
                x2: {
                  Type: 'Pass',
                  Next: 'y2',
                },
                y2: {
                  Type: 'Pass',
                  End: true,
                },
              },
            },
          ],
          Next: 'c',
        },
        c: {
          Type: 'Pass',
          End: true,
        },
      },
    }

    const visitedStateIds: string[] = []
    visitAllStates(asl, (id) => {
      visitedStateIds.push(id)
      return id !== 'x1'
    })

    expect(visitedStateIds).toEqual(['a', 'parallel', 'x1'])
  })

  it('should not visit if there is no States', () => {
    const asl: Asl = {
      StartAt: 'a',
    }

    const visitedStateIds: string[] = []
    visitAllStates(asl, (id) => {
      visitedStateIds.push(id)
      return true
    })

    expect(visitedStateIds).toEqual([])
  })

  it('should handle Iterator without States', () => {
    const asl: Asl = {
      StartAt: 'a',
      States: {
        a: {
          Type: 'Map',
          Iterator: {},
        },
      },
    }

    const visitedStateIds: string[] = []
    visitAllStates(asl, (id) => {
      visitedStateIds.push(id)
      return true
    })

    expect(visitedStateIds).toEqual(['a'])
  })

  it('should handle branch without States', () => {
    const asl: Asl = {
      StartAt: 'a',
      States: {
        a: {
          Type: 'Parallel',
          Branches: [{}],
        },
      },
    }

    const visitedStateIds: string[] = []
    visitAllStates(asl, (id) => {
      visitedStateIds.push(id)
      return true
    })

    expect(visitedStateIds).toEqual(['a'])
  })
})

describe('getAllStateIds', () => {
  it('should get all stateIds', () => {
    const asl: Asl = {
      StartAt: 'a',
      States: {
        a: {
          Type: 'Pass',
          Next: 'b',
        },
        map: {
          Type: 'Map',
          Iterator: {
            StartAt: 'x',
            States: {
              x: {
                Type: 'Pass',
                Next: 'y',
              },
              y: {
                Type: 'Pass',
                End: true,
              },
            },
          },
          Next: 'c',
        },
        c: {
          Type: 'Pass',
          End: true,
        },
      },
    }

    const statesIds = getAllStateIds(asl)

    expect(statesIds).toEqual(['a', 'map', 'x', 'y', 'c'])
  })
})
