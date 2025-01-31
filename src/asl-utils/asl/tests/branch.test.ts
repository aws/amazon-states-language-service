/*!
 * Copyright 2025 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import { getBranchIndex, getStateIdFromBranchPath } from '../asl'

describe('getStateIdFromBranchPath', () => {
  it('should return stateId from a Parallel branch path', () => {
    expect(getStateIdFromBranchPath(['ParallelState', 2])).toBe('ParallelState')
  })

  it('should return stateId from a branch path', () => {
    expect(getStateIdFromBranchPath(['StateName'])).toBe('StateName')
  })
})

describe('getBranchIndex', () => {
  it('should return the branch index from the branch name', () => {
    expect(getBranchIndex('Branches[0]')).toEqual(0)
    expect(getBranchIndex('Branches[10]')).toEqual(10)
  })

  it('should return null when it is not valid branch name', () => {
    expect(getBranchIndex('Branches')).toBeNull()
    expect(getBranchIndex('Branches[]')).toBeNull()
    expect(getBranchIndex('Branch[0]')).toBeNull()
    expect(getBranchIndex('branches[0]')).toBeNull()
    expect(getBranchIndex('')).toBeNull()
    expect(getBranchIndex('Branches[-1]')).toBeNull()
    expect(getBranchIndex('Branches[1.1]')).toBeNull()
    expect(getBranchIndex('Branches(0)')).toBeNull()
  })
})
