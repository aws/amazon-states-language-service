/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import { TextDocument } from 'vscode-languageserver-textdocument'
import { Position } from 'vscode-languageserver-types'

/* Returns an object with the following properties:
    modifiedDocText: The text document derived from the document parameter which will be used to generate code completions
    tempPositionForCompletions: The Position within modifiedDocText which will be used to generate code completions
    startPositionForInsertion: The starting Position for the insert range applied to the generated code completions
    endPositionForInsertion: The ending Position for the insert range applied to the generated code completions
    shouldPrependSpace: A boolean indicating whether the generated code completions should have a space prepended to them
*/
export function processYamlDocForCompletion(document: TextDocument, position: Position): {
    modifiedDocText: string,
    tempPositionForCompletions: Position,
    startPositionForInsertion: Position,
    endPositionForInsertion: Position,
    shouldPrependSpace: boolean
} {
    const lineOffsets = getLineOffsets(document.getText())
    const { currentLine, currentLineEnd } = getCurrentLine(document, position, lineOffsets)

    if (currentLine.indexOf(':') === -1) {
        return processLineWithoutColon(document, position, currentLine, currentLineEnd)
    } else {
        return processLineWithColon(document, position, currentLine, currentLineEnd)
    }
}

function processLineWithoutColon(document: TextDocument, cursorPosition: Position, currentLine: string, currentLineEnd: number): {
    modifiedDocText: string,
    tempPositionForCompletions: Position,
    startPositionForInsertion: Position,
    endPositionForInsertion: Position,
    shouldPrependSpace: boolean
} {
    let modifiedDocText: string
    let shouldPrependSpace: boolean = false

    const tempPositionForCompletions: Position = {...cursorPosition}
    const startPositionForInsertion: Position = {...cursorPosition}
    const endPositionForInsertion: Position = {...cursorPosition}

    // Since there's no colon to separate the key and value, replace all text after the cursor.
    endPositionForInsertion.character = currentLine.length

    const lineOffsets = getLineOffsets(document.getText())

    const trimmedLine = currentLine.trim()

    if (trimmedLine.length === 0) {
        modifiedDocText =
            // tslint:disable-next-line: prefer-template
            document.getText().substring(0, currentLineEnd) +
                '"":\r\n' +
                document.getText().substr(lineOffsets[cursorPosition.line + 1] || document.getText().length)

        tempPositionForCompletions.character += 1

    // Trimmed line starts with '-'
    } else if (trimmedLine.length >= 1 && trimmedLine[0] === '-') {
        // Set start of insertion range to be immediately after the hyphen.
        const indexOfHyphen = currentLine.indexOf('-')
        startPositionForInsertion.character = indexOfHyphen + 1
        shouldPrependSpace = true

        modifiedDocText =
            // tslint:disable-next-line: prefer-template
            document.getText().substring(0, currentLineEnd) +
                (!currentLine.endsWith(' ') ? ' ' : '') +
                ':\r\n' +
                document.getText().substr(lineOffsets[cursorPosition.line + 1] || document.getText().length)

    // Non-empty line but missing colon, add colon to end of current line
    } else {
        modifiedDocText =
            // tslint:disable-next-line: prefer-template
            document.getText().substring(0, currentLineEnd) +
                ':\r\n' +
                document.getText().substr(lineOffsets[cursorPosition.line + 1] || document.getText().length)

        // Starting pos is first non-space character
        startPositionForInsertion.character = currentLine.indexOf(trimmedLine)
    }

    return {
        modifiedDocText,
        tempPositionForCompletions,
        startPositionForInsertion,
        endPositionForInsertion,
        shouldPrependSpace
    }
}

function processLineWithColon(document: TextDocument, cursorPosition: Position, currentLine: string, currentLineEnd: number): {
    modifiedDocText: string,
    tempPositionForCompletions: Position,
    startPositionForInsertion: Position,
    endPositionForInsertion: Position,
    shouldPrependSpace: boolean
} {
    let modifiedDocText: string = document.getText()
    let shouldPrependSpace: boolean = false

    const tempPositionForCompletions: Position = {...cursorPosition}
    const startPositionForInsertion: Position = {...cursorPosition}
    const endPositionForInsertion: Position = {...cursorPosition}

    const charNum = cursorPosition.character
    const lineOffsets = getLineOffsets(document.getText())

    // Current line has a colon, determine if cursor position is right or left of it
    const colonIndex = currentLine.indexOf(':')

    // Cursor is left of the colon.
    if (charNum <= colonIndex) {
        // Start position is first non-space character, ending position is left of colon.
        const preColonTextTrimmed = currentLine.substring(0, colonIndex).trim()

        // Only whitespace before the colon.
        if (preColonTextTrimmed.length === 0) {
            // Insert placeholder quotes and place cursor inside of them.
            modifiedDocText =
                // tslint:disable-next-line: prefer-template
                document.getText().substring(0, lineOffsets[cursorPosition.line] + colonIndex) +
                    "''" +
                    document.getText().substr(lineOffsets[cursorPosition.line] + colonIndex)
            startPositionForInsertion.character = colonIndex
            endPositionForInsertion.character = colonIndex
            tempPositionForCompletions.character = colonIndex + 1

        // Only hyphen before the colon.
        } else if (preColonTextTrimmed.length === 1 && preColonTextTrimmed.charAt(0) === '-') {
            // Insert placeholder quotes and place cursor inside of them.
            modifiedDocText =
                // tslint:disable-next-line: prefer-template
                document.getText().substring(0, lineOffsets[cursorPosition.line] + colonIndex) +
                    " ''" +
                    document.getText().substr(lineOffsets[cursorPosition.line] + colonIndex)
            startPositionForInsertion.character = colonIndex
            endPositionForInsertion.character = colonIndex
            tempPositionForCompletions.character = colonIndex + 2
            shouldPrependSpace = currentLine.charAt(Math.max(colonIndex - 1, 0)) !== ' '

        } else {
            // Set start of insertion range to be where the non-whitespace characters start.
            startPositionForInsertion.character = currentLine.indexOf(preColonTextTrimmed)
            // Set end of insertion range to be immediately before the colon.
            endPositionForInsertion.character = colonIndex

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

        modifiedDocText =
            // tslint:disable-next-line: prefer-template
            document.getText().substring(0, currentLineEnd - numTrailingSpacesToRemove) +
                (hasOnlyWhitespaceAfterColon ? ' ""' : '') +
                '\r\n' +
                document.getText().substr(lineOffsets[cursorPosition.line + 1] || document.getText().length)

        if (hasOnlyWhitespaceAfterColon) {
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
    const lineNum: number = position.line

    const lineStart = lineOffsets[lineNum]
    let lineEnd = lineOffsets[lineNum + 1] ? lineOffsets[lineNum + 1] : document.getText().length

    while (lineEnd - 1 >= 0 && isCharEol(document.getText().charCodeAt(lineEnd - 1))) {
        lineEnd--
    }

    const textLine = document.getText().substring(lineStart, lineEnd)

    return {
        currentLine: textLine,
        currentLineEnd: lineEnd
    }
}

// Returns true iff the character code matches LF or CR
function isCharEol(c: number) {
    return c === 0x0A || c === 0x0D
}
