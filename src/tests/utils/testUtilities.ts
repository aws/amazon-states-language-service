/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import { getLanguageService, JSONDocument, TextDocument } from '../../service'

export function toDocument(text: string, isYaml: boolean): { textDoc: TextDocument, jsonDoc: JSONDocument } {
    let textDoc: TextDocument;

    if (isYaml) {
        textDoc = TextDocument.create('foo://bar/file.asl.yaml', 'yasl', 0, text);
    } else {
        textDoc = TextDocument.create('foo://bar/file.asl', 'json', 0, text);
    }

    const ls = getLanguageService({});
    // tslint:disable-next-line: no-inferred-empty-object-type
    const jsonDoc = ls.parseJSONDocument(textDoc) as JSONDocument;

    return { textDoc, jsonDoc };
}
