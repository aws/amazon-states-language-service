/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import {
    Diagnostic,
    ObjectASTNode,
    TextDocument,
} from 'vscode-json-languageservice';

import {
    findPropChildByName,
    isArrayNode,
    isObjectNode,
} from '../utils/astUtilityFunctions'

import {
    DiagnosticsForNodeFunc,
    getDiagnosticsForArrayOfSchema,
    getDiagnosticsForOneOfSchema,
    getDiagnosticsForRegularProperties,
    SchemaObject,
} from './utils/validatePropertiesUtils'

import schema from './validationSchema'

const referenceTypes = schema.ReferenceTypes

const getDiagnosticsForNode: DiagnosticsForNodeFunc = function(rootNode, document, schemaPart) {
    const arrayOfType = schemaPart['Fn:ArrayOf']
    const oneOfType = schemaPart['Fn:OneOf']
    const valueOfType = schemaPart['Fn:ValueOf']

    // Fn:ArrayOf
    // if it contains Fn:ArrayOf property all the other values will be ignored
    if (typeof arrayOfType === 'string' && isArrayNode(rootNode)) {
        return getDiagnosticsForArrayOfSchema(rootNode, document, arrayOfType, getDiagnosticsForNode)

    // Fn:OneOf
    } else if (typeof oneOfType === 'string' && isObjectNode(rootNode)) {
        return getDiagnosticsForOneOfSchema(rootNode, document, schemaPart, oneOfType, getDiagnosticsForNode)
    // Fn:ValueOf
    } else if (typeof valueOfType === 'string' && isObjectNode(rootNode)) {
        const newSchemaPart = referenceTypes[valueOfType] as SchemaObject

        return getDiagnosticsForNode(rootNode, document, newSchemaPart)
    // Regular properties
    } else if (isObjectNode(rootNode)) {
        return getDiagnosticsForRegularProperties(rootNode, document, schemaPart, getDiagnosticsForNode)
    }

    return []
}

export default function(oneStateValueNode: ObjectASTNode, document: TextDocument): Diagnostic[] {
    // Get the type of state
    const stateType = findPropChildByName(oneStateValueNode, 'Type')?.valueNode?.value
    const diagnostics: Diagnostic[] = []

    // By default hasCommonProperties should be true
    // Only validate common Properties when hasCommonProperties is not false
    if (typeof stateType === 'string') {
        // tslint:disable-next-line no-unsafe-any
        const hasCommonProperties = !!schema.StateTypes[stateType]?.hasCommonProperties
        // tslint:disable-next-line no-unsafe-any
        const stateProperties = schema.StateTypes[stateType]?.Properties

        if (!stateProperties) {
            return
        }

        const allowedProperties = hasCommonProperties
            ? { ...schema.Common, ...stateProperties }
            : { ...stateProperties }

        // tslint:disable-next-line no-unsafe-any
        diagnostics.push(...getDiagnosticsForNode(oneStateValueNode, document, allowedProperties))
    }

    return diagnostics
}
