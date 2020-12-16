/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import { LANGUAGE_IDS } from '../../constants/constants';
import { getLanguageService, JSONDocument, TextDocument } from '../../service'

export function toDocument(text: string, isYaml?: boolean): { textDoc: TextDocument, jsonDoc: JSONDocument } {
    const textDoc = TextDocument.create(`foo://bar/file.${isYaml ? 'asl.yaml' : 'asl'}`, isYaml ? LANGUAGE_IDS.YAML : 'asl', 0, text);

    const ls = getLanguageService({});
    // tslint:disable-next-line: no-inferred-empty-object-type
    const jsonDoc = ls.parseJSONDocument(textDoc) as JSONDocument;

    return { textDoc, jsonDoc };
}
