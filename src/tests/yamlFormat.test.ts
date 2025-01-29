/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import * as assert from 'assert'
import { FormattingOptions, TextEdit } from 'vscode-languageserver-types'
import { getYamlLanguageService, Position, Range } from '../service'
import { toDocument } from './utils/testUtilities'

async function getFormat(yaml: string, range: Range, formattingOptions: FormattingOptions): Promise<TextEdit[]> {
    const { textDoc } = toDocument(yaml, true)
    const ls = getYamlLanguageService({})

    return ls.format(textDoc, range, formattingOptions);
}

describe('ASL YAML format', () => {
    test('Format does not remove comments', async () => {
        const yaml = `
        # this is my comment
        hello: world # this is another comment
        `
        const formattedTextEdits = await getFormat(yaml, Range.create(Position.create(0, 0), Position.create(yaml.length, yaml.length)), {
            tabSize: 4,
            insertSpaces: true
        })

        assert.equal(formattedTextEdits[0].newText, '# this is my comment\nhello: world # this is another comment\n', 'Expected comments to not be removed')
    })

    test('Format removes unnecessary spaces', async () => {
        const yaml = `
        hello:                    world
        `
        const formattedTextEdits = await getFormat(yaml, Range.create(Position.create(0, 0), Position.create(yaml.length, yaml.length)), {
            tabSize: 4,
            insertSpaces: true
        })

        assert.equal(formattedTextEdits[0].newText, 'hello: world\n', 'Expected unnecessary spaces to be removed')
    })
})
