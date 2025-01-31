/*!
 * Copyright 2025 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

export type JSONataExpression = string

/**
 * Reference to a state to be used as Next. If null then pointer to End.
 */
export type NextOrEnd = StateId | null

export enum QueryLanguages {
  JSONPath = 'JSONPath',
  JSONata = 'JSONata',
}

export interface Asl<T extends StateDefinition = StateDefinition> {
  Comment?: string
  Version?: string
  TimeoutSeconds?: number | JSONataExpression

  StartAt?: StateId
  States?: StatesSet<T>
  QueryLanguage?: QueryLanguages
}

export enum StateMachineType {
  Standard = 'STANDARD',
  Express = 'EXPRESS',
}

/**
 * An {@link Asl} which is guaranteed to have States property.
 * It is used to reduce the number of null checks and unit tests branches to cover the null checks and replace them with
 * more elegant compile-time checks.
 */
export interface AslWithStates<T extends StateDefinition = StateDefinition> extends Asl<T> {
  States: StatesSet<T>
}

export type StateType =
  | 'Pass'
  | 'Wait'
  | 'Task'
  | 'Succeed'
  | 'Fail'
  | 'Choice'
  | 'Map'
  | 'Parallel'
  | 'Placeholder'
  | 'Snippet'

export type StatesSet<T extends StateDefinition = StateDefinition> = { [id: string]: T }
export type StateId = string

export type JsonPrimitive = null | string | number | boolean | JSONataExpression
export type JsonArray = (JsonPrimitive | JsonMap | JsonArray)[]
export type JsonMap = { [key: string]: JsonObject }
export type JsonObject = JsonMap | JsonArray | JsonPrimitive

export interface BaseState {
  Type: StateType
  Comment?: string
  InputPath?: string | null
  OutputPath?: string | null
  Output?: JsonMap
  ResultPath?: string | null
  ResultSelector?: JsonObject
  QueryLanguage?: QueryLanguages
}

export enum StatePointers {
  Next = 'Next',
  End = 'End',
}

export interface StatePointer {
  [StatePointers.Next]?: StateId
  [StatePointers.End]?: boolean
}

export interface PassState extends StatePointer, WithParametersBase, VariableBase, BaseState {
  Type: 'Pass'
  Result?: JsonObject
}

export interface WaitState extends StatePointer, BaseState, VariableBase {
  Type: 'Wait'
  Seconds?: number | JSONataExpression
  SecondsPath?: string
  Timestamp?: string
  TimestampPath?: string
}

export interface DeprecatedMapState<T extends StateDefinition = StateDefinition>
  extends ErrorHandledBase,
    StatePointer,
    WithParametersBase,
    VariableBase,
    BaseState {
  Type: 'Map'
  Iterator?: Asl<T>
  ItemsPath?: string
  Items?: JSONataExpression | JsonArray
  MaxConcurrency?: number | JSONataExpression
}

/**
 * A {@link DeprecatedMapState} which is guaranteed to have Branches property.
 * {@see AslWith}
 */
export interface DeprecatedMapWithIterator<T extends StateDefinition = StateDefinition> extends DeprecatedMapState<T> {
  Iterator: Asl<T>
}

export interface ItemBatcher {
  BatchInput: {
    [item: string]: any
  }
  MaxItemsPerBatch?: number | JSONataExpression
  MaxInputBytesPerBatch?: number | JSONataExpression
  MaxItemsPerBatchPath?: string
  MaxInputBytesPerBatchPath?: string
}

export interface ResultWriter {
  Resource: string
  Parameters?: {
    Bucket?: string
    Key?: string
    Prefix?: string
    'Bucket.$'?: string
    'Key.$'?: string
    'Prefix.$'?: string
  }
  Arguments?:
    | {
        Bucket?: string
        Key?: string
        Prefix?: string
        ExpectedBucketOwner?: string
      }
    | JSONataExpression
}

export interface ItemReader {
  ReaderConfig?: {
    InputType?: ParsingInputType
    CSVHeaderLocation?: CSVHeaderLocationType
    MaxItems?: number | JSONataExpression
    MaxItemsPath?: string
    CSVHeaders?: string[]
  }
  Resource?: string
  Parameters?: {
    Bucket?: string
    Key?: string
    Prefix?: string
    ExpectedBucketOwner?: string
    'Bucket.$'?: string
    'Key.$'?: string
    'Prefix.$'?: string
    'ExpectedBucketOwner.$'?: string
  }
  Arguments?:
    | {
        Bucket?: string
        Key?: string
        Prefix?: string
        ExpectedBucketOwner?: string
      }
    | JSONataExpression
}

