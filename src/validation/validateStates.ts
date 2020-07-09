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
    findPropChildByName,
    getListOfStateNamesFromStateNode,
    isArrayNode,
    isObjectNode,
} from '../utils/astUtilityFunctions'

import { MESSAGES } from '../constants/diagnosticStrings'
import getPropertyNodeDiagnostic from './utils/getPropertyNodeDiagnostic'
import validateProperties from './validateProperties'
import schema from './validationSchema'

function stateNameExistsInPropNode(
    nextPropNode: PropertyASTNode,
    stateNames: string[],
    document: TextDocument,
    message: string
): Diagnostic | void {
    const stateNameExists = (stateNames as unknown[]).includes(nextPropNode?.valueNode?.value)

    if (nextPropNode && nextPropNode.valueNode && !stateNameExists) {
        const { length, offset } = nextPropNode.valueNode
        const range = Range.create(document.positionAt(offset), document.positionAt(offset + length))

        return Diagnostic.create(range, message, DiagnosticSeverity.Error)
    }
}

interface ValidateCatchResult {
    diagnostics: Diagnostic[],
    reachedStates: { [ix: string]: boolean }
}

function validateParameters(parametersPropNode: PropertyASTNode, document: TextDocument): Diagnostic[] {
    let diagnostics: Diagnostic[] = []
    const valueNode = parametersPropNode.valueNode

    if (valueNode && isObjectNode(valueNode)) {
        valueNode.properties.forEach(prop => {
            if (prop.valueNode && prop.keyNode.value.endsWith('.$')) {
                const propValue = prop.valueNode.value

                if (typeof propValue !== 'string' || !propValue.startsWith('$')) {
                    const { length, offset } = prop.valueNode
                    const range = Range.create(document.positionAt(offset), document.positionAt(offset + length))

                    diagnostics.push(Diagnostic.create(range, MESSAGES.INVALID_JSON_PATH, DiagnosticSeverity.Error))
                }
            } else if (prop.valueNode && isObjectNode(prop.valueNode)) {
                diagnostics = diagnostics.concat(validateParameters(prop, document))
            }
        });
    }

    return diagnostics
}

