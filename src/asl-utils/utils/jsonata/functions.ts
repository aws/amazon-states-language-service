/*!
 * Copyright 2025 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

// Function descriptions have a large bundle size, so only import this file dynamically.

export type FunctionCategory =
  | 'string'
  | 'numeric'
  | 'aggregation'
  | 'boolean'
  | 'array'
  | 'object'
  | 'date'
  | 'higher-order'

export interface FunctionParam {
  name: string
  optional?: boolean
  variable?: boolean
}

export interface FunctionType {
  params: ReadonlyArray<FunctionParam>
  category: FunctionCategory
  description: string
}

export type JsonataFunctionsMap = Map<string, FunctionType>

const jsonataFunctionsList: Record<string, FunctionType> = {
  $string: {
    params: [
      {
        name: 'arg',
      },
      {
        name: 'prettify',
      },
    ],
    category: 'string',
    description:
      'Casts the `arg` parameter to a string using the following casting rules\n\n   - Strings are unchanged\n   - Functions are converted to an empty string\n   - Numeric infinity and NaN throw an error because they cannot be represented as a JSON number\n   - All other values are converted to a JSON string\n\nIf `arg` is not specified (i.e. this function is invoked with no arguments), then the context value is used as the value of `arg`.\n\nIf `prettify` is true, then "prettified" JSON is produced. i.e One line per field and lines will be indented based on the field depth.\n\n__Examples__\n\n- `$string(5)` => `"5"`\n- `[1..5].$string()` => `["1", "2", "3", "4", "5"]`',
  },
  $length: {
    params: [
      {
        name: 'str',
      },
    ],
    category: 'string',
    description:
      'Returns the number of characters in the string `str`.  If `str` is not specified (i.e. this function is invoked with no arguments), then the context value is used as the value of `str`.  An error is thrown if `str` is not a string.\n\n__Examples__\n\n- `$length("Hello World")` => `11`',
  },
  $substring: {
    params: [
      {
        name: 'str',
      },
      {
        name: 'start',
      },
      {
        name: 'length',
        optional: true,
      },
    ],
    category: 'string',
    description:
      'Returns a string containing the characters in the first parameter `str` starting at position `start` (zero-offset).  If `str` is not specified (i.e. this function is invoked with only the numeric argument(s)), then the context value is used as the value of `str`.  An error is thrown if `str` is not a string.\n\nIf `length` is specified, then the substring will contain maximum `length` characters.\n\nIf `start` is negative then it indicates the number of characters from the end of `str`. \n\n__Examples__\n\n- `$substring("Hello World", 3)` => `"lo World"`\n- `$substring("Hello World", 3, 5)` => `"lo Wo"`\n- `$substring("Hello World", -4)` => `"orld"`\n- `$substring("Hello World", -4, 2)` => `"or"`',
  },
  $substringBefore: {
    params: [
      {
        name: 'str',
      },
      {
        name: 'chars',
      },
    ],
    category: 'string',
    description:
      'Returns the substring before the first occurrence of the character sequence `chars` in `str`.  If `str` is not specified (i.e. this function is invoked with only one argument), then the context value is used as the value of `str`.  If `str` does not contain `chars`, then it returns `str`.   An error is thrown if `str` and `chars` are not strings.\n\n__Examples__\n\n- `$substringBefore("Hello World", " ")` => `"Hello"`',
  },
  $substringAfter: {
    params: [
      {
        name: 'str',
      },
      {
        name: 'chars',
      },
    ],
    category: 'string',
    description:
      'Returns the substring after the first occurrence of the character sequence `chars` in `str`.  If `str` is not specified (i.e. this function is invoked with only one argument), then the context value is used as the value of `str`.  If `str` does not contain `chars`, then it returns `str`.   An error is thrown if `str` and `chars` are not strings.\n\n__Examples__\n\n- `$substringAfter("Hello World", " ")` => `"World"`',
  },
  $uppercase: {
    params: [
      {
        name: 'str',
      },
    ],
    category: 'string',
    description:
      'Returns a string with all the characters of `str` converted to uppercase.  If `str` is not specified (i.e. this function is invoked with no arguments), then the context value is used as the value of `str`.  An error is thrown if `str` is not a string.\n\n__Examples__\n\n- `$uppercase("Hello World")` => `"HELLO WORLD"`',
  },
  $lowercase: {
    params: [
      {
        name: 'str',
      },
    ],
    category: 'string',
    description:
      'Returns a string with all the characters of `str` converted to lowercase.  If `str` is not specified (i.e. this function is invoked with no arguments), then the context value is used as the value of `str`.  An error is thrown if `str` is not a string.\n\n__Examples__\n\n- `$lowercase("Hello World")` => `"hello world"`',
  },
  $trim: {
    params: [
      {
        name: 'str',
      },
    ],
    category: 'string',
    description:
      'Normalizes and trims all whitespace characters in `str` by applying the following steps:\n\n- All tabs, carriage returns, and line feeds are replaced with spaces.\n- Contiguous sequences of spaces are reduced to a single space.\n- Trailing and leading spaces are removed.\n\nIf `str` is not specified (i.e. this function is invoked with no arguments), then the context value is used as the value of `str`.  An error is thrown if `str` is not a string.\n\n__Examples__\n\n- `$trim("   Hello    \\n World  ")` => `"Hello World"`',
  },
  $pad: {
    params: [
      {
        name: 'str',
      },
      {
        name: 'width',
      },
      {
        name: 'char',
        optional: true,
      },
    ],
    category: 'string',
    description:
      'Returns a copy of the string `str` with extra padding, if necessary, so that its total number of characters is at least the absolute value of the `width` parameter.  If `width` is a positive number, then the string is padded to the right; if negative, it is padded to the left.  The optional `char` argument specifies the padding character(s) to use.  If not specified, it defaults to the space character.\n\n__Examples__\n\n- `$pad("foo", 5)` => `"foo  "`\n- `$pad("foo", -5)` => `"  foo"`\n- `$pad("foo", -5, "#")` => `"##foo"`\n- `$formatBase(35, 2) ~> $pad(-8, \'0\')` => `"00100011"`',
  },
  $contains: {
    params: [
      {
        name: 'str',
      },
      {
        name: 'pattern',
      },
    ],
    category: 'string',
    description:
      'Returns `true` if `str` is matched by `pattern`, otherwise it returns `false`. If `str` is not specified (i.e. this function is invoked with one argument), then the context value is used as the value of `str`.\n\nThe `pattern` parameter can either be a string or a regular expression (regex).  If it is a string, the function returns `true` if the characters within `pattern` are contained contiguously within `str`.  If it is a regex, the function will return `true` if the regex matches the contents of `str`.\n\n__Examples__\n\n- `$contains("abracadabra", "bra")` => `true`\n- `$contains("abracadabra", /a.*a/)` => `true`\n- `$contains("abracadabra", /ar.*a/)` => `false`\n- `$contains("Hello World", /wo/)` => `false`\n- `$contains("Hello World", /wo/i)` => `true`\n- `Phone[$contains(number, /^077/)]` => `{ "type": "mobile", "number": "077 7700 1234" }`',
  },
  $split: {
    params: [
      {
        name: 'str',
      },
      {
        name: 'separator',
      },
      {
        name: 'limit',
        optional: true,
      },
    ],
    category: 'string',
    description:
      'Splits the `str` parameter into an array of substrings.  If `str` is not specified, then the context value is used as the value of `str`.  It is an error if `str` is not a string.\n\nThe `separator` parameter can either be a string or a regular expression (regex).  If it is a string, it specifies the characters within `str` about which it should be split.  If it is the empty string, `str` will be split into an array of single characters.  If it is a regex, it splits the string around any sequence of characters that match the regex.\n\nThe optional `limit` parameter is a number that specifies the maximum number of substrings to  include in the resultant array.  Any additional substrings are discarded.  If `limit` is not  specified, then `str` is fully split with no limit to the size of the resultant array.  It is an error if `limit` is not a non-negative number.\n\n__Examples__\n\n- `$split("so many words", " ")` => `[ "so", "many", "words" ]`\n- `$split("so many words", " ", 2)` => `[ "so", "many" ]`\n- `$split("too much, punctuation. hard; to read", /[ ,.;]+/)` => `["too", "much", "punctuation", "hard", "to", "read"]`',
  },
  $join: {
    params: [
      {
        name: 'array',
      },
      {
        name: 'separator',
        optional: true,
      },
    ],
    category: 'string',
    description:
      "Joins an array of component strings into a single concatenated string with each component string separated by the optional `separator` parameter.\n\nIt is an error if the input array contains an item which isn't a string.\n\nIf `separator` is not specified, then it is assumed to be the empty string, i.e. no separator between the component strings.  It is an error if `separator` is not a string.\n\n__Examples__\n\n- `$join(['a','b','c'])` => `\"abc\"`\n- `$split(\"too much, punctuation. hard; to read\", /[ ,.;]+/, 3) ~> $join(', ')` => `\"too, much, punctuation\"`",
  },
  $match: {
    params: [
      {
        name: 'str',
      },
      {
        name: 'pattern',
      },
      {
        name: 'limit',
        optional: true,
      },
    ],
    category: 'string',
    description:
      'Applies the `str` string to the `pattern` regular expression and returns an array of objects, with each object containing information about each occurrence of a match withing `str`.\n\nThe object contains the following fields:\n\n- `match` - the substring that was matched by the regex.\n- `index` - the offset (starting at zero) within `str` of this match.\n- `groups` - if the regex contains capturing groups (parentheses), this contains an array of strings representing each captured group.\n\nIf `str` is not specified, then the context value is used as the value of `str`.  It is an error if `str` is not a string.\n\n__Examples__\n\n`$match("ababbabbcc",/a(b+)/)` =>\n```\n[\n  {\n    "match": "ab",\n    "index": 0,\n    "groups": ["b"]\n  },\n  {\n    "match": "abb",\n    "index": 2,\n    "groups": ["bb"]\n  },\n  {\n    "match": "abb",\n    "index": 5,\n    "groups": ["bb" ]\n  }\n]\n```',
  },
  $replace: {
    params: [
      {
        name: 'str',
      },
      {
        name: 'pattern',
      },
      {
        name: 'replacement',
      },
      {
        name: 'limit',
        optional: true,
      },
    ],
    category: 'string',
    description:
      'Finds occurrences of `pattern` within `str` and replaces them with `replacement`.\n\nIf `str` is not specified, then the context value is used as the value of `str`.  It is an error if `str` is not a string.\n\nThe `pattern` parameter can either be a string or a regular expression (regex).  If it is a string, it specifies the substring(s) within `str` which should be replaced.  If it is a regex, its is used to find .\n\nThe `replacement` parameter can either be a string or a function.  If it is a string, it specifies the sequence of characters that replace the substring(s) that are matched by `pattern`.  If `pattern` is a regex, then the `replacement` string can refer to the characters that were matched by the regex as well as any of the captured groups using a `$` followed by a number `N`:\n\n- If `N = 0`, then it is replaced by substring matched by the regex as a whole.\n- If `N > 0`, then it is replaced by the substring captured by the Nth parenthesised group in the regex.\n- If `N` is greater than the number of captured groups, then it is replaced by the empty string.\n- A literal `$` character must be written as `$$` in the `replacement` string\n\nIf the `replacement` parameter is a function, then it is invoked for each match occurrence of the `pattern` regex.  The `replacement` function must take a single parameter which will be the object structure of a regex match as described in the `$match` function; and must return a string.\n\nThe optional `limit` parameter,  is a number that specifies the maximum number of replacements to make before stopping.  The remainder of the input beyond this limit will be copied to the output unchanged.\n\n__Examples__\n\n  <div class="jsonata-ex">\n    <div>$replace("John Smith and John Jones", "John", "Mr")</div>\n    <div>"Mr Smith and Mr Jones"</div>\n  </div>\n\n  <div class="jsonata-ex">\n    <div>$replace("John Smith and John Jones", "John", "Mr", 1)</div>\n    <div>"Mr Smith and John Jones"</div>\n  </div>\n\n  <div class="jsonata-ex">\n    <div>$replace("abracadabra", /a.*?a/, "*")</div>\n    <div>"*c*bra"</div>\n  </div>\n\n  <div class="jsonata-ex">\n    <div>$replace("John Smith", /(\\w+)\\s(\\w+)/, "$2, $1")</div>\n    <div>"Smith, John"</div>\n  </div>\n\n  <div class="jsonata-ex">\n    <div>$replace("265USD", /([0-9]+)USD/, "$$$1")</div>\n    <div>"$265"</div>\n  </div>\n\n  <div class="jsonata-ex">\n    <div>(\n  $convert := function($m) {\n    ($number($m.groups[0]) - 32) * 5/9 & "C"\n  };\n  $replace("temperature = 68F today", /(\\d+)F/, $convert)\n)</div>\n    <div>"temperature = 20C today"</div>\n  </div>',
  },
  $base64encode: {
    params: [],
    category: 'string',
    description:
      'Converts an ASCII string to a base 64 representation. Each each character in the string is treated as a byte of binary data. This requires that all characters in the string are in the 0x00 to 0xFF range, which includes all characters in URI encoded strings. Unicode characters outside of that range are not supported.\n\n__Examples__\n\n- `$base64encode("abc:def")` => `"YWJjOmRlZg=="`',
  },
  $base64decode: {
    params: [],
    category: 'string',
    description:
      'Converts base 64 encoded bytes to a string, using a UTF-8 Unicode codepage.\n\n__Examples__\n\n- `$base64decode("YWJjOmRlZg==")` => `"abc:def"`',
  },
  $encodeUrlComponent: {
    params: [
      {
        name: 'str',
      },
    ],
    category: 'string',
    description:
      'Encodes a Uniform Resource Locator (URL) component by replacing each instance of certain characters by one, two, three, or four escape sequences representing the UTF-8 encoding of the character.\n\n__Examples__\n\n- `$encodeUrlComponent("?x=test")` => `"%3Fx%3Dtest"`',
  },
  $encodeUrl: {
    params: [
      {
        name: 'str',
      },
    ],
    category: 'string',
    description:
      'Encodes a Uniform Resource Locator (URL) by replacing each instance of certain characters by one, two, three, or four escape sequences representing the UTF-8 encoding of the character.\n\n__Examples__\n\n- `$encodeUrl("https://mozilla.org/?x=шеллы")` => `"https://mozilla.org/?x=%D1%88%D0%B5%D0%BB%D0%BB%D1%8B"`',
  },
  $decodeUrlComponent: {
    params: [
      {
        name: 'str',
      },
    ],
    category: 'string',
    description:
      'Decodes a Uniform Resource Locator (URL) component previously created by encodeUrlComponent.\n\n__Examples__\n\n- `$decodeUrlComponent("%3Fx%3Dtest")` => `"?x=test"`',
  },
  $decodeUrl: {
    params: [
      {
        name: 'str',
      },
    ],
    category: 'string',
    description:
      'Decodes a Uniform Resource Locator (URL) previously created by encodeUrl.\n\n__Examples__\n\n- `$decodeUrl("https://mozilla.org/?x=%D1%88%D0%B5%D0%BB%D0%BB%D1%8B")` => `"https://mozilla.org/?x=шеллы"`',
  },
  $number: {
    params: [
      {
        name: 'arg',
      },
    ],
    category: 'numeric',
    description:
      'Casts the `arg` parameter to a number using the following casting rules\n   - Numbers are unchanged\n   - Strings that contain a sequence of characters that represent a legal JSON number are converted to that number\n   - Hexadecimal numbers start with `0x`, Octal numbers with `0o`, binary numbers with `0b`\n   - Boolean `true` casts to `1`, Boolean `false` casts to `0`\n   - All other values cause an error to be thrown.\n\nIf `arg` is not specified (i.e. this function is invoked with no arguments), then the context value is used as the value of `arg`. \n\n__Examples__  \n- `$number("5")` => `5`  \n- `$number("0x12")` => `0x18`  \n- `["1", "2", "3", "4", "5"].$number()` => `[1, 2, 3, 4, 5]`',
  },
  $abs: {
    params: [
      {
        name: 'arg',
      },
    ],
    category: 'numeric',
    description:
      'Returns the absolute value of the `number` parameter, i.e. if the number is negative, it returns the positive value.\n\nIf `number` is not specified (i.e. this function is invoked with no arguments), then the context value is used as the value of `number`. \n\n__Examples__  \n- `$abs(5)` => `5`  \n- `$abs(-5)` => `5`',
  },
  $floor: {
    params: [
      {
        name: 'number',
      },
    ],
    category: 'numeric',
    description:
      'Returns the value of `number` rounded down to the nearest integer that is smaller or equal to `number`. \n\nIf `number` is not specified (i.e. this function is invoked with no arguments), then the context value is used as the value of `number`. \n\n__Examples__  \n- `$floor(5)` => `5`  \n- `$floor(5.3)` => `5`  \n- `$floor(5.8)` => `5`  \n- `$floor(-5.3)` => `-6`',
  },
  $ceil: {
    params: [
      {
        name: 'number',
      },
    ],
    category: 'numeric',
    description:
      'Returns the value of `number` rounded up to the nearest integer that is greater than or equal to `number`. \n\nIf `number` is not specified (i.e. this function is invoked with no arguments), then the context value is used as the value of `number`. \n\n__Examples__  \n- `$ceil(5)` => `5`  \n- `$ceil(5.3)` => `6`  \n- `$ceil(5.8)` => `6`  \n- `$ceil(-5.3)` => `-5`',
  },
  $round: {
    params: [
      {
        name: 'number',
      },
      {
        name: 'precision',
        optional: true,
      },
    ],
    category: 'numeric',
    description:
      'Returns the value of the `number` parameter rounded to the number of decimal places specified by the optional `precision` parameter.  \n\nThe `precision` parameter (which must be an integer) species the number of decimal places to be present in the rounded number.   If `precision` is not specified then it defaults to the value `0` and the number is rounded to the nearest integer.  If `precision` is negative, then its value specifies which column to round to on the left side of the decimal place\n\nThis function uses the [Round half to even](https://en.wikipedia.org/wiki/Rounding#Round_half_to_even) strategy to decide which way to round numbers that fall exactly between two candidates at the specified precision.  This strategy is commonly used in financial calculations and is the default rounding mode in IEEE 754.\n\n__Examples__  \n- `$round(123.456)` => `123`  \n- `$round(123.456, 2)` => `123.46`  \n- `$round(123.456, -1)` => `120`  \n- `$round(123.456, -2)` => `100`  \n- `$round(11.5)` => `12`  \n- `$round(12.5)` => `12`  \n- `$round(125, -1)` => `120`',
  },
  $power: {
    params: [
      {
        name: 'base',
      },
      {
        name: 'exponent',
      },
    ],
    category: 'numeric',
    description:
      'Returns the value of `base` raised to the power of `exponent` (<code>base<sup>exponent</sup></code>).\n\nIf `base` is not specified (i.e. this function is invoked with one argument), then the context value is used as the value of `base`. \n\nAn error is thrown if the values of `base` and `exponent` lead to a value that cannot be represented as a JSON number (e.g. Infinity, complex numbers).\n\n__Examples__  \n- `$power(2, 8)` => `256`  \n- `$power(2, 0.5)` => `1.414213562373`  \n- `$power(2, -2)` => `0.25`',
  },
  $sqrt: {
    params: [
      {
        name: 'number',
      },
    ],
    category: 'numeric',
    description:
      'Returns the square root of the value of the `number` parameter.\n\nIf `number` is not specified (i.e. this function is invoked with one argument), then the context value is used as the value of `number`. \n\nAn error is thrown if the value of `number` is negative.\n\n__Examples__  \n- `$sqrt(4)` => `2`\n- `$sqrt(2)` => `1.414213562373`',
  },
  $formatNumber: {
    params: [
      {
        name: 'number',
      },
      {
        name: 'picture',
      },
      {
        name: 'options',
        optional: true,
      },
    ],
    category: 'numeric',
    description:
      'Casts the `number` to a string and formats it to a decimal representation as specified by the `picture` string.\n\nThe behaviour of this function is consistent with the XPath/XQuery function [fn:format-number](https://www.w3.org/TR/xpath-functions-31/#func-format-number) as defined in the XPath F&O 3.1 specification.  The picture string parameter defines how the number is formatted and has the [same syntax](https://www.w3.org/TR/xpath-functions-31/#syntax-of-picture-string) as fn:format-number.\n\nThe optional third argument `options` is used to override the default locale specific formatting characters such as the decimal separator.  If supplied, this argument must be an object containing name/value pairs specified in the [decimal format](https://www.w3.org/TR/xpath-functions-31/#defining-decimal-format) section of the XPath F&O 3.1 specification.\n\n__Examples__\n\n- `$formatNumber(12345.6, \'#,###.00\')` => `"12,345.60"`   \n- `$formatNumber(1234.5678, "00.000e0")` => `"12.346e2"`   \n- `$formatNumber(34.555, "#0.00;(#0.00)")` => `"34.56"`   \n- `$formatNumber(-34.555, "#0.00;(#0.00)")` => `"(34.56)"`   \n- `$formatNumber(0.14, "01%")` => `"14%"`   \n- `$formatNumber(0.14, "###pm", {"per-mille": "pm"})` => `"140pm"`   \n- `$formatNumber(1234.5678, "①①.①①①e①", {"zero-digit": "\\u245f"})` => `"①②.③④⑥e②"`',
  },
  $formatBase: {
    params: [
      {
        name: 'number',
      },
      {
        name: 'radix',
        optional: true,
      },
    ],
    category: 'numeric',
    description:
      'Casts the `number` to a string and formats it to an integer represented in the number base specified by the `radix` argument.  If `radix` is not specified, then it defaults to base 10.  `radix` can be between 2 and 36, otherwise an error is thrown.\n\n__Examples__\n\n- `$formatBase(100, 2)` => `"1100100"`\n- `$formatBase(2555, 16)` => `"9fb"`',
  },
  $formatInteger: {
    params: [
      {
        name: 'number',
      },
      {
        name: 'picture',
      },
    ],
    category: 'numeric',
    description:
      'Casts the `number` to a string and formats it to an integer representation as specified by the `picture` string.\n\nThe behaviour of this function is consistent with the two-argument version of the XPath/XQuery function [fn:format-integer](https://www.w3.org/TR/xpath-functions-31/#func-format-integer) as defined in the XPath F&O 3.1 specification.  The picture string parameter defines how the number is formatted and has the same syntax as fn:format-integer.\n\n__Examples__\n\n- `$formatInteger(2789, \'w\')` => `"two thousand, seven hundred and eighty-nine"`\n- `$formatInteger(1999, \'I\')` => `"MCMXCIX"`',
  },
  $parseInteger: {
    params: [
      {
        name: 'string',
      },
      {
        name: 'picture',
      },
    ],
    category: 'numeric',
    description:
      "Parses the contents of the `string` parameter to an integer (as a JSON number) using the format specified by the `picture` string.\nThe picture string parameter has the same format as `$formatInteger`. Although the XPath specification does not have an equivalent\nfunction for parsing integers, this capability has been added to JSONata.\n\n__Examples__\n\n- `$parseInteger(\"twelve thousand, four hundred and seventy-six\", 'w')` => `12476`\n- `$parseInteger('12,345,678', '#,##0')` => `12345678`",
  },
  $sum: {
    params: [
      {
        name: 'array',
      },
    ],
    category: 'aggregation',
    description:
      "Returns the arithmetic sum of an array of numbers.  It is an error if the input array contains an item which isn't a number.\n\n__Example__\n\n- `$sum([5,1,3,7,4])` => `20`",
  },
  $max: {
    params: [
      {
        name: 'array',
      },
    ],
    category: 'aggregation',
    description:
      "Returns the maximum number in an array of numbers.  It is an error if the input array contains an item which isn't a number.\n\n__Example__\n\n- `$max([5,1,3,7,4])` => `7`",
  },
  $min: {
    params: [
      {
        name: 'array',
      },
    ],
    category: 'aggregation',
    description:
      "Returns the minimum number in an array of numbers.  It is an error if the input array contains an item which isn't a number.\n\n__Example__\n\n- `$min([5,1,3,7,4])` => `1`",
  },
  $average: {
    params: [
      {
        name: 'array',
      },
    ],
    category: 'aggregation',
    description:
      "Returns the mean value of an array of numbers.  It is an error if the input array contains an item which isn't a number.\n\n__Example__\n\n- `$average([5,1,3,7,4])` => `4`",
  },
  $boolean: {
    params: [
      {
        name: 'arg',
      },
    ],
    category: 'boolean',
    description:
      'Casts the argument to a Boolean using the following rules:\n  \n| Argument type | Result |\n| ------------- | ------ |\n| Boolean | unchanged |\n| string: empty | `false`|\n| string: non-empty | `true` |\n| number: 0 | `false`|\n| number: non-zero | `true` |\n| null | `false`|\n| array: empty | `false` |\n| array: contains a member that casts to `true` |  `true` |\n| array: all members cast to `false` |  `false` |\n| object: empty | `false` |\n| object: non-empty | `true` |\n| function | `false` |',
  },
  $not: {
    params: [
      {
        name: 'arg',
      },
    ],
    category: 'boolean',
    description: 'Returns Boolean NOT on the argument.  `arg` is first cast to a boolean',
  },
  $exists: {
    params: [
      {
        name: 'arg',
      },
    ],
    category: 'boolean',
    description:
      'Returns Boolean `true` if the arg expression evaluates to a value, or `false` if the expression does not match anything (e.g. a path to a non-existent field reference).',
  },
  $count: {
    params: [
      {
        name: 'array',
      },
    ],
    category: 'array',
    description:
      'Returns the number of items in the `array` parameter.  If the `array` parameter is not an array, but rather a value of another JSON type, then the parameter is treated as a singleton array containing that value, and this function returns `1`.\n\nIf `array` is not specified, then the context value is used as the value of `array`.\n\n__Examples__\n- `$count([1,2,3,1])` => `4`\n- `$count("hello")` => 1',
  },
  $append: {
    params: [
      {
        name: 'array1',
      },
      {
        name: 'array2',
      },
    ],
    category: 'array',
    description:
      'Returns an array containing the values in `array1` followed by the values in `array2`.  If either parameter is not an array, then it is treated as a singleton array containing that value.\n\n__Examples__\n- `$append([1,2,3], [4,5,6])` => `[1,2,3,4,5,6]`\n- `$append([1,2,3], 4)` => `[1,2,3,4]`\n- `$append("Hello", "World")` => `["Hello", "World"]`',
  },
  $sort: {
    params: [
      {
        name: 'array',
      },
      {
        name: 'function',
        optional: true,
      },
    ],
    category: 'array',
    description:
      'Returns an array containing all the values in the `array` parameter, but sorted into order.  If no `function` parameter is supplied, then the `array` parameter must contain only numbers or only strings, and they will be sorted in order of increasing number, or increasing unicode codepoint respectively.\n\nIf a comparator `function` is supplied, then is must be a function that takes two parameters:\n\n`function(left, right)`\n\nThis function gets invoked by the sorting algorithm to compare two values `left` and `right`.  If the value of `left` should be placed after the value of `right` in the desired sort order, then the function must return Boolean `true` to indicate a swap.  Otherwise it must return `false`.\n\n__Example__\n```\n$sort(Account.Order.Product, function($l, $r) {\n  $l.Description.Weight > $r.Description.Weight\n})\n```\n\nThis sorts the products in order of increasing weight.\n\nThe sorting algorithm is *stable* which means that values within the original array which are the same according to the comparator function will remain in the original order in the sorted array.',
  },
  $reverse: {
    params: [
      {
        name: 'array',
      },
    ],
    category: 'array',
    description:
      'Returns an array containing all the values from the `array` parameter, but in reverse order.\n\n__Examples__\n- `$reverse(["Hello", "World"])` => `["World", "Hello"]`\n- `[1..5] ~> $reverse()` => `[5, 4, 3, 2, 1]`',
  },
  $shuffle: {
    params: [
      {
        name: 'array',
      },
    ],
    category: 'array',
    description:
      'Returns an array containing all the values from the `array` parameter, but shuffled into random order.\n\n__Examples__\n- `$shuffle([1..9])` => `[6, 8, 2, 3, 9, 5, 1, 4, 7]`',
  },
  $distinct: {
    params: [
      {
        name: 'array',
      },
    ],
    category: 'array',
    description:
      'Returns an array containing all the values from the `array` parameter, but with any duplicates removed.  Values are tested for deep equality as if by using the [equality operator](comparison-operators#equals).\n\n__Examples__\n- `$distinct([1,2,3,3,4,3,5])` => `[1, 2, 3, 4, 5]`\n- `$distinct(Account.Order.Product.Description.Colour)` => `[ "Purple", "Orange", "Black" ]`',
  },
  $zip: {
    params: [
      {
        name: 'array1',
      },
      {
        name: '...',
        variable: true,
      },
    ],
    category: 'array',
    description:
      'Returns a convolved (zipped) array containing grouped arrays of values from the `array1` ... `arrayN` arguments from index 0, 1, 2, etc.\n\nThis function accepts a variable number of arguments.  The length of the returned array is equal to the length of the shortest array in the arguments.\n\n__Examples__\n- `$zip([1,2,3], [4,5,6])` => `[[1,4] ,[2,5], [3,6]]`\n- `$zip([1,2,3],[4,5],[7,8,9])` => `[[1,4,7], [2,5,8]]`',
  },
  $keys: {
    params: [
      {
        name: 'object',
      },
    ],
    category: 'object',
    description:
      'Returns an array containing the keys in the object.  If the argument is an array of objects, then the array returned contains a de-duplicated list of all the keys in all of the objects.',
  },
  $lookup: {
    params: [
      {
        name: 'object',
      },
      {
        name: 'key',
      },
    ],
    category: 'object',
    description:
      'Returns the value associated with `key` in `object`. If the first argument is an array of objects, then all of the objects in the array are searched, and the values associated with all occurrences of `key` are returned.',
  },
  $spread: {
    params: [
      {
        name: 'object',
      },
    ],
    category: 'object',
    description:
      'Splits an `object` containing key/value pairs into an array of objects, each of which has a single key/value pair from the input `object`.  If the parameter is an array of objects, then the resultant array contains an object for every key/value pair in every object in the supplied array.',
  },
  $merge: {
    params: [
      {
        name: 'array<object>',
      },
    ],
    category: 'object',
    description:
      'Merges an array of objects into a single object containing all the key/value pairs from each of the objects in the input array.  If any of the input objects contain the same key, then the returned object will contain the value of the last one in the array.  It is an error if the input array contains an item that is not an object.',
  },
  $each: {
    params: [
      {
        name: 'object',
      },
      {
        name: 'function',
      },
    ],
    category: 'object',
    description:
      'Returns an array containing the values return by the `function` when applied to each key/value pair in the `object`.\n\nThe `function` parameter will get invoked with two arguments:\n\n`function(value, name)`\n\nwhere the `value` parameter is the value of each name/value pair in the object and `name` is its name.  The `name` parameter is optional.\n\n__Examples__\n\n`$each(Address, function($v, $k) {$k & ": " & $v})`\n\n=>\n\n    [\n      "Street: Hursley Park",\n      "City: Winchester",\n      "Postcode: SO21 2JN"\n    ]',
  },
  $error: {
    params: [
      {
        name: 'message',
      },
    ],
    category: 'object',
    description: 'Deliberately throws an error with an optional `message`',
  },
  $assert: {
    params: [
      {
        name: 'condition',
      },
      {
        name: 'message',
      },
    ],
    category: 'object',
    description:
      'If condition is true, the function returns undefined. If the condition is false, an exception is thrown with the message as the message of the exception.',
  },
  $type: {
    params: [
      {
        name: 'value',
      },
    ],
    category: 'object',
    description:
      'Evaluates the type of `value` and returns one of the following strings:\n* `"null"`\n* `"number"`\n* `"string"`\n* `"boolean"`\n* `"array"`\n* `"object"`\n* `"function"`\nReturns (non-string) `undefined` when `value` is `undefined`.',
  },
  $now: {
    params: [
      {
        name: 'picture',
        optional: true,
      },
      {
        name: 'timezone',
        optional: true,
      },
    ],
    category: 'date',
    description:
      'Generates a UTC timestamp in ISO 8601 compatible format and returns it as a string.  All invocations of `$now()` within an evaluation of an expression will all return the same timestamp value.\n\nIf the optional `picture` and `timezone` parameters are supplied, then the current timestamp is formatted as described by the [`$fromMillis()`](#frommillis) function.\n\n__Examples__\n\n- `$now()` => `"2017-05-15T15:12:59.152Z"`',
  },
  $millis: {
    params: [],
    category: 'date',
    description:
      'Returns the number of milliseconds since the Unix *Epoch* (1 January, 1970 UTC) as a number.  All invocations of `$millis()` within an evaluation of an expression will all return the same value.\n\n__Examples__  \n- `$millis()` => `1502700297574`',
  },
  $fromMillis: {
    params: [
      {
        name: 'number',
      },
      {
        name: 'picture',
        optional: true,
      },
      {
        name: 'timezone',
        optional: true,
      },
    ],
    category: 'date',
    description:
      'Convert the `number` representing milliseconds since the Unix *Epoch* (1 January, 1970 UTC) to a formatted string representation of the timestamp  as specified by the `picture` string.\n\nIf the optional `picture` parameter is omitted, then the timestamp is formatted in the [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html) format.\n\nIf the optional `picture` string is supplied, then the timestamp is formatted occording to the representation specified in that string.\nThe behaviour of this function is consistent with the two-argument version of the XPath/XQuery function [fn:format-dateTime](https://www.w3.org/TR/xpath-functions-31/#func-format-dateTime) as defined in the XPath F&O 3.1 specification.  The picture string parameter defines how the timestamp is formatted and has the [same syntax](https://www.w3.org/TR/xpath-functions-31/#date-picture-string) as fn:format-dateTime.\n\nIf the optional `timezone` string is supplied, then the formatted timestamp will be in that timezone.  The `timezone` string should be in the\nformat "±HHMM", where ± is either the plus or minus sign and HHMM is the offset in hours and minutes from UTC.  Positive offset for timezones\neast of UTC, negative offset for timezones west of UTC. \n\n__Examples__\n\n- `$fromMillis(1510067557121)` => `"2017-11-07T15:12:37.121Z"`\n- `$fromMillis(1510067557121, \'[M01]/[D01]/[Y0001] [h#1]:[m01][P]\')` => `"11/07/2017 3:12pm"`\n- `$fromMillis(1510067557121, \'[H01]:[m01]:[s01] [z]\', \'-0500\')` => `"10:12:37 GMT-05:00"`',
  },
  $toMillis: {
    params: [
      {
        name: 'timestamp',
      },
      {
        name: 'picture',
        optional: true,
      },
    ],
    category: 'date',
    description:
      'Convert a `timestamp` string to the number of milliseconds since the Unix *Epoch* (1 January, 1970 UTC) as a number. \n\nIf the optional `picture` string is not specified, then the format of the timestamp is assumed to be [ISO 8601](https://www.iso.org/iso-8601-date-and-time-format.html). An error is thrown if the string is not in the correct format.\n\nIf the `picture` string is specified, then the format is assumed to be described by this picture string using the [same syntax](https://www.w3.org/TR/xpath-functions-31/#date-picture-string) as the XPath/XQuery function [fn:format-dateTime](https://www.w3.org/TR/xpath-functions-31/#func-format-dateTime), defined in the XPath F&O 3.1 specification.  \n\n__Examples__\n\n- `$toMillis("2017-11-07T15:07:54.972Z")` => `1510067274972`',
  },
  $map: {
    params: [
      {
        name: 'array',
      },
      {
        name: 'function',
      },
    ],
    category: 'higher-order',
    description:
      'Returns an array containing the results of applying the `function` parameter to each value in the `array` parameter.\n\nThe function that is supplied as the second parameter must have the following signature:\n\n`function(value [, index [, array]])`\n\nEach value in the input array is passed in as the first parameter in the supplied function.  The index (position) of that value in the input array is passed in as the second parameter, if specified.  The whole input array is passed in as the third parameter, if specified.\n\n__Examples__\n- `$map([1..5], $string)` => `["1", "2", "3", "4", "5"]`\n\nWith user-defined (lambda) function:\n```\n$map(Email.address, function($v, $i, $a) {\n   \'Item \' & ($i+1) & \' of \' & $count($a) & \': \' & $v\n})\n```\n\nevaluates to:\n\n```\n[\n  "Item 1 of 4: fred.smith@my-work.com",\n  "Item 2 of 4: fsmith@my-work.com",\n  "Item 3 of 4: freddy@my-social.com",\n  "Item 4 of 4: frederic.smith@very-serious.com"\n]\n```',
  },
  $filter: {
    params: [
      {
        name: 'array',
      },
      {
        name: 'function',
      },
    ],
    category: 'higher-order',
    description:
      'Returns an array containing only the values in the `array` parameter that satisfy the `function` predicate (i.e. `function` returns Boolean `true` when passed the value).\n\nThe function that is supplied as the second parameter must have the following signature:\n\n`function(value [, index [, array]])`\n\nEach value in the input array is passed in as the first parameter in the supplied function.  The index (position) of that value in the input array is passed in as the second parameter, if specified.  The whole input array is passed in as the third parameter, if specified.\n\n__Example__\nThe following expression returns all the products whose price is higher than average:\n```\n$filter(Account.Order.Product, function($v, $i, $a) {\n  $v.Price > $average($a.Price)\n})\n```',
  },
  $single: {
    params: [
      {
        name: 'array',
      },
      {
        name: 'function',
      },
    ],
    category: 'higher-order',
    description:
      'Returns the one and only one value in the `array` parameter that satisfy the `function` predicate (i.e. `function` returns Boolean `true` when passed the value).  Throws an exception if the number of matching values is not exactly one.\n\nThe function that is supplied as the second parameter must have the following signature:\n\n`function(value [, index [, array]])`\n\nEach value in the input array is passed in as the first parameter in the supplied function.  The index (position) of that value in the input array is passed in as the second parameter, if specified.  The whole input array is passed in as the third parameter, if specified.\n\n__Example__\nThe following expression the product in the order whose SKU is `"0406654608"`:\n```\n$single(Account.Order.Product, function($v, $i, $a) {\n  $v.SKU = "0406654608"\n})\n```',
  },
  $reduce: {
    params: [
      {
        name: 'array',
      },
      {
        name: 'function',
      },
      {
        name: 'init',
        optional: true,
      },
    ],
    category: 'higher-order',
    description:
      'Returns an aggregated value derived from applying the `function` parameter successively to each value in `array` in combination with the result of the previous application of the function.\n\nThe `function` must accept at least two arguments, and behaves like an infix operator between each value within the `array`.  The signature of this supplied function must be of the form:\n\n`myfunc($accumulator, $value[, $index[, $array]])`\n\n__Example__\n\n```\n(\n  $product := function($i, $j){$i * $j};\n  $reduce([1..5], $product)\n)\n```\n\nThis multiplies all the values together in the array `[1..5]` to return `120`.\n\nIf the optional `init` parameter is supplied, then that value is used as the initial value in the aggregation (fold) process.  If not supplied, the initial value is the first value in the `array` parameter.',
  },
  $sift: {
    params: [
      {
        name: 'object',
      },
      {
        name: 'function',
      },
    ],
    category: 'higher-order',
    description:
      'Returns an object that contains only the key/value pairs from the `object` parameter that satisfy the predicate `function` passed in as the second parameter.\n\nIf `object` is not specified, then the context value is used as the value of `object`.  It is an error if `object` is not an object.\n\nThe function that is supplied as the second parameter must have the following signature:\n\n`function(value [, key [, object]])`\n\nEach value in the input object is passed in as the first parameter in the supplied function.  The key (property name) of that value in the input object is passed in as the second parameter, if specified.  The whole input object is passed in as the third parameter, if specified.\n\n__Example__\n\n```\nAccount.Order.Product.$sift(function($v, $k) {$k ~> /^Product/})\n```\n\nThis sifts each of the `Product` objects such that they only contain the fields whose keys start with the string "Product" (using a regex). This example returns:\n\n```\n[\n  {\n    "Product Name": "Bowler Hat",\n    "ProductID": 858383\n  },\n  {\n    "Product Name": "Trilby hat",\n    "ProductID": 858236\n  },\n  {\n    "Product Name": "Bowler Hat",\n    "ProductID": 858383\n  },\n  {\n    "ProductID": 345664,\n    "Product Name": "Cloak"\n  }\n]\n```',
  },
  $random: {
    params: [
      {
        name: 'seed',
        optional: true,
      },
    ],
    category: 'numeric',
    description:
      'Returns a pseudo random number greater than or equal to zero and less than one (`0 ≤ n < 1`)  The optional `seed` argument specifies a  seed to use. Note that if you use this function with the same seed value, it will return identical numbers.\n\n__Examples__  \n- `$random()` => `0.7973541067127`  \n- `$random()` => `0.4029142127028`  \n- `$random()` => `0.6558078550072`  \n- `$random(80)` => `0.7790078667647`  \n- `$random(80)` => `0.7790078667647`',
  },
  $partition: {
    params: [
      {
        name: 'array',
      },
      {
        name: 'size',
      },
    ],
    category: 'array',
    description:
      'Partitions the input array into chunks of the specified size. The last chunk may be smaller than the specified size if the input array length is not evenly divisible by the chunk size.\n\n**Examples**\n\n- `$partition([1, 2, 3, 4, 5], 2) => [[1, 2], [3, 4], [5]]`\n- `$partition([1, 2, 3, 4, 5], 1) => [[1], [2], [3], [4], [5]]`\n- `$partition([1, 2, 3, 4, 5], 5) => [[1, 2, 3, 4, 5]]`\n- `$partition([1, 2, 3, 4, 5], 6) => [[1, 2, 3, 4, 5]]`\n- `$partition([], 2) => []`',
  },
  $range: {
    params: [
      {
        name: 'start',
      },
      {
        name: 'stop',
      },
      {
        name: 'delta',
      },
    ],
    category: 'array',
    description:
      'Generates a new array containing a specific range of elements. The `start` and `end` parameters specify the inclusive start and exclusive end of the range, and the `delta` parameter specifies the increment between each element.\n\n**Examples**\n\n- `$range(0, 10, 1) => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]`\n- `$range(1, -5, -1) => [1, 0, -1, -2, -3, -4, -5]`\n- `$range(1, 9, 3) => [1, 4, 7]`\n- `$range(1, 1, 2) => [1]`\n- `$range(1, 9, 0) => []`',
  },
  $hash: {
    params: [
      {
        name: 'str',
      },
      {
        name: 'algorithm',
      },
    ],
    category: 'string',
    description:
      'Calculates the hash value of the input string using the specified hashing `algorithm`. The `algorithm` parameter can be one of `"MD5"`, `"SHA-1"`, `"SHA-256"`, `"SHA-384"`, or `"SHA-512"`.\n\n**Examples**\n\n- `$hash("input data", "SHA-1") => "aaff4a450a104cd177d28d18d7485e8cae074b7"`',
  },
  $uuid: {
    params: [],
    category: 'string',
    description:
      'Returns a randomly generated UUID version 4.\n\n**Examples**\n\n- `$uuid() => "ca4c1140-dcc1-40cd-ad05-7b4aa23df4a8"`',
  },
  $parse: {
    params: [
      {
        name: 'str',
      },
    ],
    category: 'object',
    description:
      'Deserializes the input JSON string.\n\n**Examples**\n\n- `$parse(\'{"foo": "bar"}\') => {"foo": "bar"}`',
  },
}

export const jsonataFunctions: JsonataFunctionsMap = new Map(Object.entries(jsonataFunctionsList))
