import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { useApi, useUi } from '@pitcher/js-api'
import type { PitcherEnv, CanvasData, CrmQueryResult } from '@/lib/types'

interface PitcherApi {
  getEnv: () => Promise<PitcherEnv>
  crmQuery: <T = Record<string, unknown>>(params: { query: string }) => Promise<CrmQueryResult<T>>
  toast: (payload: { type: 'success' | 'error' | 'info'; message: string }) => Promise<void>
  getAppConfig: (params: { app_name: string }) => Promise<Record<string, unknown>>
}

interface PitcherUiApi {
  appLoaded: () => void
  onAppSetData: (callback: (data: CanvasData) => void) => Promise<void>
  onAppUpdateData: (callback: (data: CanvasData) => void) => Promise<void>
  updateCanvas: (params: { id: string; context: Record<string, unknown> }) => Promise<void>
}

interface PitcherContextType {
  api: PitcherApi | null
  uiApi: PitcherUiApi | null
  env: PitcherEnv | null
  canvasData: CanvasData | null
  accountId: string | null
  isLoading: boolean
  isEditMode: boolean
  crmQuery: <T = Record<string, unknown>>(query: string) => Promise<T[]>
  updateCanvasContext: (context: Record<string, unknown>) => Promise<void>
  showToast: (type: 'success' | 'error' | 'info', message: string) => Promise<void>
}

// Color utility functions
function adjustColorBrightness(color: string, percent: number): string {
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  const newR = Math.max(0, Math.min(255, r + (r * percent) / 100))
  const newG = Math.max(0, Math.min(255, g + (g * percent) / 100))
  const newB = Math.max(0, Math.min(255, b + (b * percent) / 100))

  return (
    '#' +
    Math.round(newR).toString(16).padStart(2, '0') +
    Math.round(newG).toString(16).padStart(2, '0') +
    Math.round(newB).toString(16).padStart(2, '0')
  )
}

function hexToRgb(hex: string): string {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

function applyThemeColor(color: string) {
  const root = document.documentElement
  root.style.setProperty('--primary', color)
  root.style.setProperty('--primary-hover', adjustColorBrightness(color, -10))
  root.style.setProperty('--primary-focus', adjustColorBrightness(color, -20))
  root.style.setProperty('--primary-rgb', hexToRgb(color))
}

export const PitcherContext = createContext<PitcherContextType | undefined>(undefined)

export const usePitcher = () => {
  const context = useContext(PitcherContext)
  if (!context) {
    throw new Error('usePitcher must be used within a PitcherProvider')
  }
  return context
}

export const PitcherProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // Use the hooks from @pitcher/js-api
  const apiRef = useRef(useApi() as unknown as PitcherApi)
  const uiApiRef = useRef(useUi() as unknown as PitcherUiApi)

  const [env, setEnv] = useState<PitcherEnv | null>(null)
  const [canvasData, setCanvasData] = useState<CanvasData | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)

  // CRM Query wrapper
  const crmQuery = useCallback(async <T = Record<string, unknown>>(query: string): Promise<T[]> => {
    if (!apiRef.current) {
      console.warn('[PitcherProvider] API not initialized, returning empty array')
      return []
    }
    try {
      const result = await apiRef.current.crmQuery<T>({ query })
      return result.records
    } catch (error) {
      console.error('[PitcherProvider] CRM Query failed:', error)
      throw error
    }
  }, [])

  // Update canvas context
  const updateCanvasContext = useCallback(async (context: Record<string, unknown>) => {
    if (!uiApiRef.current || !canvasData?.canvas?.id) {
      console.warn('[PitcherProvider] Cannot update canvas - not initialized')
      return
    }
    await uiApiRef.current.updateCanvas({
      id: canvasData.canvas.id,
      context,
    })
  }, [canvasData?.canvas?.id])

  // Show toast notification
  const showToast = useCallback(async (type: 'success' | 'error' | 'info', message: string) => {
    if (!apiRef.current) {
      console.log(`[Toast] ${type}: ${message}`)
      return
    }
    await apiRef.current.toast({ type, message })
  }, [])

  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      try {
        const api = apiRef.current
        const uiApi = uiApiRef.current

        // Get environment
        const pitcherEnv = await api.getEnv()
        if (!isMounted) return

        setEnv(pitcherEnv)

        // Apply instance theme color
        if (pitcherEnv?.pitcher?.instance?.color) {
          applyThemeColor(pitcherEnv.pitcher.instance.color)
        }

        // Listen for canvas data
        await uiApi.onAppSetData((data) => {
          if (!isMounted) return
          console.log('[PitcherProvider] Received canvas data:', JSON.stringify(data, null, 2))
          setCanvasData(data)
          setIsEditMode(data.is_edit_mode ?? false)

          // Extract account ID from various possible locations in canvas context
          const accId =
            data.canvas?.account?.id ||
            data.canvas?.context?.account_id ||
            data.canvas?.context?.accountId ||
            data.context?.account_id ||
            data.context?.accountId ||
            data.account_id ||
            data.accountId
          console.log('[PitcherProvider] Extracted account ID:', accId)
          if (accId) {
            setAccountId(accId as string)
          }
        })

        // Listen for updates
        await uiApi.onAppUpdateData((data) => {
          if (!isMounted) return
          console.log('[PitcherProvider] Canvas data updated:', JSON.stringify(data, null, 2))
          setCanvasData(data)
          setIsEditMode(data.is_edit_mode ?? false)

          // Extract account ID from various possible locations
          const accId =
            data.canvas?.account?.id ||
            data.canvas?.context?.account_id ||
            data.canvas?.context?.accountId ||
            data.context?.account_id ||
            data.context?.accountId ||
            data.account_id ||
            data.accountId
          if (accId) {
            setAccountId(accId as string)
          }
        })

        // Signal app is ready
        uiApi.appLoaded()
        setIsLoading(false)
      } catch (error) {
        console.error('[PitcherProvider] Initialization failed:', error)
        setIsLoading(false)
      }
    }

    initialize()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <PitcherContext.Provider
      value={{
        api: apiRef.current,
        uiApi: uiApiRef.current,
        env,
        canvasData,
        accountId,
        isLoading,
        isEditMode,
        crmQuery,
        updateCanvasContext,
        showToast,
      }}
    >
      {children}
    </PitcherContext.Provider>
  )
}
