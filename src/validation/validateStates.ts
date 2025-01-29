/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

/* tslint:disable:cyclomatic-complexity */

import {
  Diagnostic,
  DiagnosticSeverity,
  ObjectASTNode,
  PropertyASTNode,
  Range,
  TextDocument,
} from 'vscode-json-languageservice'

import {
  ASLOptions,
  findPropChildByName,
  getListOfStateNamesFromStateNode,
  isArrayNode,
  isObjectNode,
} from '../utils/astUtilityFunctions'

import { MESSAGES } from '../constants/diagnosticStrings'
import getPropertyNodeDiagnostic from './utils/getPropertyNodeDiagnostic'
import validateProperties from './validateProperties'
import schema from './validationSchema'

const INTRINSIC_FUNC_REGEX =
  /^States\.(?:(JsonToString|Format|StringToJson|Array|ArrayContains|ArrayGetItem|ArrayLength|ArrayPartition|ArrayRange|ArrayUnique|Base64Decode|Base64Encode|Hash|JsonMerge|MathAdd|MathRandom|StringSplit)\(.+\)|(UUID)\(\))$/s

// update src/constants/diagnosticStrings INVALID_JSON_PATH_OR_INTRINSIC_STRING_ONLY when you change this regex.
const INTRINSIC_FUNC_REGEX_STRING_RETURN =
  /^States\.(?:(JsonToString|Format|ArrayGetItem|Base64Decode|Base64Encode|Hash)\(.+\)|(UUID)\(\))$/s

export const enum RootType {
  Root = 0,
  Map = 1,
  Parallel = 2,
}

function stateNameExistsInPropNode(
  nextPropNode: PropertyASTNode,
  stateNames: string[],
  document: TextDocument,
  message: string,
): Diagnostic | void {
  const stateNameExists = (stateNames as unknown[]).includes(nextPropNode?.valueNode?.value)

  if (nextPropNode && nextPropNode.valueNode && !stateNameExists) {
    const { length, offset } = nextPropNode.valueNode
    const range = Range.create(document.positionAt(offset), document.positionAt(offset + length))

    return Diagnostic.create(range, message, DiagnosticSeverity.Error)
  }
}

interface ValidateCatchResult {
  diagnostics: Diagnostic[]
  reachedStates: { [ix: string]: boolean }
}

function isIntrinsicFunction(text: string): boolean {
  const intrinsicText = text.trimRight()

  return INTRINSIC_FUNC_REGEX.test(intrinsicText)
}

/**
 * Evaluate whether input is an Intrinsic Function that returns string.
 * Intrinsic functions with return types other than string will return False.
 * @param text Input string.
 * @returns True if text is an Intrinsic Function that returns a string.
 */
function isIntrinsicFunctionWithStringReturn(text: string): boolean {
  const intrinsicText = text.trimEnd()

  return INTRINSIC_FUNC_REGEX_STRING_RETURN.test(intrinsicText)
}

function isJsonPath(text: string) {
  return text.startsWith('$')
}

/**
 * Validate that the field is a JsonPath or Intrinsic Function.
 * Only allows intrinsic functions that return strings.
 * @param pathField The field to evaluate.
 * @param document The document to evaluate.
 * @returns A diagnostics array of any validation issues.
 */
function validatePathField(pathField: PropertyASTNode, document: TextDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = []
  const valueNode = pathField.valueNode
  const propValue = valueNode && valueNode.value

  if (typeof propValue !== 'string' || !(isJsonPath(propValue) || isIntrinsicFunctionWithStringReturn(propValue))) {
    const { length, offset } = pathField
    const range = Range.create(document.positionAt(offset), document.positionAt(offset + length))

    diagnostics.push(
      Diagnostic.create(range, MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC_STRING_ONLY, DiagnosticSeverity.Error),
    )
  }

  return diagnostics
}

