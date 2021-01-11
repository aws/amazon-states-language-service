/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import { safeDump, safeLoad } from 'js-yaml'
import * as prettier from 'prettier'
import {
    CompletionItemKind,
    Diagnostic,
    getLanguageService as getLanguageServiceVscode,
    JSONSchema,
    LanguageService,
    LanguageServiceParams,
} from 'vscode-json-languageservice'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
    CompletionItem,
    CompletionList,
    DocumentSymbol,
    Hover,
    Position,
    Range,
    SymbolInformation,
    TextEdit
} from 'vscode-languageserver-types'
import {
    parse as parseYAML,
    YAMLDocument,
} from 'yaml-language-server/out/server/src/languageservice/parser/yamlParser07'
import { YAMLCompletion } from 'yaml-language-server/out/server/src/languageservice/services/yamlCompletion'
import { YAMLSchemaService } from 'yaml-language-server/out/server/src/languageservice/services/yamlSchemaService'
import { matchOffsetToDocument } from 'yaml-language-server/out/server/src/languageservice/utils/arrUtils'
import { YAMLDocDiagnostic } from 'yaml-language-server/out/server/src/languageservice/utils/parseUtils'
import doCompleteAsl from '../completion/completeAsl'
import { LANGUAGE_IDS } from '../constants/constants'
import { YAML_PARSER_MESSAGES } from '../constants/diagnosticStrings'
import { convertJsonSnippetToYaml, processYamlDocForCompletion, getOffsetData } from './yamlUtils'

const CATCH_INSERT = 'Catch:\n\t- '
const RETRY_INSERT = 'Retry:\n\t- '

function convertYAMLDiagnostic(yamlDiagnostic: YAMLDocDiagnostic, textDocument: TextDocument): Diagnostic {
    const startLoc = yamlDiagnostic.location.start
    let endLoc = yamlDiagnostic.location.end
    let severity = yamlDiagnostic.severity

    // Duplicate positioning returns incorrect end position and needs to be ovewritten
    if (yamlDiagnostic.message === YAML_PARSER_MESSAGES.DUPLICATE_KEY) {
        const text = textDocument.getText()
        // Update severity to error
        severity = 1

        for (let loc = yamlDiagnostic.location.start; loc < text.length; loc++) {
            // Colon and whitespace character signal the end of the key.
            if (text.slice(loc, loc + 2).match(/:\s/)) {
                endLoc = loc
            } else if (text[loc] === '\n') {
                break
            }
        }
    }

    const startPos = textDocument.positionAt(startLoc)
    const endPos = textDocument.positionAt(endLoc)

    return {
        range: Range.create(startPos, endPos),
        message: yamlDiagnostic.message,
        severity
    }
}

