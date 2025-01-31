/*!
 * Copyright 2025 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import { DistributedMapProcessingMode } from '../../asl/definitions'
import {
  getMapAsl,
  mockLocalScopeAsl,
  mockParallelAssign,
  mockChoiceAssignAsl,
  mockManualLoopAsl,
} from './assignVariableTestData'
import {
  VariableCompletionList,
  buildPreviousStatesMap,
  getAssignCompletionList,
  getCompletionStrings,
  getReservedVariables,
  GetReservedVariablesParams,
  getJSONataMacroContent,
} from '../autocomplete'

describe('autocomplete', () => {
  describe('getAssignCompletionList - Local Scope', () => {
    beforeAll(() => {
      buildPreviousStatesMap(mockLocalScopeAsl)
    })

    it('Should return empty list if stateId not exist', () => {
      const autocomplete = getAssignCompletionList(mockLocalScopeAsl, 'NotAState', 'NotAState')
      expect(autocomplete.localScope).toEqual({})
      expect(autocomplete.outerScope).toEqual({})
    })

    it('Should see nested object key in previous assigned variables', () => {
      const autocomplete = getAssignCompletionList(mockLocalScopeAsl, 'Lambda', 'Lambda')
      expect(autocomplete.localScope).toHaveProperty('var_nested.object.nestedObjectKey')
      expect(autocomplete.localScope).toHaveProperty('var_nested.array[0].key1')
    })

    it('Should not see variables assigned at current state and in states after current state', () => {
      const autocomplete = getAssignCompletionList(mockLocalScopeAsl, 'Lambda', 'Lambda')
      expect(autocomplete.localScope).not.toHaveProperty('var_lambda_pass')
      expect(autocomplete.localScope).not.toHaveProperty('var_lambda_error')
      expect(autocomplete.localScope).not.toHaveProperty('var_pass_success')
    })

    it('Should not see JSON_EDITING_PROPERTY', () => {
      const autocomplete = getAssignCompletionList(mockLocalScopeAsl, 'Lambda', 'Lambda')
      expect(autocomplete.localScope).not.toHaveProperty('ValueEnteredInForm')
    })

    it('Should see error assigned variables in error catcher and not default assign in fallback state', () => {
      const autocomplete = getAssignCompletionList(mockLocalScopeAsl, 'Pass_ErrorFallback', 'Pass_ErrorFallback')
      expect(autocomplete.localScope).toHaveProperty('var_pass_before')
      expect(autocomplete.localScope).toHaveProperty('var_lambda_error')
      expect(autocomplete.localScope).not.toHaveProperty('var_lambda_pass')
    })

    it('Should see default assign variables but not error catcher Assign variables in next state', () => {
      const autocomplete = getAssignCompletionList(mockLocalScopeAsl, 'Pass_Success', 'Pass_Success')
      expect(autocomplete.localScope).toHaveProperty('var_pass_before')
      expect(autocomplete.localScope).toHaveProperty('var_lambda_pass')
      expect(autocomplete.localScope).not.toHaveProperty('var_lambda_error')
    })

    it('Should see merge of assign variables for node with multiple previous nodes', () => {
      const autocomplete = getAssignCompletionList(mockLocalScopeAsl, 'Pass_End', 'Pass_End')
      expect(autocomplete.localScope).toHaveProperty('var_pass_before')
      expect(autocomplete.localScope).toHaveProperty('var_lambda_pass')
      expect(autocomplete.localScope).toHaveProperty('var_pass_success')
      expect(autocomplete.localScope).toHaveProperty('var_pass_error')
    })
  })

  describe('getAssignCompletionList - Choice state', () => {
    beforeAll(() => {
      buildPreviousStatesMap(mockChoiceAssignAsl)
    })

    it('Should see assigned variables from previous stasks as local scope', () => {
      const autocomplete = getAssignCompletionList(mockChoiceAssignAsl, 'Rule1-2', 'Rule1-2')
      expect(autocomplete.localScope).toHaveProperty('var_branch_1')
      expect(autocomplete.localScope).toHaveProperty('var_rule1')
      expect(autocomplete.localScope).toHaveProperty('var_pass_before')

      // will not see variable assigned in current state
      expect(autocomplete.localScope).not.toHaveProperty('var_branch_2')
      expect(autocomplete.outerScope).not.toHaveProperty('var_branch_2')
    })

    it('Should see assigned variables from default Assign for tasks in default choice rule', () => {
      const autocomplete = getAssignCompletionList(mockChoiceAssignAsl, 'Rule-default-1', 'Rule-default-1')

      expect(autocomplete.localScope).toHaveProperty('var_pass_before')
      expect(autocomplete.localScope).toHaveProperty('var_rule_default')
    })

    it('Should not see assigned variables from state after other choice rules if states are not connected', () => {
      const autocomplete = getAssignCompletionList(mockChoiceAssignAsl, 'Rule1-2', 'Rule1-2')
      expect(autocomplete.localScope).not.toHaveProperty('var_rule_default')
      expect(autocomplete.outerScope).not.toHaveProperty('var_rule_default')

      expect(autocomplete.localScope).not.toHaveProperty('var_default_1')
      expect(autocomplete.outerScope).not.toHaveProperty('var_default_1')
    })
  })

  describe('getAssignCompletionList - Map State', () => {
    const inlinedMapAsl = getMapAsl(DistributedMapProcessingMode.Inline)
    const distributedMapAsl = getMapAsl(DistributedMapProcessingMode.Distributed)

    it('Should only see local assigned variables in sub-workflows of distribued map state', () => {
      buildPreviousStatesMap(distributedMapAsl)
      const autocomplete = getAssignCompletionList(distributedMapAsl, 'Pass_SubWorkflow2', 'Pass_SubWorkflow2')
      expect(autocomplete.localScope).toHaveProperty('var_sub1')
      expect(autocomplete.outerScope).not.toHaveProperty('var_parent')
    })

    it('Should see local and outer scope assigned variables in sub-workflows of inlined map', () => {
      buildPreviousStatesMap(inlinedMapAsl)
      const autocomplete = getAssignCompletionList(inlinedMapAsl, 'Pass_SubWorkflow2', 'Pass_SubWorkflow2')
      expect(autocomplete.localScope).toHaveProperty('var_sub1')
      expect(autocomplete.outerScope).toHaveProperty('var_parent')

      // should not see assigned variables of current state
      expect(autocomplete.outerScope).not.toHaveProperty('var_sub2')
      expect(autocomplete.localScope).not.toHaveProperty('var_sub2')
    })

    /** variables will be assigned after sub-workflow finished */
    it('Should not see assigned variables of map state from sub-workflows', () => {
      const autocomplete = getAssignCompletionList(inlinedMapAsl, 'Pass_SubWorkflow2', 'Pass_SubWorkflow2')
      expect(autocomplete.outerScope).not.toHaveProperty('var_map')
    })
  })

  describe('getAssignCompletionList - Prallel State', () => {
    beforeAll(() => {
      buildPreviousStatesMap(mockParallelAssign)
    })

    it('Should see assigned variables in both local scope and outer scope from sub-workflows', () => {
      const autocomplete = getAssignCompletionList(mockParallelAssign, 'Branch1-2', 'Branch1-2')
      expect(autocomplete.outerScope).toHaveProperty('var_parent')
      expect(autocomplete.localScope).toHaveProperty('var_branch1_1')
    })

    it('Should not see assigned variables in parallel branch', () => {
      const autocomplete = getAssignCompletionList(mockParallelAssign, 'Branch1-2', 'Branch1-2')
      expect(autocomplete.outerScope).not.toHaveProperty('var_branch1_2')
      expect(autocomplete.localScope).not.toHaveProperty('var_branch1_2')
    })

    it('Should not see assigned variables of parallel state from sub-workflows', () => {
      const autocomplete = getAssignCompletionList(mockParallelAssign, 'Branch1-2', 'Branch1-2')
      expect(autocomplete.outerScope).not.toHaveProperty('var_parallel')
      expect(autocomplete.localScope).not.toHaveProperty('var_parallel')
    })
  })

  describe('getAssignCompletionList - Manual loop', () => {
    beforeAll(() => {
      buildPreviousStatesMap(mockManualLoopAsl)
    })

    it('Should not see variables from states in manual loop before manual loop', () => {
      const autocomplete = getAssignCompletionList(mockManualLoopAsl, 'Wait_BeforeLoop', 'Wait_BeforeLoop')
      expect(autocomplete.localScope).toEqual({})
      expect(autocomplete.outerScope).toEqual({})
    })

    it('Should see all variables from states in manual loop for a state in manual loop', () => {
      const autocomplete = getAssignCompletionList(mockManualLoopAsl, 'Pass_Before_Choice', 'Pass_Before_Choice')
      expect(autocomplete.localScope).toHaveProperty('var_default_1')
      expect(autocomplete.localScope).toHaveProperty('var_rule_default')

      expect(autocomplete.localScope).not.toHaveProperty('var_rule1')
      expect(autocomplete.localScope).not.toHaveProperty('var_branch_1')
    })

    it('Should see all variables from states in manual loop for state after manual loop', () => {
      const autocomplete = getAssignCompletionList(mockManualLoopAsl, 'Rule1-2', 'Rule1-2')
      expect(autocomplete.localScope).toHaveProperty('var_default_1')
      expect(autocomplete.localScope).toHaveProperty('var_rule_default')
      expect(autocomplete.localScope).toHaveProperty('var_pass_before')
      expect(autocomplete.localScope).toHaveProperty('var_rule1')
      expect(autocomplete.localScope).toHaveProperty('var_branch_1')
    })
  })

  describe('getReservedVariables', () => {
    it('Should get reserved variables in task input field', () => {
      const variable = getReservedVariables({
        stateType: 'Task',
      })
      expect(variable).toHaveProperty('states.input')
      expect(variable).toHaveProperty('states.context')
      expect(variable).not.toHaveProperty('states.errorOutput')
      expect(variable).not.toHaveProperty('states.result')
    })

    it('Should get error reserved variables in task error field', () => {
      const variable = getReservedVariables({
        stateType: 'Task',
        isError: true,
      })
      expect(variable).toHaveProperty('states.input')
      expect(variable).toHaveProperty('states.context')
      expect(variable).toHaveProperty('states.errorOutput')
      expect(variable).not.toHaveProperty('states.result')
    })

    it('Should get result reserved variables in task success field', () => {
      const variable = getReservedVariables({
        stateType: 'Task',
        isSuccess: true,
      })
      expect(variable).toHaveProperty('states.input')
      expect(variable).toHaveProperty('states.context')
      expect(variable).not.toHaveProperty('states.errorOutput')
      expect(variable).toHaveProperty('states.result')
    })

    it('Should get result reserved variables for map item selector field', () => {
      const variable = getReservedVariables({
        stateType: 'Task',
        isItemSelector: true,
      })
      expect(variable).toHaveProperty('states.input')
      expect(variable).toHaveProperty('states.context.Map')
      expect(variable).not.toHaveProperty('states.errorOutput')
      expect(variable).not.toHaveProperty('states.result')
    })
  })

  describe('getCompletionStrings', () => {
    const completionScope: VariableCompletionList = {
      localScope: {
        'innerVar.$': null,
        innerArray: [
          {
            arrayVal: null,
            arrayVal2: null,
          },
        ],
      },
      outerScope: {
        outerObject: {
          nestedVar: null,
          nestedVar2: null,
        },
      },
    }

    const reservedVariablesParams: GetReservedVariablesParams = {
      stateType: 'Task',
    }

    it('Should get a list of child property in nested object', () => {
      const completionStrings = getCompletionStrings({
        nodeVal: '$outerObject.n',
        completionScope,
        reservedVariablesParams,
      })
      expect(completionStrings.items).toContain('nestedVar')
      expect(completionStrings.items).toContain('nestedVar2')
      expect(completionStrings.parentPath).toEqual('outerObject')
    })

    it('Should get a list field name in root level when input is empty', () => {
      const completionStrings = getCompletionStrings({
        nodeVal: '',
        completionScope,
        reservedVariablesParams,
      })
      expect(completionStrings.items).toContain('$outerObject')
      expect(completionStrings.items).toContain('$innerVar')
      expect(completionStrings.items).toContain('$innerArray')
      expect(completionStrings.items).toContain('$states')
    })

    it('Should get a list field name for object inside an array', () => {
      const completionStrings = getCompletionStrings({
        nodeVal: '$innerArray[0].array',
        completionScope,
        reservedVariablesParams,
      })
      expect(completionStrings.parentPath).toEqual('innerArray[0]')
      expect(completionStrings.items).toContain('arrayVal')
      expect(completionStrings.items).toContain('arrayVal2')
    })

    it('Should get a list of child property in nested object', () => {
      const completionStrings = getCompletionStrings({
        nodeVal: '$outerObject.n',
        completionScope,
        reservedVariablesParams,
      })
      expect(completionStrings.items).toContain('nestedVar')
      expect(completionStrings.items).toContain('nestedVar2')
      expect(completionStrings.parentPath).toEqual('outerObject')
    })
  })

  describe('getJSONataMacroContent', () => {
    it('should return null if text is a JSONata expression', () => {
      const result = getJSONataMacroContent('{%%}')
      expect(result).toBeNull()
    })

    it.each(['arn:aws', 'Hello world', '1'])('should return null if text is %s', (text) => {
      const result = getJSONataMacroContent(text)
      expect(result).toBeNull()
    })

    it('should return null if text is valid JSON', () => {
      const result = getJSONataMacroContent(JSON.stringify({ a: 1 }))
      expect(result).toBeNull()
    })

    it('should return null if text includes new lines', () => {
      const result = getJSONataMacroContent('{\n"text"}')
      expect(result).toBeNull()
    })

    it('should return macro content for {%', () => {
      const result = getJSONataMacroContent('{%')
      expect(result).toMatchInlineSnapshot(`
{
  "content": "",
  "isTypo": false,
}
`)
    })

    it('should return macro content for "    {%"', () => {
      const result = getJSONataMacroContent('    {%')
      expect(result).toMatchInlineSnapshot(`
{
  "content": "",
  "isTypo": false,
}
`)
    })

    it('should return macro content for {%%', () => {
      const result = getJSONataMacroContent('{%%')
      expect(result).toMatchInlineSnapshot(`
{
  "content": "",
  "isTypo": false,
}
`)
    })

    it('should return macro content for "{%   %}   "', () => {
      const result = getJSONataMacroContent('{%   %}   ')
      expect(result).toMatchInlineSnapshot(`
{
  "content": "   ",
  "isTypo": false,
}
`)
    })

    it('should return macro content for {% $states.', () => {
      const result = getJSONataMacroContent('{% $states.')
      expect(result).toMatchInlineSnapshot(`
{
  "content": " $states.",
  "isTypo": false,
}
`)
    })

    it('should return macro content for %', () => {
      const result = getJSONataMacroContent('%')
      expect(result).toMatchInlineSnapshot(`
{
  "content": "",
  "isTypo": true,
}
`)
    })

    it('should return macro content for %{', () => {
      const result = getJSONataMacroContent('%{')
      expect(result).toMatchInlineSnapshot(`
{
  "content": "",
  "isTypo": true,
}
`)
    })

    it('should return macro content for "   %{"', () => {
      const result = getJSONataMacroContent('   %{')
      expect(result).toMatchInlineSnapshot(`
{
  "content": "",
  "isTypo": true,
}
`)
    })

    it('should return macro content for "%{ $states. }%"', () => {
      const result = getJSONataMacroContent('%{ $states. }%')
      expect(result).toMatchInlineSnapshot(`
{
  "content": " $states. ",
  "isTypo": true,
}
`)
    })

    it('should return macro content for "{%   %}   "', () => {
      const result = getJSONataMacroContent('{%   %}   ')
      expect(result).toMatchInlineSnapshot(`
{
  "content": "   ",
  "isTypo": false,
}
`)
    })

    it('should return macro content for %{ $states.', () => {
      const result = getJSONataMacroContent('%{ $states.')
      expect(result).toMatchInlineSnapshot(`
{
  "content": " $states.",
  "isTypo": true,
}
`)
    })

    it('should return macro content for %}%', () => {
      const result = getJSONataMacroContent('%}%')
      expect(result).toMatchInlineSnapshot(`
{
  "content": "",
  "isTypo": true,
}
`)
    })
  })
})