/**
 * Validates a *Path style field.
 *
 * A path-style field has two different input fields: MyField and MyFieldPath.
 * These fields are mutually exclusive - you cannot specify both at the same
 * time.
 * The base field ("MyField") takes a static string input.
 * The path-field ("MyFieldPath") lets you use JsonPath or Intrinsic Functions
 * to give a value to the base field ("MyField").
 *
 * @param stateNode The node to evaluate
 * @param propertyName The base property name ("MyField")
 * @param document The document to evaluate
 * @returns A diagnostics array of any validation issues.
 */
function validateExclusivePathTypeField(
  stateNode: ObjectASTNode,
  propertyName: string,
  document: TextDocument,
): Diagnostic[] {
  let diagnostics: Diagnostic[] = []

  const pathFieldName = `${propertyName}Path`
  const pathNode = findPropChildByName(stateNode, pathFieldName)

  if (pathNode) {
    const validatePathFieldDiagnostics = validatePathField(pathNode, document)
    diagnostics = diagnostics.concat(validatePathFieldDiagnostics)

    // Myfield and MyfieldPath are mutually exclusive
    if (findPropChildByName(stateNode, propertyName)) {
      const { length, offset } = pathNode
      const range = Range.create(document.positionAt(offset), document.positionAt(offset + length))
      const errorMessage = `You cannot set both ${propertyName} and ${pathFieldName} at the same time.`
      diagnostics.push(Diagnostic.create(range, errorMessage, DiagnosticSeverity.Error))
    }
  }

  return diagnostics
}

function validateParameters(parametersPropNode: PropertyASTNode, document: TextDocument): Diagnostic[] {
  let diagnostics: Diagnostic[] = []
  const valueNode = parametersPropNode.valueNode

  if (valueNode && isObjectNode(valueNode)) {
    valueNode.properties.forEach((prop) => {
      if (prop.valueNode && prop.keyNode.value.endsWith('.$')) {
        const propValue = prop.valueNode.value

        if (typeof propValue !== 'string' || !(isJsonPath(propValue) || isIntrinsicFunction(propValue))) {
          const { length, offset } = prop.valueNode
          const range = Range.create(document.positionAt(offset), document.positionAt(offset + length))

          diagnostics.push(Diagnostic.create(range, MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC, DiagnosticSeverity.Error))
        }
      } else if (prop.valueNode && isObjectNode(prop.valueNode)) {
        diagnostics = diagnostics.concat(validateParameters(prop, document))
      }
    })
  }

  return diagnostics
}

// Validates next property within array of objects
function validateArrayNext(
  arrayPropName: string,
  oneStateValueNode: ObjectASTNode,
  stateNames: string[],
  document: TextDocument,
): ValidateCatchResult {
  const arrayPropNode = findPropChildByName(oneStateValueNode, arrayPropName)
  const diagnostics: Diagnostic[] = []
  const reachedStates: { [ix: string]: boolean } = {}

  if (arrayPropNode?.valueNode && isArrayNode(arrayPropNode.valueNode)) {
    arrayPropNode.valueNode.items.forEach((item) => {
      if (isObjectNode(item)) {
        const nextProp = findPropChildByName(item, 'Next')

        if (nextProp) {
          const nextPropValue = nextProp.valueNode?.value
          const diagnostic = stateNameExistsInPropNode(nextProp, stateNames, document, MESSAGES.INVALID_NEXT)

          if (diagnostic) {
            diagnostics.push(diagnostic)
          } else if (typeof nextPropValue === 'string') {
            reachedStates[nextPropValue] = true
          }
        }
      }
    })
  }

  return { diagnostics, reachedStates }
}

