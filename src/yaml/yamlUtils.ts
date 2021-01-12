/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */
import { safeDump, safeLoad } from 'js-yaml'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { Position } from 'vscode-languageserver-types'
import { ProcessYamlDocForCompletionOutput } from '../utils/astUtilityFunctions'

const YAML_RESERVED_KEYWORDS = ['y', 'yes', 'n', 'no', 'true', 'false', 'on', 'off']

/**
 * @typedef {Object} ProcessYamlDocForCompletionOutput
 * @property {string} modifiedDocText - The text document derived from the document parameter which will be used to generate code completions
 * @property {Position} tempPositionForCompletions - The Position within modifiedDocText which will be used to generate code completions
 * @property {Position} startPositionForInsertion - The starting Position for the insert range applied to the generated code completions
 * @property {Position} endPositionForInsertion - The ending Position for the insert range applied to the generated code completions
 * @property {Position} shouldPrependSpace - A boolean indicating whether the generated code completions should have a space prepended to them
 */

/**
 *
 * @param {TextDocument} document
 * @param {Position} position
 * @returns {ProcessYamlDocForCompletionOutput}
 */
export function processYamlDocForCompletion(document: TextDocument, position: Position): ProcessYamlDocForCompletionOutput {
    const lineOffsets = getLineOffsets(document.getText())
    const { currentLine, currentLineEnd } = getCurrentLine(document, position, lineOffsets)

    if (currentLine.indexOf(':') === -1) {
        return processLineWithoutColon(document, position, currentLine, currentLineEnd)
    } else {
        return processLineWithColon(document, position, currentLine, currentLineEnd)
    }
}

function processLineWithoutColon(document: TextDocument, cursorPosition: Position, currentLine: string, currentLineEnd: number): ProcessYamlDocForCompletionOutput {
    let modifiedDocText: string
    let shouldPrependSpace: boolean = false

    const tempPositionForCompletions: Position = { ...cursorPosition }
    const startPositionForInsertion: Position = { ...cursorPosition }

    // Since there's no colon to separate the key and value, replace all text after the cursor.
    const endPositionForInsertion: Position = {
        line: cursorPosition.line,
        character: currentLine.length
    }

    const docText = document.getText()
    const docTextLength = docText.length
    const lineOffsets = getLineOffsets(docText)
    const trimmedLine = currentLine.trim()

    let preText: string
    let postText: string
    let insertedText: string

    // Current line has no non-space characters, insert a placeholder node at the end of the line
    if (trimmedLine.length === 0) {
        preText = docText.substring(0, currentLineEnd)
        insertedText = '"":\n'
        postText = docText.substr(lineOffsets[cursorPosition.line + 1] || docTextLength)

        tempPositionForCompletions.character += 1

    // Trimmed line starts with '-'
    } else if (trimmedLine.length >= 1 && trimmedLine[0] === '-') {
        // Set start of insertion range to be immediately after the hyphen.
        const hyphenIndex = currentLine.indexOf('-')
        startPositionForInsertion.character = hyphenIndex + 1
        shouldPrependSpace = true

        const postHyphenTextTrimmed = currentLine.substring(hyphenIndex + 1).trim()

        // No non-space characters after the hyphen, insert a placeholder node after the hyphen
        if (postHyphenTextTrimmed.length === 0) {
            tempPositionForCompletions.character = hyphenIndex + 3
            preText = docText.substring(0, lineOffsets[cursorPosition.line] + hyphenIndex)
            insertedText = "- '':\n"
            postText = docText.substr(lineOffsets[cursorPosition.line + 1] || docTextLength)

        // There are non-space character after the hyphen, but no colon. Just insert colon at end of line.
        } else {
            preText = docText.substring(0, currentLineEnd)
            insertedText = (!currentLine.endsWith(' ') ? ' ' : '') + ':\n'
            postText = docText.substr(lineOffsets[cursorPosition.line + 1] || docTextLength)
        }

    // Non-empty line but missing colon, add colon to end of current line
    } else {
        preText = docText.substring(0, currentLineEnd)
        insertedText = ':\n'
        postText = docText.substr(lineOffsets[cursorPosition.line + 1] || docTextLength)

        // Starting pos is first non-space character
        startPositionForInsertion.character = currentLine.indexOf(trimmedLine)
    }

    modifiedDocText = `${preText}${insertedText}${postText}`

    return {
        modifiedDocText,
        tempPositionForCompletions,
        startPositionForInsertion,
        endPositionForInsertion,
        shouldPrependSpace
    }
}

