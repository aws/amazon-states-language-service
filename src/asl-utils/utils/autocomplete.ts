/*!
 * Copyright 2025 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import merge from 'lodash/merge'
import get from 'lodash/get'
import {
  Asl,
  WithVariables,
  StateId,
  isDistributedMap,
  isDistributedMode,
  isChoice,
  JsonObject,
  JsonMap,
  isWithVariables,
  isWithErrorHandled,
  StateType,
} from '../asl/definitions'
import { getStateIdFromBranchPath, visitAllStates, getDirectNext, findStateById } from '../asl/asl'

import { deepClone, isJSONataExpression, isValidJSON } from './utils'

export const JSON_EDITING_PROPERTY = 'ValueEnteredInForm'
export const VARIABLE_PREFIX = '$'
export const CONTEXT_OBJECT_PREFIX = '$$.'
export const VARIABLE_TRANSFORM_KEY_SUFFIX = '.$'

export const CONTEXT_OBJECT_KEYS = {
  Execution: {
    Id: null,
    Input: null,
    Name: null,
    RoleArn: null,
    StartTime: null,
    RedriveCount: null,
    RedriveTime: null,
  },
  State: {
    EnteredTime: null,
    Name: null,
    RetryCount: null,
  },
  StateMachine: {
    Id: null,
    Name: null,
  },
  Task: {
    Token: null,
  },
}

const MAP_STATE_CONTEXT = {
  Map: {
    Item: {
      Index: null,
      Value: null,
    },
  },
}

export const RESERVED_VARIABLES = {
  states: {
    input: null, // the state's raw input,
    context: CONTEXT_OBJECT_KEYS, // the Context Object
  },
}

export const RESERVED_VARIABLES_ERROR = {
  states: {
    errorOutput: null, // the Error Output (in a Catch),
  },
}

export const RESERVED_VARIABLES_SUCCESS = {
  states: {
    result: null, // the API or sub-workflow's result (if successful),
  },
}

export type PreviousStatesMap = Record<StateId, Set<StateId>>
export interface VariableCompletionList {
  localScope: JsonMap
  outerScope?: JsonMap
}

interface StateToExplore {
  stateId: StateId
  nextState: StateId
}

let previousStatesMap: PreviousStatesMap = {}

/**
 * Find previous nodes for each state in asl.
 * @param asl
 * @returns hash map with stateId mapping to a set of previous nodes
 */
export const buildPreviousStatesMap = (asl: Asl): Record<StateId, Set<StateId>> => {
  previousStatesMap = {}
  visitAllStates(asl, (id, state) => {
    const nextStateIds = [getDirectNext(state)]

    if (isChoice(state)) {
      state.Choices?.forEach((choice) => {
        choice.Next && nextStateIds.push(choice.Next)
      })
      state.Default && nextStateIds.push(state.Default)
    }

    if (isWithErrorHandled(state)) {
      state.Catch?.forEach((rule) => {
        rule.Next && nextStateIds.push(rule.Next)
      })
    }

    nextStateIds.forEach((nextStateId) => {
      if (!nextStateId) return
      if (previousStatesMap[nextStateId]) {
        previousStatesMap[nextStateId].add(id)
      } else {
        previousStatesMap[nextStateId] = new Set([id])
      }
    })
    return true
  })
  return previousStatesMap
}

/**
 * Get Assign varaible JSON object to be passed to the next state
 * The return JsonObject contains variables keys only
 * @param state
 * @param nextStateId
 * @returns
 */
const getAssignVariables = (state: WithVariables, nextStateId: string): JsonObject => {
  let variables: JsonObject = {}

  if (isWithErrorHandled(state)) {
    state.Catch?.forEach((catcher) => {
      if (catcher.Assign && catcher.Next === nextStateId) {
        variables = merge(variables, getAssignKeys(catcher.Assign))
      }
    })
  }
  if (isChoice(state)) {
    state.Choices?.forEach((choice) => {
      if (choice.Assign && choice.Next === nextStateId) {
        variables = merge(variables, getAssignKeys(choice.Assign))
      }
    })
    if (state.Default === nextStateId && state.Assign) {
      variables = merge(variables, getAssignKeys(state.Assign))
    }
  } else if (state.Next === nextStateId && state.Assign) {
    variables = merge(variables, getAssignKeys(state.Assign))
  }

  return variables
}

