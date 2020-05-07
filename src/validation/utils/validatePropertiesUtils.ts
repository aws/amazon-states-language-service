/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import {
    ArrayASTNode,
    ASTNode,
    Diagnostic,
    DiagnosticSeverity,
    ObjectASTNode,
    PropertyASTNode,
    Range,
    TextDocument,
} from 'vscode-json-languageservice';

import {
    isObjectNode,
} from '../../utils/astUtilityFunctions'

import { MESSAGES } from '../../constants/diagnosticStrings'
import schema from '../validationSchema'

const referenceTypes = schema.ReferenceTypes

export interface SchemaObject { [property: string]: SchemaObject | boolean | string }

export interface DiagnosticsForNodeFunc {
    (
        rootNode: ASTNode,
        document: TextDocument,
        schemaPart: SchemaObject,
    ): Diagnostic[]
}

export function isObject(obj: any): obj is Object {
    return obj === Object(obj);
}

export function getPropertyNodeDiagnostic(propNode: PropertyASTNode, document: TextDocument, message: string): Diagnostic {
    const { length, offset } = propNode.keyNode
    const range = Range.create(document.positionAt(offset), document.positionAt(offset + length))

    return Diagnostic.create(range, message, DiagnosticSeverity.Error)
}

export function getDiagnosticsForArrayOfSchema(
    rootNode: ArrayASTNode,
    document: TextDocument,
    arraySchema: string,
    getDiagnosticsForNode: DiagnosticsForNodeFunc
) {
    const newSchemaPart = referenceTypes[arraySchema] as SchemaObject
    let diagnostics: Diagnostic[] = []

    if (isObject(newSchemaPart)) {
        rootNode.items.forEach(itemNode => {
            if (isObjectNode(itemNode)) {
                diagnostics = diagnostics.concat(
                    getDiagnosticsForNode(itemNode, document, newSchemaPart)
                )
            }
        })
    }

    return diagnostics
}

export function getDiagnosticsForOneOfSchema(
    rootNode: ObjectASTNode,
    document: TextDocument,
    schemaPart: SchemaObject,
    oneOfSchema: string,
    getDiagnosticsForNode: DiagnosticsForNodeFunc
) {
    const mutuallyExclusiveProperties: unknown = referenceTypes[oneOfSchema]
    const mutuallyExclusivePropertiesPresent: { propNode: PropertyASTNode, schemaValue: unknown }[] = []
    let diagnostics: Diagnostic[] = []

    rootNode.properties.forEach(prop => {
        const propName = prop.keyNode.value
        const propertySchema = mutuallyExclusiveProperties[propName]

        // If the property is one of mutually exclusive properties
        if (propertySchema) {
            mutuallyExclusivePropertiesPresent.push({ propNode: prop, schemaValue: propertySchema})
        // If the property is neither in the set nor in the schema props
        } else if (!schemaPart[propName]) {
            diagnostics.push(
                getPropertyNodeDiagnostic(prop, document, MESSAGES.INVALID_PROPERTY_NAME)
            )
        }
    })

    // if there is more than one item mark them all as invalid
    if (mutuallyExclusivePropertiesPresent.length > 1) {
        mutuallyExclusivePropertiesPresent.forEach(oneOfProp => {
            diagnostics.push(
                getPropertyNodeDiagnostic(oneOfProp.propNode, document, MESSAGES.MUTUALLY_EXCLUSIVE_CHOICE_PROPERTIES)
            )
        })
    // if there is only one item and it is an object
    // recursively continue on with validation
    } else if (mutuallyExclusivePropertiesPresent.length) {
        const { schemaValue, propNode } = mutuallyExclusivePropertiesPresent[0]
        const { valueNode } = propNode
        if (isObject(schemaValue)) {
            diagnostics = diagnostics.concat(
                getDiagnosticsForNode(valueNode, document, schemaValue as SchemaObject)
            )
        }
    }

    return diagnostics
}

export function getDiagnosticsForRegularProperties(
    rootNode: ObjectASTNode,
    document: TextDocument,
    schemaPart: SchemaObject,
    getDiagnosticsForNode: DiagnosticsForNodeFunc
) {
    const diagnostics: Diagnostic[] = []

    if (schemaPart.properties) {
        schemaPart = schemaPart.properties as SchemaObject
    }

    rootNode.properties.forEach(prop => {
        const propName = prop.keyNode.value
        const propertySchema: unknown = schemaPart[propName]

        if (!propertySchema) {
            diagnostics.push(
                getPropertyNodeDiagnostic(prop, document, MESSAGES.INVALID_PROPERTY_NAME)
            )
        } else if (isObject(propertySchema)) {
            // evaluate nested schema
            diagnostics.push(...getDiagnosticsForNode(prop.valueNode, document, propertySchema as SchemaObject))
        }
    })

    return diagnostics
}