function processLineWithColon(document: TextDocument, cursorPosition: Position, currentLine: string, currentLineEnd: number): ProcessYamlDocForCompletionOutput {
    const docText = document.getText()
    const docTextLength = docText.length

    let modifiedDocText: string = docText
    let shouldPrependSpace: boolean = false

    const tempPositionForCompletions: Position = { ...cursorPosition }
    const startPositionForInsertion: Position = { ...cursorPosition }
    const endPositionForInsertion: Position = { ...cursorPosition }

    const charNum = cursorPosition.character
    const lineOffsets = getLineOffsets(docText)

    let preText: string
    let postText: string
    let insertedText: string

    // Current line has a colon, determine if cursor position is right or left of it
    const colonIndex = currentLine.indexOf(':')

    // Cursor is left of the colon.
    if (charNum <= colonIndex) {
        // Start position is first non-space character, ending position is left of colon.
        const preColonTextTrimmed = currentLine.substring(0, colonIndex).trim()

        // Only whitespace before the colon.
        if (preColonTextTrimmed.length === 0) {
            // Insert placeholder quotes and place cursor inside of them.
            preText = docText.substring(0, lineOffsets[cursorPosition.line] + colonIndex)
            insertedText = "''"
            postText = docText.substr(lineOffsets[cursorPosition.line] + colonIndex)

            startPositionForInsertion.character = colonIndex
            endPositionForInsertion.character = colonIndex
            tempPositionForCompletions.character = colonIndex + 1

        // Only hyphen before the colon.
        } else if (preColonTextTrimmed.length === 1 && preColonTextTrimmed.charAt(0) === '-') {
            // Insert placeholder quotes and place cursor inside of them.
            preText = docText.substring(0, lineOffsets[cursorPosition.line] + colonIndex)
            insertedText = " ''"
            postText = docText.substr(lineOffsets[cursorPosition.line] + colonIndex)

            startPositionForInsertion.character = colonIndex
            endPositionForInsertion.character = colonIndex

            // Move cursor to be inside the quotes
            tempPositionForCompletions.character = colonIndex + 2
            shouldPrependSpace = currentLine.charAt(Math.max(colonIndex - 1, 0)) !== ' '
        } else {
            // Set start of insertion range to be where the non-whitespace characters start.
            startPositionForInsertion.character = currentLine.indexOf(preColonTextTrimmed)
            // Set end of insertion range to be immediately before the colon.
            endPositionForInsertion.character = colonIndex

            preText = docText
            insertedText = ''
            postText = ''

            // If the non-whitespace characters start with a hyphen, adjust starting position to be after the hyphen
            if (preColonTextTrimmed.charAt(0) === '-') {
                startPositionForInsertion.character = Math.min(startPositionForInsertion.character + 2, colonIndex)
            }
        }

    // Cursor is right of the colon.
    } else {
        // Starting position is immediately after the colon, end is end of line
        startPositionForInsertion.character = colonIndex + 1
        endPositionForInsertion.character = currentLine.length
        shouldPrependSpace = true

        // Remove all trailing whitespace on that line and adjust tempPositionForCompletions if needed
        let numTrailingSpacesToRemove = 0
        while (currentLine.charAt(currentLine.length - numTrailingSpacesToRemove - 1) === ' ') {
            numTrailingSpacesToRemove++
        }
        tempPositionForCompletions.character = Math.min(tempPositionForCompletions.character, currentLine.length - numTrailingSpacesToRemove - 1)

        // If after removing trailing spaces, the last character is the colon, add a placeholder empty string value
        const postColonTextTrimmed = currentLine.substring(colonIndex + 1).trim()
        const hasOnlyWhitespaceAfterColon = postColonTextTrimmed.length === 0

        preText = docText.substring(0, currentLineEnd - numTrailingSpacesToRemove)
        insertedText = (hasOnlyWhitespaceAfterColon ? ' ""' : '') + '\n'
        postText = docText.substr(lineOffsets[cursorPosition.line + 1] || docTextLength)

        if (hasOnlyWhitespaceAfterColon) {
            // Move cursor inside of quotes
            tempPositionForCompletions.character += 2
        } else {
            // Current line has non-whitespace characters following the colon.
            const indexOfPostColonCharacters = currentLine.indexOf(postColonTextTrimmed)

            // Cursor is between colon and start of post-colon characters
            if (charNum < indexOfPostColonCharacters) {
                // Move cursor to be at immediately before the value
                tempPositionForCompletions.character = indexOfPostColonCharacters
            }
        }
    }

    modifiedDocText = `${preText}${insertedText}${postText}`

    return {
        modifiedDocText,
        tempPositionForCompletions,
        startPositionForInsertion,
        endPositionForInsertion,
        shouldPrependSpace
    }
}

