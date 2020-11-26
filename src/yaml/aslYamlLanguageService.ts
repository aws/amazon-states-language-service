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
        if (char !== ' ') {
            hasCursorLineNonSpace = true;
        } else {
            numberOfSpacesCursorLine ++
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
        const yamldoc = parseYAML(document.getText())
        const offset = document.offsetAt(position)
        let currentDoc = matchOffsetToDocument(offset, yamldoc)
        let atSpace = false

        // if a yaml doc is null, it must be given text to allow auto-completion
        if (!currentDoc) {
            currentDoc = initializeDocument(document, offset)
            // move cursor position into new empty object
            position.character += 1
        }

        const yamlCompletions = await completer.doComplete(document, position, false)

        if (!currentDoc) {
            return { items: [], isIncomplete: false }
        }
        // adjust position for completion
        const node = currentDoc.getNodeFromOffsetEndInclusive(offset)
        if (node.type === 'array') {
            // Resolves issue with array item insert text being off by a space
            position.character -= 1
        } else if (document.getText().substring(offset, offset + 1) === '"') {
            // When attempting to auto-complete from inside an empty string, the position must be adjusted within bounds
            position.character += 1
        } else if (document.getText().substring(offset - 2, offset) === ': ') {
            // yaml doesn't allow auto-completion from white-space after certain nodes
            atSpace = true
            // initialize an empty string and adjust position to within the string before parsing yaml to json
            const newText = `${document.getText().substring(0, offset)}""\n${document.getText().substr(offset)}`
            const parsedDoc = parseYAML(newText)
            currentDoc = matchOffsetToDocument(offset, parsedDoc)
            position.character += 1
        } else if (node.type === 'property' || (node.type === 'object' && position.character !== 0)) {
            position.character -= 1
        }
        if (currentDoc) {
            const aslCompletions : CompletionList  = doCompleteAsl(document, position, currentDoc, yamlCompletions, {
                ignoreColonOffset: true,
                shouldShowStateSnippets: isChildOfStates(document, offset)
            })

            aslCompletions.items.forEach(completion => {
                // format json completions for yaml
                if (completion.textEdit) {
                    // textEdit can't be done on white-space so insert text is used instead
                    if (atSpace) {
                        // remove any commas from json-completions
                        completion.insertText = completion.textEdit.newText.replace(/[\,]/g, '')
                        completion.textEdit = undefined
                    } else {
                        completion.textEdit.range.start.character = position.character
                    }
                } else if (completion.insertText && completion.kind === CompletionItemKind.Snippet && document.languageId === 'asl-yaml') {
                    completion.insertText = safeDump(safeLoad(completion.insertText))
                    // Remove quotes
                    completion.insertText = completion.insertText.replace(/[']/g, '')
                }
            })

            return Promise.resolve(aslCompletions)
        } else {
            return { items: [], isIncomplete: false }
        }
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

    // initialize brackets to surround the empty space when parsing
    const initializeDocument = function(text: TextDocument, offset: number) {
        // tslint:disable-next-line: prefer-template
        const newText = `${text.getText().substring(0, offset)}{}\r${text.getText().substr(offset)}`

        return matchOffsetToDocument(offset, parseYAML(newText))
    }

    return languageService
}
