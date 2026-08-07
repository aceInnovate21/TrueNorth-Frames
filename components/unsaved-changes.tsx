'use client'

/**
 * Unsaved-changes guard system.
 *
 * The photographer dashboard has many independent "Save" surfaces (profile
 * settings sections, the booking-availability calendar, the weekly time-slot
 * scheduler). Each edits local state that only persists once the photographer
 * clicks its Save button. If they switch tabs — or leave the page — before
 * saving, their edits are silently lost.
 *
 * This module lets any editing surface register a lightweight "guard" that
 * exposes whether it currently holds unsaved changes, plus how to save or
 * discard them. A parent (the dashboard shell) can then check all guards
 * before navigating and, if anything is dirty, prompt the user to Save,
 * Discard, or Cancel.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react'

export interface UnsavedGuard {
  /** True when this surface holds edits that have not been persisted. */
  isDirty: () => boolean
  /** Persist the pending edits. Resolves once the save completes. */
  save: () => Promise<void>
  /** Throw away the pending edits, reverting to the last saved state. */
  discard: () => void
}

interface UnsavedChangesContextValue {
  registerGuard: (id: string, guard: UnsavedGuard) => void
  unregisterGuard: (id: string) => void
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null)

/**
 * Owns the registry of guards. Call this once in the dashboard shell, spread
 * `contextValue` into the provider, and use `getDirtyGuards` when navigating.
 */
export function useUnsavedChangesRegistry() {
  const guards = useRef<Map<string, UnsavedGuard>>(new Map())

  const registerGuard = useCallback((id: string, guard: UnsavedGuard) => {
    guards.current.set(id, guard)
  }, [])

  const unregisterGuard = useCallback((id: string) => {
    guards.current.delete(id)
  }, [])

  /** All currently-registered guards that report unsaved changes. */
  const getDirtyGuards = useCallback(
    () => Array.from(guards.current.values()).filter(g => g.isDirty()),
    [],
  )

  const hasUnsavedChanges = useCallback(() => getDirtyGuards().length > 0, [getDirtyGuards])

  const contextValue = useMemo<UnsavedChangesContextValue>(
    () => ({ registerGuard, unregisterGuard }),
    [registerGuard, unregisterGuard],
  )

  return { contextValue, getDirtyGuards, hasUnsavedChanges }
}

export const UnsavedChangesProvider = UnsavedChangesContext.Provider

/**
 * Register an editing surface's guard. The guard is always read through a ref
 * so `isDirty`/`save`/`discard` see the latest closure values without needing
 * to re-register on every render. No-ops when used outside a provider.
 */
export function useUnsavedGuard(id: string, guard: UnsavedGuard) {
  const ctx = useContext(UnsavedChangesContext)
  const guardRef = useRef(guard)
  guardRef.current = guard

  useEffect(() => {
    if (!ctx) return
    ctx.registerGuard(id, {
      isDirty: () => guardRef.current.isDirty(),
      save: () => guardRef.current.save(),
      discard: () => guardRef.current.discard(),
    })
    return () => ctx.unregisterGuard(id)
  }, [id, ctx])
}
