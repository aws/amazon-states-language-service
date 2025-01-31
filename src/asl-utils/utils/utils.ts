/*!
 * Copyright 2025 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import cloneDeep from 'lodash/cloneDeep'

/**
 * Creates a deep clone of the given object.
 * Use this function to convert a frozen state to an immutable one.
 *
 * See {@link Store}
 */
export function deepClone<T>(obj: T): T {
  // structuredClone does not copy functions/symbols, but lodash/cloneDeep does
  return cloneDeep(obj)
}

export function lastItem(arr: any[]): any | undefined {
  return arr.length > 0 ? arr[arr.length - 1] : undefined
}

/**
 * The value could be anything from the ASL. We first confirm if its a string and then check if its a JSONata expression
 * @param value any value from the definition
 * @returns true if the given value is a JSONata expression.
 */
export const isJSONataExpression = (value: unknown): value is `{%${string}%}` =>
  typeof value === 'string' && value.startsWith('{%') && value.endsWith('%}') && value.length >= 4

/**
 * Returns true if JSON is valid and false otherwise
 */
export const isValidJSON = (jsonString: string): boolean => {
  try {
    JSON.parse(jsonString)
    return true
  } catch (error) {
    return false
  }
}