/**
 * Helper function to keep only object keys and discard value in JsonMap and JSONArray.
 * @param jsonField input JsonObject
 * @returns JsonObject with keys only, null if key value has a typeof JsonPrimitive
 */
const getJsonKeysFromArrayOrObject = (jsonField: JsonObject): JsonObject | null => {
  const keys: JsonObject = {}
  if (Array.isArray(jsonField)) {
    return jsonField.map((element) => getJsonKeysFromArrayOrObject(element))
  } else if (jsonField && typeof jsonField === 'object') {
    for (const jsonKey of Object.keys(jsonField)) {
      keys[jsonKey] = getJsonKeysFromArrayOrObject(jsonField[jsonKey])
    }
  }
  return Object.keys(keys) ? keys : null
}

/**
 * Helper function to keep only keys and discard value in JsonMap.
 * Return jsonMap has the same stcuture as the input JSON.
 * @param json input json map
 * @returns JsonMap with keys only
 */
const getAssignKeys = (json: JsonMap): JsonMap | null => {
  const keysMap: JsonMap = {}
  for (const key of Object.keys(json)) {
    // skip WFS editing property
    if (key === JSON_EDITING_PROPERTY) {
      continue
    }
    keysMap[key] = getJsonKeysFromArrayOrObject(json[key])
  }
  return Object.entries(keysMap).length ? keysMap : null
}

/**
 * Generate autocomplete Suggestion of a state, for both local scope and outer scope.
 * The function traverses the graph in reverse, from Next to Previous nodes until the first state node is reached.
 * @param asl state machine definition
 * @param target state where the auto-completion list is generated for
 * @param current state where the search is at, when entering this function.
 *  This could be the target state itself, or the map/parallel state in parent scope of target start.
 * @returns VariableCompletionList
 */
export const getAssignCompletionList = (asl: Asl, target: StateId, current: StateId): VariableCompletionList => {
  const completionList: VariableCompletionList = {
    localScope: {},
    outerScope: {},
  }
  const visited: Set<StateId> = new Set([])
  let statesToExplore: StateToExplore[] = []

  const { parentPath: currentParentPath, state: targetState } = findStateById(asl, current)
  if (!targetState) return completionList

  const isCurrentDistributedMap = isDistributedMap(targetState) && isDistributedMode(targetState)
  const parentStateId = currentParentPath && getStateIdFromBranchPath(currentParentPath)
  const isCalledFromSubWorkflow = target !== current

  const parentStates = previousStatesMap[current] ? [...previousStatesMap[current]] : []

  // only continue to explore parent nodes if the search is not from a sub-workflow inside distributed map
  if (!isCalledFromSubWorkflow || !isCurrentDistributedMap) {
    const previousStatesToExplore = parentStates.map((stateId) => ({ stateId, nextState: current }))
    statesToExplore.push(...previousStatesToExplore)
  }

  let stateToExplore: StateToExplore | undefined
  while ((stateToExplore = statesToExplore.pop())) {
    const stateName = stateToExplore.stateId
    const nextState = stateToExplore.nextState
    const stateVisitedToken = `${stateName}_${nextState}`

    if (visited.has(stateVisitedToken)) continue

    const { state } = findStateById(asl, stateName, currentParentPath || undefined)

    if (state && isWithVariables(state)) {
      completionList.localScope = merge(completionList.localScope, getAssignVariables(state, nextState))
      visited.add(stateVisitedToken)

      if (previousStatesMap[stateName]) {
        statesToExplore = statesToExplore.concat(
          [...previousStatesMap[stateName]].map((parentNode) => ({
            stateId: parentNode,
            nextState: stateName,
          })),
        )
      }
    }
  }
  let parentVariables: VariableCompletionList | undefined = undefined
  if (parentStateId) {
    parentVariables = getAssignCompletionList(asl, current, parentStateId)
    completionList.outerScope = merge(parentVariables?.localScope || {}, parentVariables?.outerScope || {})
  }
  return completionList
}

