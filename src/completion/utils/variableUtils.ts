/*!
 * Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */
import { Asl, MonacoCompletionsResult, getAssignCompletionList, getCompletionStrings, StateType } from '../../asl-utils'
import { ASTNode } from 'vscode-json-languageservice'
import { getStateInfo, findClosestAncestorNodeByName } from '../../utils/astUtilityFunctions'

const FIELDS_INPUT = ['Parameters', 'InputPath', 'Arguments']
const FIELDS_SUCCESS = ['Output', 'Assign', 'ResultSelector', 'OutputPath']
const FIELDS_FAIL = ['Catch']
const FIELDS_MAP = ['ItemSelector']

const FIELDS_WITH_TEMPLATE = [...FIELDS_INPUT, ...FIELDS_SUCCESS, ...FIELDS_FAIL, ...FIELDS_MAP]

export function getVariableCompletions(
  node: ASTNode,
  value: string | undefined,
  asl: Asl,
):
  | {
      varList: string[]
      completionList: MonacoCompletionsResult
    }
  | undefined {
  const { stateName, stateType } = getStateInfo(node) || {}
  // cannot generate a list of available varialbes if not inside a state
  if (!stateName) {
    return
  }

  const supportedAncestorNode = findClosestAncestorNodeByName(node, FIELDS_WITH_TEMPLATE)
  const isError = !!findClosestAncestorNodeByName(node, FIELDS_FAIL)
  if (!supportedAncestorNode) {
    return
  }

  const availableVariables = getAssignCompletionList(asl, stateName, stateName)

  const completionList = getCompletionStrings({
    nodeVal: value || '',
    completionScope: availableVariables,
    reservedVariablesParams: {
      isError: isError,
      isSuccess: !isError && FIELDS_SUCCESS.includes(supportedAncestorNode.nodeName),
      isItemSelector: FIELDS_MAP.includes(supportedAncestorNode.nodeName),
      stateType: (stateType as StateType) || 'Task', // default to task node input if state type is undetermined
    },
  })
  const varList: string[] = completionList.items
  return { varList, completionList }
}
