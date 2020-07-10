/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import {
    Diagnostic,
    DiagnosticSeverity,
    getLanguageService as getLanguageServiceVscode,
} from 'vscode-json-languageservice';

import aslSchema from './json-schema/bundled.json';

import {
    ASTTree,
    isObjectNode
} from './utils/astUtilityFunctions'

import completeAsl from './completion/completeAsl'
import validateStates from './validation/validateStates'

type GetLanguageServiceFunc = typeof getLanguageServiceVscode;

export * from 'vscode-json-languageservice'

export const getLanguageService: GetLanguageServiceFunc = function(params) {
    const builtInParams = {}

    const languageService = getLanguageServiceVscode({ ...params, ...builtInParams })
    const doValidation = languageService.doValidation.bind(languageService) as typeof languageService.doValidation
    const doComplete = languageService.doComplete.bind(languageService) as typeof languageService.doComplete

    languageService.configure({
        validate: true,
        allowComments: false,
        schemas: [
            {
                uri: 'asl',
                fileMatch: ['*'],
                schema: aslSchema
            }
        ]
    })

    languageService.doValidation = async function(document, jsonDocument, documentSettings) {
        // vscode-json-languageservice will always set severity as warning for JSONSchema validation
        // there is no option to configure this behavior so severity needs to be overwritten as error
        const diagnostics = (await doValidation(document, jsonDocument, documentSettings)).map(diagnostic => {
            // Non JSON Schema validation will have source: 'asl'
            if (diagnostic.source !== 'asl') {
                return { ...diagnostic, severity: DiagnosticSeverity.Error }
            }

            return diagnostic
        }) as Diagnostic[]

        const rootNode = (jsonDocument as ASTTree).root

        if (rootNode && isObjectNode(rootNode)) {
            const aslDiagnostics = validateStates(rootNode, document, true)

            return diagnostics.concat(aslDiagnostics)
        }

        return diagnostics
    }

    languageService.doComplete = async function(document, position, doc) {
        const jsonCompletions = await doComplete(document, position, doc);

        return completeAsl(document, position, doc, jsonCompletions);
    }

    return languageService
}