export const getLanguageService = function(params: LanguageServiceParams, schema: JSONSchema, aslLanguageService: LanguageService): LanguageService {
    const builtInParams = {}

    const languageService = getLanguageServiceVscode({
        ...params,
        ...builtInParams,
    })

    const requestServiceMock = async function(uri: string): Promise<string> {
        return new Promise<string>(c => {
            c(JSON.stringify(schema))
        })
    }
    const schemaService = new YAMLSchemaService(requestServiceMock, params.workspaceContext)
    // initialize schema
    schemaService.registerExternalSchema(LANGUAGE_IDS.YAML, ['*'], schema)
    schemaService.getOrAddSchemaHandle(LANGUAGE_IDS.YAML, schema)

    const completer = new YAMLCompletion(schemaService)

    languageService.doValidation = async function(
        textDocument: TextDocument
    ) {
        const yamlDocument: YAMLDocument = parseYAML(textDocument.getText())
        const validationResult: Diagnostic[] = []

        for (const currentYAMLDoc of yamlDocument.documents) {
            const validation = await aslLanguageService.doValidation(textDocument, currentYAMLDoc)
            validationResult.push(
                ...currentYAMLDoc.errors
                    .concat(currentYAMLDoc.warnings)
                    .map(err => convertYAMLDiagnostic(err, textDocument))
            )
            validationResult.push(...validation)
        }

        return validationResult
    }


    languageService.doComplete = async function(
        document: TextDocument,
        position: Position
    ): Promise<CompletionList> {
        const {
            modifiedDocText,
            tempPositionForCompletions,
            startPositionForInsertion,
            endPositionForInsertion,
            shouldPrependSpace
        } = processYamlDocForCompletion(document, position)

        const processedDocument = TextDocument.create(document.uri, document.languageId, document.version, modifiedDocText)

        const offsetIntoOriginalDocument = document.offsetAt(position)
        const offsetIntoProcessedDocument = processedDocument.offsetAt(tempPositionForCompletions)

        const processedYamlDoc: YAMLDocument = parseYAML(modifiedDocText)
        const currentDoc = matchOffsetToDocument(offsetIntoProcessedDocument, processedYamlDoc)

        if (!currentDoc) {
            return { items: [], isIncomplete: false }
        }

        const positionForDoComplete = {...tempPositionForCompletions} // Copy position to new object since doComplete modifies the position
        const yamlCompletions = await completer.doComplete(processedDocument, positionForDoComplete, false)
        // yaml-language-server does not output corrrect completions for retry/catch
        // we need to overwrite the text
        yamlCompletions.items.forEach(item => {
            if (item.label === 'Catch') {
                item.insertText = CATCH_INSERT

                if (item.textEdit) {
                    item.textEdit.newText = CATCH_INSERT
                }
            } else if (item.label === 'Retry') {
                item.insertText = RETRY_INSERT

                if (item.textEdit) {
                    item.textEdit.newText = RETRY_INSERT
                }
            }
        })

        const { isDirectChildOfStates, isWithinCatchRetryState, hasCatchPropSibling, hasRetryPropSibling } = getOffsetData(document, offsetIntoOriginalDocument)

        const aslOptions = {
            ignoreColonOffset: true,
            shouldShowStateSnippets: isDirectChildOfStates,
            shouldShowRetrySnippet: isWithinCatchRetryState && !hasRetryPropSibling,
            shouldShowCatchSnippet: isWithinCatchRetryState && !hasCatchPropSibling
        }

        const aslCompletions: CompletionList  = doCompleteAsl(processedDocument, tempPositionForCompletions, currentDoc, yamlCompletions, aslOptions)

        const modifiedAslCompletionItems: CompletionItem[] = aslCompletions.items.map(completionItem => {
            const completionItemCopy = {...completionItem} // Copy completion to new object to avoid overwriting any snippets

            if (completionItemCopy.insertText && completionItemCopy.kind === CompletionItemKind.Snippet && document.languageId === LANGUAGE_IDS.YAML) {
                completionItemCopy.insertText = convertJsonSnippetToYaml(completionItemCopy.insertText)
            } else {
                const currentTextEdit = completionItemCopy.textEdit

                if (currentTextEdit) {
                    if (shouldPrependSpace) {
                        if (currentTextEdit.newText && currentTextEdit.newText.charAt(0) !== ' ') {
                            currentTextEdit.newText = ' ' + currentTextEdit.newText
                        }
                        if (completionItemCopy.insertText && completionItemCopy.insertText.charAt(0) !== ' ') {
                            completionItemCopy.insertText = ' ' + completionItemCopy.insertText
                        }
                    }

                    currentTextEdit.range.start = startPositionForInsertion
                    currentTextEdit.range.end = endPositionForInsertion

                    // Completions that include both a key and a value should replace everything right of the cursor.
                    if (completionItemCopy.kind === CompletionItemKind.Property) {
                        currentTextEdit.range.end = {
                            line: endPositionForInsertion.line,
                            character: document.getText().length
                        }
                    }
                }
            }

            return completionItemCopy
        })

        const modifiedAslCompletions: CompletionList = {
            isIncomplete: aslCompletions.isIncomplete,
            items: modifiedAslCompletionItems
        }

        return Promise.resolve(modifiedAslCompletions)
    }

    languageService.doHover = function(
        document: TextDocument,
        position: Position
    ): Thenable<Hover | null> {
        const doc = parseYAML(document.getText())
        const offset = document.offsetAt(position)
        const currentDoc = matchOffsetToDocument(offset, doc)
        if (!currentDoc) {
            // tslint:disable-next-line: no-null-keyword
            return Promise.resolve(null)
        }

        const currentDocIndex = doc.documents.indexOf(currentDoc)
        currentDoc.currentDocIndex = currentDocIndex

        return aslLanguageService.doHover(document, position, currentDoc)
    }

    languageService.format = function(
        document: TextDocument
    ): TextEdit[] {
        try {
            const text = document.getText()

            const formatted = prettier.format(text, { parser: 'yaml' })

            return [TextEdit.replace(Range.create(Position.create(0, 0), document.positionAt(text.length)), formatted)]
        } catch (error) {
            return []
        }
    }

    languageService.findDocumentSymbols = function(document: TextDocument): SymbolInformation[] {
        const doc = parseYAML(document.getText())
        if (!doc || doc.documents.length === 0) {
            return []
        }

        let results: any[] = []
        for (const yamlDoc of doc.documents) {
            if (yamlDoc.root) {
                results = results.concat(aslLanguageService.findDocumentSymbols(document, yamlDoc))
            }
        }

        return results
    }

    languageService.findDocumentSymbols2 = function(document: TextDocument): DocumentSymbol[] {
        const doc = parseYAML(document.getText())
        if (!doc || doc.documents.length === 0) {
            return []
        }

        let results: any[] = []
        for (const yamlDoc of doc.documents) {
            if (yamlDoc.root) {
                results = results.concat(aslLanguageService.findDocumentSymbols2(document, yamlDoc))
            }
        }

        return results
    }

    return languageService
}