// Returns an array of offsets corresponding to the line breaks in the provided text
function getLineOffsets(text: string): number[] {
    const lineOffsets: number[] = []
    let isLineStart = true

    for (let i = 0; i < text.length; i++) {
        if (isLineStart) {
            lineOffsets.push(i)
            isLineStart = false
        }
        const ch = text.charAt(i)
        isLineStart = ch === '\r' || ch === '\n'
        if (ch === '\r' && i + 1 < text.length && text.charAt(i + 1) === '\n') {
            i++
        }
    }

    if (isLineStart && text.length > 0) {
        lineOffsets.push(text.length)
    }

    return lineOffsets
}

// Returns the text for the current line as well as the offset at which the line ends.
function getCurrentLine(document: TextDocument, position: Position, lineOffsets: number[]): {
    currentLine: string,
    currentLineEnd: number
} {
    const docText = document.getText()
    const lineNum: number = position.line

    const lineStart = lineOffsets[lineNum]
    let lineEnd = lineOffsets[lineNum + 1] ? lineOffsets[lineNum + 1] : docText.length

    if (lineEnd - 1 >= 0 && isCharEol(docText.charCodeAt(lineEnd - 1))) {
        lineEnd--
    }

    const textLine = docText.substring(lineStart, lineEnd)

    return {
        currentLine: textLine,
        currentLineEnd: lineEnd
    }
}

// Returns true iff the character code matches LF or CR
function isCharEol(c: number) {
    return c === 0x0A || c === 0x0D
}

export function isStateNameReservedYamlKeyword(stateName: string): boolean {
    return YAML_RESERVED_KEYWORDS.indexOf(stateName.toLowerCase()) !== -1
}

