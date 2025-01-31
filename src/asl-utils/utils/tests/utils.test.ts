/*!
 * Copyright 2025 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import { deepClone, isJSONataExpression, isValidJSON, lastItem } from '../utils'

describe('lastItem', () => {
  it('should return the last item of array', () => {
    expect(lastItem([])).toBeUndefined()
    expect(lastItem([1])).toBe(1)
    expect(lastItem([1, 2, 3])).toBe(3)
  })
})
describe('deepClone', () => {
  it('should deepClone objects', () => {
    const obj = {
      val: 1,
      prop: {
        val2: 0,
        val3: {
          name: 'a',
          condition: false,
          myArr: [1, 2, 3, 4],
          myFunc: () => {
            // noop
          },
          [Symbol.iterator]: {},
        },
      },
    }
    expect(JSON.stringify(deepClone(obj))).toBe(JSON.stringify(obj))
  })
})

describe('isValidJSON', () => {
  it('should return true if json is valid', () => {
    const validJson = `{
        "a": "b",
        "c": {
          "d": "e"
        }
      }`
    expect(isValidJSON(validJson)).toBe(true)
  })

  it('should return false if json is invalid', () => {
    const invalidJson = `{
        "a": "b
      }`
    const invalidJson2 = `{
        3: 5,
      }`

    expect(isValidJSON(invalidJson)).toBe(false)
    expect(isValidJSON(invalidJson2)).toBe(false)
  })
})

describe('isJSONataExpression', () => {
  it.each(['{% expression %}', '{%%}'])('should return true for %s', (expression) => {
    expect(isJSONataExpression(expression)).toBe(true)
  })

  it('should return false if not a string', () => {
    expect(isJSONataExpression(123)).toBe(false)
    expect(isJSONataExpression(null)).toBe(false)
    expect(isJSONataExpression({})).toBe(false)
  })

  it('should return false if string does not start with {%', () => {
    expect(isJSONataExpression('expression %}')).toBe(false)
  })

  it.each(['%{ expression }%', '   {% expression %}', '{% expression %}   '])(
    'should return false if string is %s',
    (expression) => {
      expect(isJSONataExpression(expression)).toBe(false)
    },
  )

  it('should return false if string does not end with %}', () => {
    expect(isJSONataExpression('{% expression')).toBe(false)
  })

  it('should return false if empty string', () => {
    expect(isJSONataExpression('')).toBe(false)
  })

  it('should return false if string does not include both starting and ending expression', () => {
    expect(isJSONataExpression('{%}')).toBe(false)
  })
})
