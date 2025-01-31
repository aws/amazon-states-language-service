/*!
 * Copyright 2025 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import {
  Asl,
  AslWithStates,
  DistributedMapState,
  getProcessorDefinition,
  isAslWithStates,
  isChoice,
  isMap,
  isParallel,
  isTerminal,
  NextOrEnd,
  StateDefinition,
  StateId,
} from './definitions'
import { lastItem } from '../utils/utils'

export type StateIdOrBranchIndex = StateId | number

/**
 * Path to a state.
 * Each item can be a key (string) or item index (number).
 */
export type StatePath = [] | [...StateIdOrBranchIndex[], StateId]

/**
 * Path to a branch.
 */
export type BranchPath = [] | StateIdOrBranchIndex[]

export type StateAddress<T extends StateDefinition = StateDefinition> = {
  state: T | null
  path: StatePath | null
  parent: AslWithStates<T> | null
  parentPath: BranchPath | null
}

export type LocatedState<T extends StateDefinition = StateDefinition> = {
  state: T
  parent: AslWithStates<T>
  path: StatePath
}

export const STATE_NOT_FOUND = { state: null, parent: null, path: null, parentPath: null }

/**
 * A function which is called for each state of an ASL.
 *
 * @return true to indicate visiting should continue, false to stop further visiting
 * @see {@link visitAllStates}.
 */
type StateVisitor<T extends StateDefinition> = (
  id: StateId,
  state: T,
  parent: AslWithStates<T>,
  path: StatePath,
) => boolean

/**
 * Visits all States in the given ASL and for each one calls fn with id, state and parent parameters.
 * When fn returns false the visiting stops.
 */
export function visitAllStates<T extends StateDefinition>(asl: Asl<T>, fn: StateVisitor<T>): void {
  if (asl.States) {
    visitAllStatesInBranch(asl, [], fn)
  }
}

/**
 * In the scope of an ASL searches for the given stateId and returns the state and the state's parent.
 * parent is the branch which contains the state (i.e. you can find the given id in parent.States).
 */
export function findStateById<T extends StateDefinition>(
  asl: Asl<T>,
  stateId: StateId,
  branchPath: BranchPath = [],
): StateAddress<T> {
  if (!isAslWithStates(asl)) {
    return STATE_NOT_FOUND
  }

  const state = asl.States[stateId]
  if (state) {
    return { state, parent: asl, parentPath: branchPath, path: [...branchPath, stateId] }
  }

  for (const [childStateId, childState] of Object.entries(asl.States)) {
    if (isMap(childState)) {
      const iteratorProcessor = getProcessorDefinition<T, DistributedMapState<T>>(childState as DistributedMapState<T>)

      const result = findStateById(iteratorProcessor, stateId, [...branchPath, childStateId])
      if (result.state != null) {
        return result
      }
    }

    if (isParallel<T>(childState) && childState.Branches) {
      for (let branchIndex = 0; branchIndex < childState.Branches.length; branchIndex++) {
        const branch = childState.Branches[branchIndex]
        const result = findStateById(branch, stateId, [...branchPath, childStateId, branchIndex])
        if (result.state != null) {
          return result
        }
      }
    }
  }

  return STATE_NOT_FOUND
}

/**
 * Returns all states which are children of the given stateId at any depth.
 */
export function getAllChildren(asl: Asl, stateId: StateId): StateId[] {
  const { state } = findStateById(asl, stateId)
  if (state === null) {
    return []
  }

  return getAllChildrenOfState(state)
}

function getAllChildrenOfState(state: StateDefinition | Asl): StateId[] {
  const result: StateId[] = []

  if ('States' in state && state.States) {
    for (const childId of Object.keys(state.States)) {
      result.push(childId)
      const childState: StateDefinition = state.States[childId]
      result.push(...getAllChildrenOfState(childState))
    }
  }

  if ('Branches' in state && state.Branches) {
    // parallel
    for (const branch of state.Branches) {
      result.push(...getAllChildrenOfState(branch))
    }
  }

  if ('Iterator' in state && state.Iterator) {
    result.push(...getAllChildrenOfState(state.Iterator))
  }

  if ('ItemProcessor' in state && state.ItemProcessor) {
    result.push(...getAllChildrenOfState(state.ItemProcessor))
  }

  return result
}

/**
 * Returns the state which is directly after the given one.
 * For ErrorHandled states it means the Next (or End) property as opposed to any Catches
 * For Choice it is Default or if missing the first choice rule's Next
 */
export function getDirectNext(state: StateDefinition): NextOrEnd {
  if (isTerminal(state)) {
    return null
  }

  if (isChoice(state)) {
    if (state.Default) {
      return state.Default
    }

    if (state.Choices && state.Choices.length >= 1) {
      return state.Choices[0].Next || null
    }

    return null
  }

  return state.Next || null
}

/**
 * Returns all the state ids anywhere in the given ASL.
 */
export function getAllStateIds(asl: Asl): StateId[] {
  const result: StateId[] = []
  visitAllStates(asl, (id) => {
    result.push(id)
    return true
  })
  return result
}

export function isParallelBranch(path: BranchPath | null): boolean {
  return path !== null && path.length > 1 && typeof lastItem(path) === 'number'
}

export function visitAllStatesInBranch<T extends StateDefinition>(
  parent: Asl<T>,
  partialPath: StateIdOrBranchIndex[],
  fn: StateVisitor<T>,
): boolean {
  if (isAslWithStates(parent)) {
    for (const [id, state] of Object.entries(parent.States)) {
      const path: StatePath = [...partialPath, id]
      // returning false indicates halting the visit to the rest
      const shouldContinueTheVisit = fn(id, state, parent, path)
      if (!shouldContinueTheVisit) {
        return false
      }

      if ('Iterator' in state && state.Iterator && state.Iterator.States) {
        const shouldContinue = visitAllStatesInBranch(state.Iterator as T, path, fn)
        if (!shouldContinue) {
          return false
        }
      }
      if ('ItemProcessor' in state && state.ItemProcessor && state.ItemProcessor.States) {
        const shouldContinue = visitAllStatesInBranch(state.ItemProcessor as T, path, fn)
        if (!shouldContinue) {
          return false
        }
      }

      if ('Branches' in state && state.Branches) {
        for (let branchIndex = 0; branchIndex < state.Branches.length; branchIndex++) {
          const branch = state.Branches[branchIndex]
          const shouldContinue = visitAllStatesInBranch(branch as T, [...path, branchIndex], fn)
          if (!shouldContinue) {
            return false
          }
        }
      }
    }
  }

  // true means continue visiting other states
  return true
}

/**
 * Get state ID given a branch path
 */
export function getStateIdFromBranchPath(path: BranchPath): StateId | undefined {
  for (let i = path.length - 1; i >= 0; i--) {
    const stateIdOrIndex = path[i]
    if (typeof stateIdOrIndex === 'string') {
      return stateIdOrIndex
    }
  }
}

/**
 * Get branch index given the branch name
 * @param branchName Branches[3]
 * @returns 3
 */
export function getBranchIndex(branchName: string): number | null {
  const pattern = /^Branches\[(\d+)\]$/
  const match = branchName.match(pattern)
  if (match) {
    return parseInt(match[1], 10)
  }
  return null
}