export default function validateStates(
  rootNode: ObjectASTNode,
  document: TextDocument,
  rootType: RootType,
  options?: ASLOptions,
): Diagnostic[] {
  const statesNode = findPropChildByName(rootNode, 'States')
  const startAtNode = findPropChildByName(rootNode, 'StartAt')

  // Different schemas for root and root of nested state machine
  let rootSchema: object = schema.Root
  if (rootType === RootType.Map) {
    rootSchema = schema.NestedMapRoot
  } else if (rootType === RootType.Parallel) {
    rootSchema = schema.NestedParallelRoot
  }
  let diagnostics: Diagnostic[] = []

  // Check root property names against the schema
  rootNode.properties.forEach((prop) => {
    const key = prop.keyNode.value

    if (!rootSchema[key]) {
      diagnostics.push(getPropertyNodeDiagnostic(prop, document, MESSAGES.INVALID_PROPERTY_NAME))
    }
  })

  if (statesNode) {
    const stateNames = getListOfStateNamesFromStateNode(statesNode, options?.ignoreColonOffset)
    const statesValueNode = statesNode.valueNode

    if (startAtNode) {
      const stateNameExists = (stateNames as unknown[]).includes(startAtNode.valueNode?.value)

      if (startAtNode.valueNode && !stateNameExists) {
        const { length, offset } = startAtNode.valueNode
        const range = Range.create(document.positionAt(offset), document.positionAt(offset + length))

        diagnostics.push(Diagnostic.create(range, MESSAGES.INVALID_START_AT, DiagnosticSeverity.Error))
      }
    }

    if (statesValueNode && isObjectNode(statesValueNode)) {
      // keep track of reached states and unreached states to avoid multiple loops
      let reachedStates: { [ix: string]: boolean } = {}
      let hasTerminalState = false

      const startAtValue = startAtNode?.valueNode?.value

      // mark state referred to in StartAt as reached
      if (typeof startAtValue === 'string') {
        reachedStates[startAtValue] = true
      }

      statesValueNode.properties.forEach((prop) => {
        const oneStateValueNode = prop.valueNode

        if (oneStateValueNode && isObjectNode(oneStateValueNode)) {
          diagnostics = diagnostics.concat(validateProperties(oneStateValueNode, document))

          const nextPropNode = findPropChildByName(oneStateValueNode, 'Next')
          const endPropNode = findPropChildByName(oneStateValueNode, 'End')

          const stateType = oneStateValueNode.properties.find((oneStateProp) => oneStateProp.keyNode.value === 'Type')
            ?.valueNode?.value

          const nextNodeValue = nextPropNode?.valueNode?.value
          const stateName = prop.keyNode.value

          if (endPropNode && endPropNode.valueNode?.value === true) {
            hasTerminalState = true
          }

          // mark the value of Next property as reached state
          if (typeof nextNodeValue === 'string') {
            reachedStates[nextNodeValue] = true
          }

          // Validate Parameters for given state types
          if (['Pass', 'Task', 'Parallel', 'Map'].includes(stateType as string)) {
            const parametersPropNode = findPropChildByName(oneStateValueNode, 'Parameters')

            if (parametersPropNode) {
              const validateParametersDiagnostics = validateParameters(parametersPropNode, document)
              diagnostics = diagnostics.concat(validateParametersDiagnostics)
            }
          }

          // Validate Catch for given state types
          if (['Task', 'Parallel', 'Map'].includes(stateType as string)) {
            const validateCatchResult = validateArrayNext('Catch', oneStateValueNode, stateNames, document)
            const resultSelectorPropNode = findPropChildByName(oneStateValueNode, 'ResultSelector')

            diagnostics = diagnostics.concat(validateCatchResult.diagnostics)
            reachedStates = { ...reachedStates, ...validateCatchResult.reachedStates }

            if (resultSelectorPropNode) {
              const resultSelectorDiagnostics = validateParameters(resultSelectorPropNode, document)
              diagnostics = diagnostics.concat(resultSelectorDiagnostics)
            }
          }

          switch (stateType) {
            // if the type of the state is "Map" recursively run validateStates for its value node
            case 'Map': {
              const iteratorPropNode =
                findPropChildByName(oneStateValueNode, 'Iterator') ||
                findPropChildByName(oneStateValueNode, 'ItemProcessor')

              if (iteratorPropNode && iteratorPropNode.valueNode && isObjectNode(iteratorPropNode.valueNode)) {
                // append the result of recursive validation to the list of diagnostics
                diagnostics = [
                  ...diagnostics,
                  ...validateStates(iteratorPropNode.valueNode, document, RootType.Map, options),
                ]
              }

              break
            }

            // it the type of state is "Parallel" recursively run validateStates for each child of value node (an array)
            case 'Parallel': {
              const branchesPropNode = findPropChildByName(oneStateValueNode, 'Branches')

              if (branchesPropNode && branchesPropNode.valueNode && isArrayNode(branchesPropNode.valueNode)) {
                branchesPropNode.valueNode.children.forEach((branchItem) => {
                  if (isObjectNode(branchItem)) {
                    // append the result of recursive validation to the list of diagnostics
                    diagnostics = [...diagnostics, ...validateStates(branchItem, document, RootType.Parallel, options)]
                  }
                })
              }

              break
            }

            case 'Choice': {
              const defaultNode = findPropChildByName(oneStateValueNode, 'Default')

              if (defaultNode) {
                const name = defaultNode?.valueNode?.value
                const defaultStateDiagnostic = stateNameExistsInPropNode(
                  defaultNode,
                  stateNames,
                  document,
                  MESSAGES.INVALID_DEFAULT,
                )

                if (defaultStateDiagnostic) {
                  diagnostics.push(defaultStateDiagnostic)
                } else if (typeof name === 'string') {
                  reachedStates[name] = true
                }
              }

              const validateChoiceResult = validateArrayNext('Choices', oneStateValueNode, stateNames, document)
              diagnostics = diagnostics.concat(validateChoiceResult.diagnostics)
              reachedStates = { ...reachedStates, ...validateChoiceResult.reachedStates }

              break
            }

            case 'Succeed':
            case 'Fail': {
              hasTerminalState = true

              const validateErrorFieldDiagnostics = validateExclusivePathTypeField(oneStateValueNode, 'Error', document)
              diagnostics = diagnostics.concat(validateErrorFieldDiagnostics)

              const validateCauseFieldDiagnostics = validateExclusivePathTypeField(oneStateValueNode, 'Cause', document)
              diagnostics = diagnostics.concat(validateCauseFieldDiagnostics)

              break
            }
          }

          if (nextPropNode) {
            const nextStateDiagnostic = stateNameExistsInPropNode(
              nextPropNode,
              stateNames,
              document,
              MESSAGES.INVALID_NEXT,
            )

            if (nextStateDiagnostic) {
              diagnostics.push(nextStateDiagnostic)
            }
          }
        }
      })

      // if it doesn't have a terminal state emit diagnostic
      // selecting the range of "States" property key node
      if (!hasTerminalState) {
        const { length, offset } = statesNode.keyNode
        const range = Range.create(document.positionAt(offset), document.positionAt(offset + length))

        diagnostics.push(Diagnostic.create(range, MESSAGES.NO_TERMINAL_STATE, DiagnosticSeverity.Error))
      }

      // Create diagnostics for states that weren't referenced by a State, Choice Rule, or Catcher's "Next" field
      statesValueNode.properties
        .filter((statePropNode) => {
          const stateName = statePropNode.keyNode.value

          return !reachedStates[stateName]
        })
        .forEach((unreachableStatePropNode) => {
          const { length, offset } = unreachableStatePropNode.keyNode
          const range = Range.create(document.positionAt(offset), document.positionAt(offset + length))

          diagnostics.push(Diagnostic.create(range, MESSAGES.UNREACHABLE_STATE, DiagnosticSeverity.Error))
        })
    }
  }

  return diagnostics
}
