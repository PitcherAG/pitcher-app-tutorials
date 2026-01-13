import { useEffect, useRef, useCallback } from 'react'

interface UseIframeHeightOptions {
  /** Selector to find the iframe in parent document */
  iframeSelector?: string
  /** Debounce delay in ms */
  debounceMs?: number
  /** Whether to enable the hook */
  enabled?: boolean
}

/**
 * Hook that dynamically updates the parent iframe height to match content.
 * Uses ResizeObserver for efficient detection of content size changes.
 */
export function useIframeHeight(options: UseIframeHeightOptions = {}) {
  const {
    iframeSelector = 'iframe[data-app="canvas-sales-dashboard"]',
    debounceMs = 50,
    enabled = true,
  } = options

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastHeightRef = useRef<number>(0)

  const updateHeight = useCallback(() => {
    if (!enabled) return

    const height = document.body.scrollHeight

    // Only update if height actually changed
    if (height === lastHeightRef.current) return
    lastHeightRef.current = height

    console.log('[Iframe] Setting height to:', height)

    try {
      // Try to find and resize the iframe container in parent
      if (window.parent && window.parent !== window) {
        const iframe = window.parent.document.querySelector(iframeSelector) as HTMLIFrameElement | null
        if (iframe?.parentElement) {
          iframe.parentElement.style.height = `${height}px`
        }
      }
    } catch (e) {
      // Cross-origin restrictions may prevent access to parent
      console.log('[Iframe] Cannot access parent frame (cross-origin):', e)
    }
  }, [enabled, iframeSelector])

  const debouncedUpdate = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(updateHeight, debounceMs)
  }, [updateHeight, debounceMs])

  useEffect(() => {
    if (!enabled) return

    // Initial height update
    updateHeight()

    // Watch for content size changes using ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      debouncedUpdate()
    })

    resizeObserver.observe(document.body)

    // Also listen for window resize
    window.addEventListener('resize', debouncedUpdate)

    // Watch for images loading (can affect height)
    const images = document.querySelectorAll('img')
    images.forEach((img) => {
      if (!img.complete) {
        img.addEventListener('load', debouncedUpdate)
      }
    })

    // MutationObserver to catch dynamic content changes
    const mutationObserver = new MutationObserver(() => {
      debouncedUpdate()
    })

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    })

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      window.removeEventListener('resize', debouncedUpdate)
      images.forEach((img) => {
        img.removeEventListener('load', debouncedUpdate)
      })
    }
  }, [enabled, updateHeight, debouncedUpdate])

  return { updateHeight }
}