// Validates next property within array of objects
function validateArrayNext(arrayPropName: string, oneStateValueNode: ObjectASTNode, stateNames: string[], document: TextDocument): ValidateCatchResult {
    const arrayPropNode = findPropChildByName(oneStateValueNode, arrayPropName)
    const diagnostics: Diagnostic[] = []
    const reachedStates: { [ix: string]: boolean } = {}

    if (arrayPropNode?.valueNode && isArrayNode(arrayPropNode.valueNode)) {
        arrayPropNode.valueNode.items.forEach(item => {
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

export default function validateStates(rootNode: ObjectASTNode, document: TextDocument, isRoot?: Boolean): Diagnostic[] {
    const statesNode = findPropChildByName(rootNode, 'States')
    const startAtNode = findPropChildByName(rootNode, 'StartAt')

    // Different schemas for root and root of nested state machine
    const rootSchema = isRoot ? schema.Root : schema.NestedRoot

    let diagnostics: Diagnostic[] = []

    // Check root property names against the schema
    rootNode.properties.forEach(prop => {
        const key = prop.keyNode.value

        if (!rootSchema[key]) {
            diagnostics.push(
                getPropertyNodeDiagnostic(prop, document, MESSAGES.INVALID_PROPERTY_NAME)
            )
        }
    })

    if (statesNode) {
        const stateNames = getListOfStateNamesFromStateNode(statesNode)
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
            const unreachedStates: { [ix: string]: PropertyASTNode } = {}
            let reachedStates: { [ix: string]: boolean } = {}
            let hasTerminalState = false

            const startAtValue = startAtNode?.valueNode?.value

            // mark state referred to in StartAt as reached
            if (typeof startAtValue === 'string') {
                reachedStates[startAtValue] = true
            }

            statesValueNode.properties.forEach(prop => {
                const oneStateValueNode = prop.valueNode

                if (oneStateValueNode && isObjectNode(oneStateValueNode)) {
                    diagnostics = diagnostics.concat(validateProperties(oneStateValueNode, document))

                    const nextPropNode = findPropChildByName(oneStateValueNode, 'Next')
                    const endPropNode = findPropChildByName(oneStateValueNode, 'End')

                    const stateType = oneStateValueNode.properties
                        .find(oneStateProp => oneStateProp.keyNode.value === 'Type')?.valueNode?.value

                    const nextNodeValue = nextPropNode?.valueNode?.value
                    const stateName = prop.keyNode.value

                    if (endPropNode && endPropNode.valueNode?.value === true) {
                        hasTerminalState = true
                    }

                    // if the state hasn't been reached in any of the previous iterations
                    // mark it as unreached
                    if (!reachedStates[stateName]) {
                        unreachedStates[stateName] = prop
                    }

                    // mark the value of Next property as reached state
                    // and delete it from the list of unreached states
                    if (typeof nextNodeValue === 'string') {
                       reachedStates[nextNodeValue] = true
                        // tslint:disable-next-line no-dynamic-delete
                       delete unreachedStates[nextNodeValue]
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

                        diagnostics = diagnostics.concat(validateCatchResult.diagnostics)
                        reachedStates = { ...reachedStates, ...validateCatchResult.reachedStates }
                    }

                    switch(stateType) {
                        // if the type of the state is "Map" recursively run validateStates for its value node
                        case 'Map': {
                            const iteratorPropNode = findPropChildByName(oneStateValueNode, 'Iterator')

                            if (iteratorPropNode && iteratorPropNode.valueNode && isObjectNode(iteratorPropNode.valueNode)) {
                                // append the result of recursive validation to the list of diagnostics
                                diagnostics = [...diagnostics, ...validateStates(iteratorPropNode.valueNode, document)]
                            }

                            break
                        }

                        // it the type of state is "Parallel" recursively run validateStates for each child of value node (an array)
                        case 'Parallel': {
                            const branchesPropNode = findPropChildByName(oneStateValueNode, 'Branches')

                            if (branchesPropNode && branchesPropNode.valueNode && isArrayNode(branchesPropNode.valueNode)) {
                                branchesPropNode.valueNode.children.forEach(branchItem => {
                                    if (isObjectNode(branchItem)) {
                                        // append the result of recursive validation to the list of diagnostics
                                        diagnostics = [...diagnostics, ...validateStates(branchItem, document)]
                                    }
                                })
                            }

                            break
                        }

                        case 'Choice': {
                            const defaultNode = findPropChildByName(oneStateValueNode, 'Default')

                            if (defaultNode) {
                                const name = defaultNode?.valueNode?.value
                                const defaultStateDiagnostic = stateNameExistsInPropNode(defaultNode, stateNames, document, MESSAGES.INVALID_DEFAULT)

                                if (defaultStateDiagnostic) {
                                    diagnostics.push(defaultStateDiagnostic)
                                } else if (typeof name === 'string') {
                                    reachedStates[name] = true

                                    // tslint:disable-next-line no-dynamic-delete
                                    delete unreachedStates[name]
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
                            break
                        }
                    }

                    if (nextPropNode) {
                        const nextStateDiagnostic = stateNameExistsInPropNode(nextPropNode, stateNames, document, MESSAGES.INVALID_NEXT)

                        if (nextStateDiagnostic) {
                            diagnostics.push(nextStateDiagnostic)
                        }
                    }
                }
            })

            // if it doesn't have a terminal state emit diagnostic
            // selecting the range of "States" property key node
            if (!hasTerminalState) {
                const { length, offset } =  statesNode.keyNode
                const range = Range.create(document.positionAt(offset), document.positionAt(offset + length))

                diagnostics.push(Diagnostic.create(range, MESSAGES.NO_TERMINAL_STATE, DiagnosticSeverity.Error))
            }

            // loop through the hash map of unreached states and create diagnostics
            Object.values(unreachedStates).forEach(statePropNode => {
                const { length, offset } =  statePropNode.keyNode
                const range = Range.create(document.positionAt(offset), document.positionAt(offset + length))

                diagnostics.push(Diagnostic.create(range, MESSAGES.UNREACHABLE_STATE, DiagnosticSeverity.Error))
            })
        }
    }

    return diagnostics
}
