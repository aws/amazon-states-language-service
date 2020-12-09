/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import { safeDump, safeLoad } from 'js-yaml'
import * as prettier from 'prettier'
import {
    CompletionItemKind,
    getLanguageService as getLanguageServiceVscode,
    JSONSchema,
    LanguageService,
    LanguageServiceParams,
} from 'vscode-json-languageservice'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
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
    SingleYAMLDocument,
    YAMLDocument,
} from 'yaml-language-server/out/server/src/languageservice/parser/yamlParser07'
import { YAMLCompletion } from 'yaml-language-server/out/server/src/languageservice/services/yamlCompletion'
import { YAMLSchemaService } from 'yaml-language-server/out/server/src/languageservice/services/yamlSchemaService'
import { matchOffsetToDocument } from 'yaml-language-server/out/server/src/languageservice/utils/arrUtils'
import doCompleteAsl from '../completion/completeAsl'
import { processYamlDocForCompletion } from './yamlUtils'

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
    schemaService.registerExternalSchema('asl-yaml', ['*.asl.yaml', '*.asl.yml'], schema)
    schemaService.getOrAddSchemaHandle('asl-yaml', schema)

    const completer = new YAMLCompletion(schemaService)

    languageService.doValidation = async function(
        textDocument: TextDocument
    ) {
        const yamlDocument: YAMLDocument = parseYAML(textDocument.getText())
        const validationResult: any[] = []

        for (const currentYAMLDoc of yamlDocument.documents) {
            const validation = await aslLanguageService.doValidation(textDocument, currentYAMLDoc)
            const syd = (currentYAMLDoc as unknown) as SingleYAMLDocument
            if (syd.errors.length > 0) {
                validationResult.push(...syd.errors)
            }
            if (syd.warnings.length > 0) {
                validationResult.push(...syd.warnings)
            }

            validationResult.push(...validation)
        }

        return validationResult
    }

// Returns true if the given offest is in a position of immediate child of the "States" property. False otherwise.
function isChildOfStates(document: TextDocument, offset: number) {
    let isDirectChildOfStates = false
    const prevText = document.getText().substring(0, offset).split('\n')
    const cursorLine = prevText[prevText.length - 1]
    let hasCursorLineNonSpace = false
    let numberOfSpacesCursorLine = 0

    Array.from(cursorLine).forEach(char => {
        if (char === ' ') {
            numberOfSpacesCursorLine ++
        } else if (char !== "'" && char !== '"') {
            hasCursorLineNonSpace = true;
        }
    })

    if (!hasCursorLineNonSpace && numberOfSpacesCursorLine > 0) {
        for (let lineNum = prevText.length - 2; lineNum > 0; lineNum--) {
            let leftLineSpaces = 0
            const line = prevText[lineNum]

            for (const char of line) {
                if (char === ' ') {
                    leftLineSpaces++
                } else {
                    break
                }
            }

            // Check if the number of spaces of the line is lower than that of cursor line
            if (leftLineSpaces < numberOfSpacesCursorLine) {
                const trimmedLine = line.trim()
                // Ignore empty lines or lines that only contain whitespace
                if (trimmedLine.length === 0) {
                    continue
                // Check if the line starts with "States:"
                } else if (trimmedLine.startsWith('States:')) {
                    isDirectChildOfStates = true
                } else {
                    break
                }
            }
        }
    }

    return isDirectChildOfStates
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

        const offsetIntoProcessedDocument = processedDocument.offsetAt(tempPositionForCompletions)
        const processedYamlDoc: YAMLDocument = parseYAML(modifiedDocText)
        const currentDoc = matchOffsetToDocument(offsetIntoProcessedDocument, processedYamlDoc)

        if (!currentDoc) {
            return { items: [], isIncomplete: false }
        }

        const positionForDoComplete = {...tempPositionForCompletions} // Copy position to new object since doComplete modifies the position
        const yamlCompletions = await completer.doComplete(processedDocument, positionForDoComplete, false)

        const aslOptions = {
            ignoreColonOffset: true,
            shouldShowStateSnippets: isChildOfStates(processedDocument, offsetIntoProcessedDocument)
        }
        const aslCompletions : CompletionList  = doCompleteAsl(processedDocument, tempPositionForCompletions, currentDoc, yamlCompletions, aslOptions)

        aslCompletions.items.forEach(completion => {
            const currentTextEdit = completion.textEdit

            if (currentTextEdit) {
                if (shouldPrependSpace && currentTextEdit.newText?.charAt(0) !== ' ') {
                    currentTextEdit.newText = ' ' + currentTextEdit.newText
                }

                currentTextEdit.range.start = startPositionForInsertion
                currentTextEdit.range.end = endPositionForInsertion

                // Completions that include both a key and a value should replace everything right of the cursor.
                if (completion.kind === CompletionItemKind.Property) {
                    currentTextEdit.range.end = {
                        line: endPositionForInsertion.line,
                        character: document.getText().length
                    }
                } else if (completion.insertText && completion.kind === CompletionItemKind.Snippet && document.languageId === 'asl-yaml') {
                    // tslint:disable-next-line: no-unsafe-any
                    completion.insertText = safeDump(safeLoad(completion.insertText))
                    // Remove quotes
                    completion.insertText = completion.insertText?.replace(/[']/g, '')
                }
            }
        })

        return Promise.resolve(aslCompletions)
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