export enum DistributedMapProcessingMode {
  Distributed = 'DISTRIBUTED',
  Inline = 'INLINE',
}
export enum MapExecutionType {
  Express = 'EXPRESS',
  Standard = 'STANDARD',
}

export enum ParsingInputType {
  CSV = 'CSV',
  JSON = 'JSON',
  MANIFEST = 'MANIFEST',
}

export enum CSVHeaderLocationType {
  FIRST_ROW = 'FIRST_ROW',
  GIVEN = 'GIVEN',
}

export interface ProcessorConfig {
  Mode: DistributedMapProcessingMode
  ExecutionType?: MapExecutionType
}

export type ItemProcessor<T extends StateDefinition> = Asl<T> & { ProcessorConfig?: ProcessorConfig }

export const isInlineMap = (state: DistributedMapState): boolean => {
  return (
    getProcessorDefinition(state).ProcessorConfig === undefined ||
    getProcessorDefinition(state).ProcessorConfig?.Mode === DistributedMapProcessingMode.Inline
  )
}

export interface DistributedMapStateItemProcessor<T extends StateDefinition = StateDefinition>
  extends ErrorHandledBase,
    StatePointer,
    BaseState,
    VariableBase {
  Type: 'Map'
  ItemProcessor: ItemProcessor<T>
  ItemBatcher?: ItemBatcher
  ItemReader?: ItemReader
  ResultWriter?: ResultWriter
  ItemsPath?: string
  Items?: JSONataExpression | JsonArray
  ItemSelector?: Record<string, any>
  Parameters?: Record<string, any>
  MaxConcurrency?: number | JSONataExpression
  ToleratedFailurePercentage?: number | JSONataExpression
  ToleratedFailureCount?: number | JSONataExpression
  Label?: string
  'Label.$'?: string
}
export interface DistributedMapStateIterator<T extends StateDefinition = StateDefinition>
  extends ErrorHandledBase,
    StatePointer,
    BaseState,
    VariableBase {
  Type: 'Map'
  Iterator: ItemProcessor<T>
  ItemBatcher?: ItemBatcher
  ItemReader?: ItemReader
  ResultWriter?: ResultWriter
  ItemsPath?: string
  Items?: JSONataExpression | JsonArray
  ItemSelector?: Record<string, any>
  Parameters?: Record<string, any>
  MaxConcurrency?: number | JSONataExpression
  ToleratedFailurePercentage?: number | JSONataExpression
  ToleratedFailureCount?: number | JSONataExpression
  Label?: string
  'Label.$'?: string
}
export const isDistributedMapStateItemProcessor = <T extends StateDefinition>(
  distributedMap: DistributedMapState<T>,
): distributedMap is DistributedMapStateItemProcessor<T> => {
  return (distributedMap as DistributedMapStateItemProcessor).ItemProcessor !== undefined
}
export const getProcessorDefinition = <T extends StateDefinition, V extends DistributedMapState<T>>(
  distributedMap: V,
): ItemProcessor<T> => {
  if (isDistributedMapStateItemProcessor(distributedMap)) {
    return distributedMap.ItemProcessor
  } else {
    return distributedMap.Iterator
  }
}

export const getProcessorFieldName = <T extends StateDefinition, V extends DistributedMapState<T>>(
  distributedMap: V,
): string => {
  if ('Iterator' in distributedMap) {
    return 'Iterator'
  } else {
    return 'ItemProcessor'
  }
}

export const getItemSelectorDefinition = <T extends StateDefinition, V extends DistributedMapState<T>>(
  distributedMap: V,
): Record<string, any> | undefined => {
  if ('Parameters' in distributedMap) {
    return distributedMap.Parameters
  } else {
    return distributedMap.ItemSelector
  }
}

export const getItemSelectorFieldName = <T extends StateDefinition, V extends DistributedMapState<T>>(
  distributedMap: V,
): string => {
  if ('Parameters' in distributedMap) {
    return 'Parameters'
  } else {
    return 'ItemSelector'
  }
}

export type DistributedMapState<T extends StateDefinition = StateDefinition> =
  | DistributedMapStateItemProcessor<T>
  | DistributedMapStateIterator<T>
export type MapState =
  | DeprecatedMapState<StateDefinition>
  | DistributedMapStateItemProcessor<StateDefinition>
  | DistributedMapStateIterator<StateDefinition>