export interface GetReservedVariablesParams {
  isError?: boolean
  isSuccess?: boolean
  isItemSelector?: boolean
  stateType: StateType
}

/**
 * Generate reserved variables auto-complete suggestion based on state context
 * @param param.isError if editor is for error catcher blocker
 * @param param.isSuccess if editor is for assignment after state success
 * @param param.isItemSelector if editor is for item selector in a map state
 * @param param.stateType State type
 * @returns object keys of reserved variables
 */
export const getReservedVariables = (params: GetReservedVariablesParams): Record<string, any> => {
  const { isError, isSuccess, isItemSelector, stateType } = params
  let reservedVariables = deepClone(RESERVED_VARIABLES)

  if (isItemSelector) {
    reservedVariables.states.context = merge(RESERVED_VARIABLES.states.context, MAP_STATE_CONTEXT)
  }

  if (isError) {
    reservedVariables = merge(reservedVariables, RESERVED_VARIABLES_ERROR)
  } else if (isSuccess && (stateType === 'Map' || stateType === 'Task' || stateType === 'Parallel')) {
    reservedVariables = merge(reservedVariables, RESERVED_VARIABLES_SUCCESS)
  }

  return reservedVariables
}

export interface GetMonacoCompletionsParams {
  nodeVal: string
  completionScope: VariableCompletionList
  reservedVariablesParams: GetReservedVariablesParams
}

export interface MonacoCompletionsResult {
  parentPath: string
  items: string[]
}

export const getCompletionStrings = (params: GetMonacoCompletionsParams): MonacoCompletionsResult => {
  const { nodeVal, completionScope } = params
  const items: string[] = []

  const objectPath = nodeVal.replace(VARIABLE_PREFIX, '').split('.')
  const parentPathKey = objectPath.slice(0, objectPath.length - 1).join('.')
  const variablePrefix = objectPath.length > 1 ? '' : VARIABLE_PREFIX

  const reservedVariables = getReservedVariables(params.reservedVariablesParams)

  const allVariableOptions = merge(completionScope.outerScope, completionScope.localScope, reservedVariables)
  const autoCompleteScope = parentPathKey ? get(allVariableOptions, parentPathKey) : allVariableOptions

  Object.keys(autoCompleteScope || {}).forEach((variable: string) => {
    const keyName = variable.replace(VARIABLE_TRANSFORM_KEY_SUFFIX, '')
    items.push(`${variablePrefix}${keyName}`)
  })
  return {
    parentPath: parentPathKey,
    items,
  }
}

const JSONATA_MACRO_REGEX = /^\s*{%\s*%?}?\s*/
const JSONATA_TYPO_MACRO_REGEX = /^\s*%{?\s*}?%?\s*/

const trimMacroContent = (text: string, prefix: string, suffix: string): string => {
  let textWithPrefixTrimmed = text.trim()
  for (const character of prefix) {
    if (textWithPrefixTrimmed.startsWith(character)) {
      textWithPrefixTrimmed = textWithPrefixTrimmed.slice(1)
    }
  }

  let textWithSuffixTrimmed = textWithPrefixTrimmed
  for (const character of suffix.split('').reverse().join('')) {
    if (textWithSuffixTrimmed.endsWith(character)) {
      textWithSuffixTrimmed = textWithSuffixTrimmed.slice(0, textWithSuffixTrimmed.length - 1)
    }
  }

  return textWithSuffixTrimmed
}

export const getJSONataMacroContent = (
  text: string,
): {
  content: string
  isTypo: boolean
} | null => {
  if (isJSONataExpression(text) || isValidJSON(text) || text.includes('\n')) {
    return null
  }

  if (JSONATA_MACRO_REGEX.test(text)) {
    return {
      content: trimMacroContent(text, '{%', '%}'),
      isTypo: false,
    }
  }

  if (JSONATA_TYPO_MACRO_REGEX.test(text)) {
    return {
      content: trimMacroContent(text, '%{', '}%'),
      isTypo: true,
    }
  }

  return null
}
