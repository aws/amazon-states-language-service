/*!
 * Copyright 2025 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import { getDirectNext } from '../asl'

describe('getDirectNext', () => {
  it('should return null for terminal states', () => {
    expect(getDirectNext({ Type: 'Succeed' })).toBeNull()
  })

  it('should return Next for normal states', () => {
    expect(getDirectNext({ Type: 'Pass', Next: 'a' })).toBe('a')
  })

  it('should return null for normal states when there is no Next', () => {
    expect(getDirectNext({ Type: 'Pass' })).toBeNull()
  })

  it('should return Default for Choice', () => {
    expect(getDirectNext({ Type: 'Choice', Default: 'a' })).toBe('a')
  })

  it('should return First choice Next when no default', () => {
    expect(getDirectNext({ Type: 'Choice', Choices: [{ Next: 'a' }] })).toBe('a')
  })

  it('should return null when there is no Next in choice rule', () => {
    expect(getDirectNext({ Type: 'Choice', Choices: [{}] })).toBeNull()
  })

  it('should return null when there is no Choice rule nor Default', () => {
    expect(getDirectNext({ Type: 'Choice' })).toBeNull()
  })
})