export interface ParallelState<T extends StateDefinition = StateDefinition>
  extends ErrorHandledBase,
    StatePointer,
    WithParametersBase,
    VariableBase,
    BaseState {
  Type: 'Parallel'
  Branches?: Asl<T>[]
  ResultPath?: string
}

/**
 * A {@link ParallelState} which is guaranteed to have Branches property.
 * {@see AslWith}
 */
export interface ParallelWithBranches<T extends StateDefinition = StateDefinition> extends ParallelState<T> {
  Branches: Asl<T>[]
}

export interface ChoiceState extends BaseState, VariableBase {
  Type: 'Choice'
  Choices?: ChoiceRule[]
  Default?: StateId
}

/**
 * A {@link ChoiceState} which is guaranteed to have Choices property.
 * {@see AslWith}
 */
export interface ChoiceWithChoices extends ChoiceState {
  Choices: ChoiceRule[]
}

export interface Comparison {
  Variable?: string

  BooleanEquals?: boolean
  BooleanEqualsPath?: string

  IsBoolean?: boolean
  IsNull?: boolean
  IsNumeric?: boolean
  IsPresent?: boolean
  IsString?: boolean
  IsTimestamp?: boolean

  NumericEquals?: number
  NumericEqualsPath?: string
  NumericGreaterThan?: number
  NumericGreaterThanPath?: string
  NumericGreaterThanEquals?: number
  NumericGreaterThanEqualsPath?: string
  NumericLessThan?: number
  NumericLessThanPath?: string
  NumericLessThanEquals?: number
  NumericLessThanEqualsPath?: string

  StringEquals?: string
  StringEqualsPath?: string
  StringGreaterThan?: string
  StringGreaterThanPath?: string
  StringGreaterThanEquals?: string
  StringGreaterThanEqualsPath?: string
  StringLessThan?: string
  StringLessThanPath?: string
  StringLessThanEquals?: string
  StringLessThanEqualsPath?: string

  StringMatches?: string

  TimestampEquals?: string
  TimestampEqualsPath?: string
  TimestampGreaterThan?: string
  TimestampGreaterThanPath?: string
  TimestampGreaterThanEquals?: string
  TimestampGreaterThanEqualsPath?: string
  TimestampLessThan?: string
  TimestampLessThanPath?: string
  TimestampLessThanEquals?: string
  TimestampLessThanEqualsPath?: string

  Not?: Comparison
  And?: Comparison[]
  Or?: Comparison[]
}

export type ChoiceRule = ChoiceRuleV1 | ChoiceRuleV2
export interface ChoiceRuleV1 extends Rule, Comparison, VariableBase {
  Next?: StateId
}

export interface ChoiceRuleV2 extends Rule, VariableBase {
  Condition?: boolean | JSONataExpression
  Next?: StateId
}

export interface VariableBase {
  Assign?: JsonMap
}

export interface WithParametersBase {
  Parameters?: JsonObject
  Arguments?: JsonObject
}

export type WithParameters = TaskState | DeprecatedMapState | ParallelState | PassState
export type WithVariables = PassState | WaitState | TaskState | ChoiceState | MapState | ParallelState
export type WithErrorHandled = TaskState | MapState | ParallelState

export interface TaskState extends ErrorHandledBase, StatePointer, WithParametersBase, VariableBase, BaseState {
  Type: 'Task'
  Resource?: string
  ResultPath?: string | null
  OutputPath?: string | null
  TimeoutSeconds?: number | JSONataExpression
  HeartbeatSeconds?: number | JSONataExpression
  TimeoutSecondsPath?: string
  HeartbeatSecondsPath?: string
  Credentials?: {
    RoleArn?: string
    'RoleArn.$'?: string
  }
  RateControl?: {
    Arn?: string
    'Arn.$'?: string
  }
}

export type TerminalState = SucceedState | FailState
export interface SucceedState extends BaseState {
  Type: 'Succeed'
}

export interface FailState extends BaseState {
  Type: 'Fail'
  Cause?: string
  Error?: string | null
  ErrorPath?: string
  CausePath?: string
}

export interface PlaceholderState extends StatePointer, BaseState {
  Type: 'Placeholder'
  PlaceholderLabel: string
}

export type StateDefinition =
  | PassState
  | WaitState
  | TaskState
  | SucceedState
  | FailState
  | ChoiceState
  | MapState
  | ParallelState
  | PlaceholderState

export type NonTerminalState =
  | PassState
  | WaitState
  | TaskState
  | ChoiceState
  | MapState
  | ParallelState
  | PlaceholderState

export type StateWithPointer = Required<StatePointer>

