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
    findPropChildByName,
    isArrayNode,
    isObjectNode,
} from '../utils/astUtilityFunctions'

import { MESSAGES } from '../constants/diagnosticStrings'

import schema from './validationSchema'

function isObject(obj: any): obj is Object {
    return obj === Object(obj);
  }

function propertyAnalizer(
    rootNode: ASTNode,
    document: TextDocument,
    schemaPart: Object,
    schemaSets: Object
): Diagnostic[] {
    let diagnostics: Diagnostic[] = []

    const arraySchema = schemaPart['Fn:ArrayOf']
    const oneOfSchema = schemaPart['Fn:OneOf']
    const valueOfSchema = schemaPart['Fn:ValueOf']

    // Fn:ArrayOf
    // if it contains Fn:ArrayOf property all the other values will be ignored
    if (typeof arraySchema === 'string' && isArrayNode(rootNode)) {
        const newSchemaPart: unknown = schemaSets[arraySchema]

        if (isObject(newSchemaPart)) {
            rootNode.items.forEach(itemNode => {
                if (isObjectNode(itemNode)) {
                    diagnostics = diagnostics.concat(propertyAnalizer(itemNode, document, newSchemaPart, schemaSets))
                }
            })
        }

        return diagnostics

    // Fn:OneOf
    // TODO: Allow for both OneOf and ValueOf at the same time
    } else if (typeof oneOfSchema === 'string' && isObjectNode(rootNode)) {
        const oneOfSet: unknown = schemaSets[oneOfSchema]
        const itemsOfOneOfSet: { propNode: PropertyASTNode, schemaValue: unknown }[] = []

        rootNode.properties.forEach(prop => {
            const propName = prop.keyNode.value
            const inOneOfSet = oneOfSet[propName]

            // If the property is in set referenced by Fn:OneOfSet
            if (inOneOfSet) {
                itemsOfOneOfSet.push({ propNode: prop, schemaValue: inOneOfSet})
            // If the property is neither in the set nor in the schema props
            } else if (!schemaPart[propName]) {
                diagnostics.push(
                    getPropertyNodeDiagnostic(prop, document, MESSAGES.INVALID_PROPERTY_NAME)
                )
            }
        })

        // if there is more than one item mark them all as invalid
        if (itemsOfOneOfSet.length > 1) {
            const messageSuffix = itemsOfOneOfSet
                .map(item => item.propNode.keyNode.value)
                .join(', ')

            itemsOfOneOfSet.forEach(oneOfProp => {
                diagnostics.push(
                    getPropertyNodeDiagnostic(oneOfProp.propNode, document, MESSAGES.MUTUALLY_EXCLUSIVE_PROPERTIES + messageSuffix)
                )
            })
        // if there is only one item and it is an object
        // recursively continue on with validation
        } else if (itemsOfOneOfSet.length) {
            const { schemaValue, propNode } = itemsOfOneOfSet[0]
            const { valueNode } = propNode
            if (isObject(schemaValue)) {
                diagnostics = diagnostics.concat(
                    propertyAnalizer(valueNode, document, schemaValue, schemaSets)
                )
            }
        }
    // Fn:ValueOf
    } else if (typeof valueOfSchema === 'string' && isObjectNode(rootNode)) {
        const newSchemaPart: unknown = schemaSets[valueOfSchema]
        diagnostics = diagnostics.concat(propertyAnalizer(rootNode, document, newSchemaPart, schemaSets))
    // Regural properties
    } else if (isObjectNode(rootNode)) {
        rootNode.properties.forEach(prop => {
            const propName = prop.keyNode.value

            if (!schemaPart[propName]) {
                diagnostics.push(
                    getPropertyNodeDiagnostic(prop, document, MESSAGES.INVALID_PROPERTY_NAME)
                )
            }
        })
    }

    return diagnostics
}

function getPropertyNodeDiagnostic(propNode: PropertyASTNode, document: TextDocument, message: string): Diagnostic {
        const { length, offset } = propNode.keyNode
        const range = Range.create(document.positionAt(offset), document.positionAt(offset + length))

        return Diagnostic.create(range, message, DiagnosticSeverity.Error)
}

export default function(oneStateValueNode: ObjectASTNode, document: TextDocument): Diagnostic[] {
    // Get the type of state
    const typeNode = findPropChildByName(oneStateValueNode, 'Type')
    const typeName = typeNode?.valueNode.value

    let diagnostics: Diagnostic[] = []

    oneStateValueNode.properties.forEach(prop => {
        const propName = prop.keyNode.value
        let hasCommonFields = true

        // By default hasCommonFields should be true
        // Only validate common fields when hasCommonFields is not false
        if (typeof typeName === 'string') {
            // tslint:disable-next-line no-unsafe-any
            hasCommonFields = schema.Specific[typeName]?.hasCommonFields !== false
        }

        const isPropertyWithinCommon = hasCommonFields && !!schema.Common[propName]

        if (isPropertyWithinCommon) {
            return
        }

        if (!isPropertyWithinCommon && typeof typeName === 'string') {
            // tslint:disable-next-line no-unsafe-any
            const propertySchemaWithinSpecific: unknown = schema.Specific[typeName]?.Properties?.[propName]

            if (propertySchemaWithinSpecific) {
                if (isObject(propertySchemaWithinSpecific)) {
                    diagnostics = diagnostics.concat(
                        propertyAnalizer(prop.valueNode, document, propertySchemaWithinSpecific, schema.Sets)
                    )
                }

                return
            }
        }

        const diagnostic = getPropertyNodeDiagnostic(prop, document, MESSAGES.INVALID_PROPERTY_NAME)

        diagnostics.push(diagnostic)
    })

    return diagnostics
}
