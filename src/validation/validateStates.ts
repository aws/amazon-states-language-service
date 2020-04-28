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
} from 'vscode-json-languageservice';

import {
    findPropChildByName,
    getListOfStateNamesFromStateNode,
    isArrayNode,
    isObjectNode,
} from '../utils/astUtilityFunctions'

export const MESSAGES = {
    INVALID_NEXT: 'The value of "Next" property must be the name of an existing state.',
    INVALID_DEFAULT: 'The value of "Default" property must be the name of an existing state.',
    INVALID_START_AT: 'The value of "StartAt" property must be the name of an existing state.',
    UNREACHABLE_STATE: 'The state cannot be reached. It must be referenced by at least one other state.',
    NO_TERMINAL_STATE: 'No terminal state. The state machine must have at least one terminal state (a state in which the "End" property is set to true).'
}

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

// Validates next property within array of objects
function validateArrayNext(arrayPropName: string, oneStateValueNode: ObjectASTNode, stateNames: string[], document: TextDocument): ValidateCatchResult {
    const arrayPropNode = findPropChildByName(oneStateValueNode, arrayPropName)
    const diagnostics: Diagnostic[] = []
    const reachedStates: { [ix: string]: boolean } = {}

    if (arrayPropNode?.valueNode && isArrayNode(arrayPropNode.valueNode)) {
        arrayPropNode.valueNode.items.forEach(item => {
            if (isObjectNode(item)) {
                const nextProp = findPropChildByName(item, 'Next')
                const nextPropValue = nextProp?.valueNode?.value

                const diagnostic = stateNameExistsInPropNode(nextProp, stateNames, document, MESSAGES.INVALID_NEXT)
                if (diagnostic) {
                    diagnostics.push(diagnostic)
                } else if (typeof nextPropValue === 'string') {
                    reachedStates[nextPropValue] = true
                }
            }
        })
    }

    return { diagnostics, reachedStates }
}

export default function validateStates(rootNode: ObjectASTNode, document: TextDocument): Diagnostic[] {
    const statesNode = findPropChildByName(rootNode, 'States')
    const startAtNode = findPropChildByName(rootNode, 'StartAt')

    let diagnostics: Diagnostic[] = []

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

            // mark state refered to in StartAt as reached
            if (typeof startAtValue === 'string') {
                reachedStates[startAtValue] = true
            }

            statesValueNode.properties.forEach(prop => {
                const oneStateValueNode = prop.valueNode

                if (oneStateValueNode && isObjectNode(oneStateValueNode)) {
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
                            const validateCatchResult = validateArrayNext('Catch', oneStateValueNode, stateNames, document)
                            diagnostics = diagnostics.concat(validateCatchResult.diagnostics)
                            reachedStates = { ...reachedStates, ...validateCatchResult.reachedStates }

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

                        case 'Task': {
                            const validateCatchResult = validateArrayNext('Catch', oneStateValueNode, stateNames, document)
                            diagnostics = diagnostics.concat(validateCatchResult.diagnostics)
                            reachedStates = { ...reachedStates, ...validateCatchResult.reachedStates }

                            break
                        }

                        case 'Choice': {
                            const defaultNode = findPropChildByName(oneStateValueNode, 'Default')
                            const name = defaultNode?.valueNode?.value
                            const defaultStateDiagnostic = stateNameExistsInPropNode(defaultNode, stateNames, document, MESSAGES.INVALID_DEFAULT)

                            if (defaultStateDiagnostic) {
                                diagnostics.push(defaultStateDiagnostic)
                            } else if (typeof name === 'string') {
                                reachedStates[name] = true
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

                    const nextStateDiagnostic = stateNameExistsInPropNode(nextPropNode, stateNames, document, MESSAGES.INVALID_NEXT)

                    if (nextStateDiagnostic) {
                        diagnostics.push(nextStateDiagnostic)
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

            // loop thorugh the hash map of unreached states and create diagnostics
            Object.values(unreachedStates).forEach(statePropNode => {
                const { length, offset } =  statePropNode.keyNode
                const range = Range.create(document.positionAt(offset), document.positionAt(offset + length))

                diagnostics.push(Diagnostic.create(range, MESSAGES.UNREACHABLE_STATE, DiagnosticSeverity.Error))
            })
        }
    }

    return diagnostics
}