export interface Commented {
  Comment?: string
}

export type Rule = Commented

export interface ErrorRule extends Rule {
  ErrorEquals?: string[]
}

export interface ErrorHandledBase {
  Catch?: CatchRule[]
  Retry?: RetryRule[]
}

export type ErrorHandled = TaskState | MapState | ParallelState

export interface CatchRule extends StatePointer, ErrorRule, VariableBase {
  ResultPath?: string | null
  Output?: JsonMap
}

export interface RetryRule extends ErrorRule {
  IntervalSeconds?: number
  MaxAttempts?: number
  BackoffRate?: number
  JitterStrategy?: string
  MaxDelaySeconds?: number
}

// type guards

export function isPass(state: StateDefinition): state is PassState {
  return state.Type === 'Pass'
}

export function isTerminal(state: StateDefinition): state is TerminalState {
  return state.Type === 'Succeed' || state.Type === 'Fail'
}

export function isNonTerminal(state: StateDefinition): state is NonTerminalState {
  return !isTerminal(state)
}

export function isWait(state: StateDefinition): state is WaitState {
  return state.Type === 'Wait'
}

export function isFail(state: StateDefinition): state is FailState {
  return state.Type === 'Fail'
}

export function isSucceed(state: StateDefinition): state is SucceedState {
  return state.Type === 'Succeed'
}

export function isTask(state: StateDefinition): state is TaskState {
  return state.Type === 'Task'
}

export function isChoice(state: StateDefinition): state is ChoiceState {
  return state.Type === 'Choice'
}

export function isMap(state: StateDefinition): state is MapState {
  return state.Type === 'Map'
}

export function isDistributedMap(state: StateDefinition): state is DistributedMapState {
  return isMap(state)
}

export function isDistributedMode(state: DistributedMapState): boolean {
  return getProcessorDefinition(state).ProcessorConfig?.Mode === DistributedMapProcessingMode.Distributed
}

export function isParallel<T extends StateDefinition = StateDefinition>(
  state: StateDefinition,
): state is ParallelState<T> {
  return state.Type === 'Parallel'
}

export function isPlaceholder(state: StateDefinition): state is PlaceholderState {
  return state.Type === 'Placeholder'
}

export function isValidStateType(state: StateDefinition): boolean {
  return (
    isWait(state) ||
    isFail(state) ||
    isSucceed(state) ||
    isPass(state) ||
    isChoice(state) ||
    isTask(state) ||
    isMap(state) ||
    isParallel(state)
  )
}

export function isErrorHandled<T extends ErrorHandled = ErrorHandled>(state: StateDefinition): state is T {
  return state.Type === 'Task' || state.Type === 'Map' || state.Type === 'Parallel'
}

export function isWithParameters(state: StateDefinition): state is WithParameters {
  return state.Type === 'Task' || state.Type === 'Map' || state.Type === 'Parallel' || state.Type === 'Pass'
}

export function isJsonMap(obj: any): obj is JsonMap {
  return typeof obj === 'object' && !Array.isArray(obj) && obj !== null
}

export function isAslWithStates<T extends StateDefinition = StateDefinition>(
  asl: Asl<T> | undefined | null,
): asl is AslWithStates<T> {
  return !!asl && !!asl.States && typeof asl.States === 'object' && !Array.isArray(asl.States)
}

export function isChoiceWithChoices<T extends ChoiceWithChoices = ChoiceWithChoices>(
  state: StateDefinition | undefined | null,
): state is T {
  return !!state && state.Type === 'Choice' && !!state.Choices && Array.isArray(state.Choices)
}

export function isMapWithIterator(state: StateDefinition | undefined | null): state is DeprecatedMapWithIterator {
  return (
    !!state &&
    state.Type === 'Map' &&
    !!(state as DeprecatedMapState).Iterator &&
    typeof (state as DeprecatedMapState).Iterator === 'object' &&
    !Array.isArray((state as DeprecatedMapState).Iterator)
  )
}

export function isParallelWithBranches(state: StateDefinition | undefined | null): state is ParallelWithBranches {
  return !!state && state.Type === 'Parallel' && !!state.Branches && Array.isArray(state.Branches)
}

export function isWithVariables(state: StateDefinition): state is WithVariables {
  return ['Task', 'Map', 'Pass', 'Parallel', 'Choice', 'Wait'].includes(state.Type)
}

export function isWithErrorHandled(state: StateDefinition): state is WithErrorHandled {
  return ['Task', 'Map', 'Parallel'].includes(state.Type)
}
