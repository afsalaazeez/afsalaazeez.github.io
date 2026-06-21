import { useEffect, useRef } from 'react'
import { initCarWorld } from '../webgl/canvasSetup'

export function CanvasWrapper() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const cleanup = initCarWorld(containerRef.current)
    return cleanup
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0 }}
    />
  )
}