export function convertJsonSnippetToYaml(snippetText: string) {
    // Convert to YAML with indendation of 1 space
    return safeDump(safeLoad(snippetText), { indent: 1 })
        // Remove quotation marks
        .replace(/[']/g, '')
        .split('\n')
        // For each line replace left padding spaces with tabs
        .map(line => {
            if (line.length) {
                let numOfSpaces = 0

                // Count number of spaces that the line begins with
                for (const char of line) {
                    if (char === ' ') {
                        numOfSpaces++
                    } else {
                        break
                    }
                }

                // Convert each space to tab character. Even though tab carracters are not valid yaml whitespace characters
                // the vscode will convert them to the correct number of spaces according to user preferences.
                return '\t'.repeat(numOfSpaces) + line.slice(numOfSpaces, line.length)
            } else {
                return line
            }
        })
        .join('\n')
}

function getNumberOfLeftSpaces(text: string) {
    let numOfLeftSpaces = 0

    for (const char of text) {
        if (char === ' ') {
            numOfLeftSpaces++
        } else {
            break
        }
    }

    return numOfLeftSpaces
}

const RETRY_CATCH_STATES = ['Task', 'Map', 'Parallel']
const RETRY_CATCH_STATES_REGEX_STRING = `(${RETRY_CATCH_STATES.join(')|(')})`
const CATCH_RETRY_STATE_REGEX = new RegExp(`['"]{0,1}Type['"]{0,1}\\s*:\\s*['"]{0,1}(${RETRY_CATCH_STATES_REGEX_STRING})['"]{0,1}`)

// tslint:disable:cyclomatic-complexity
// Returns true if the given offest is in a position of immediate child of the "States" property. False otherwise.
export function getOffsetData(document: TextDocument, offset: number) {
    let isDirectChildOfStates = false
    let isGrandChildOfStates = false
    let isWithinCatchRetryState = false;
    let hasCatchPropSibling = false;
    let hasRetryPropSibling = false;
    const prevText = document.getText().substring(0, offset).split('\n')
    const cursorLine = prevText[prevText.length - 1]
    let hasCursorLineNonSpace = false
    let numberOfSpacesCursorLine = 0

    Array.from(cursorLine).forEach(char => {
        if (char === ' ') {
            numberOfSpacesCursorLine++
        } else if (char !== "'" && char !== '"') {
            hasCursorLineNonSpace = true;
        }
    })
    const initialNumberOfSpaces = numberOfSpacesCursorLine

    if (!hasCursorLineNonSpace && numberOfSpacesCursorLine > 0) {
        const text = document.getText()
        let beginLineOffset = offset;
        let levelsDown = 0;

        // Iterate the text backwards from the offset
        for (let i = offset; i >= 0; i--) {
            if (text[i] === '\n') {
                const lineText = text.slice(i + 1, beginLineOffset)
                const numberOfPrecedingSpaces = getNumberOfLeftSpaces(lineText)
                const trimmedLine = lineText.trim()
                beginLineOffset = i

                // Ignore empty lines
                if (trimmedLine.length === 0) {
                    continue
                }

                // If number of spaces lower than that of the cursor
                // it is a parent property or a sibling of parent property
                if (numberOfPrecedingSpaces < initialNumberOfSpaces) {
                    if (trimmedLine.startsWith('States:')) {
                        isDirectChildOfStates = levelsDown === 0;
                        isGrandChildOfStates = levelsDown === 1;
                        break
                    } else if (levelsDown === 0) {
                        levelsDown++
                        continue
                    } else {
                        break
                    }

                // If number of spaces is higher than that of the cursor it means it is a child
                // of the property or of its siblings
                } else if (numberOfPrecedingSpaces > initialNumberOfSpaces) {
                    continue
                } else if (levelsDown > 0) {
                    continue
                }

                hasCatchPropSibling = trimmedLine.startsWith('Catch:') || hasCatchPropSibling
                hasRetryPropSibling = trimmedLine.startsWith('Retry:') || hasRetryPropSibling

                const isCatchRetryState = CATCH_RETRY_STATE_REGEX.test(trimmedLine)

                if (isCatchRetryState) {
                    isWithinCatchRetryState = true
                    break
                } else {
                    continue
                }
            }
        }

        // Reset begin line offset to offset
        beginLineOffset = offset;

        // Iterate the text forwards from the offset
        for (let i = offset; i <= text.length; i++) {
            if (text[i] === '\n') {
                const lineText = text.slice(beginLineOffset + 1, i)
                const trimmedLine = lineText.trim()
                const numberOfPrecedingSpaces = getNumberOfLeftSpaces(lineText)
                beginLineOffset = i

                // Ignore empty lines
                if (trimmedLine.length === 0) {
                    continue
                }

                // If number of spaces lower than that of the cursor
                // it is a parent property or a sibling of parent property
                if (numberOfPrecedingSpaces < initialNumberOfSpaces) {
                    break
                // If number of spaces is higher than that of the cursor it means it is a child
                // of the property or of its siblings
                } else if (numberOfPrecedingSpaces > initialNumberOfSpaces) {
                    continue
                }

                hasCatchPropSibling = trimmedLine.startsWith('Catch:') || hasCatchPropSibling
                hasRetryPropSibling = trimmedLine.startsWith('Retry:') || hasRetryPropSibling

                const isCatchRetryState = CATCH_RETRY_STATE_REGEX.test(trimmedLine)

                if (isCatchRetryState) {
                    isWithinCatchRetryState = true
                    break
                } else {
                    continue
                }
            }
        }
    }

    return {
        isDirectChildOfStates,
        isWithinCatchRetryState,
        hasCatchPropSibling,
        hasRetryPropSibling
    }
}
