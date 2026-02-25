import { useCallback, useEffect, useRef, useState } from 'react'
import { createAudioEngine, type AudioEngine, type AudioLayer } from '../utils/audio'

export function useAudioEngine() {
  const engineRef = useRef<AudioEngine | null>(null)
  const [started, setStarted] = useState(false)
  const [layerStates, setLayerStates] = useState<boolean[]>([])

  const init = useCallback(async () => {
    if (engineRef.current) return engineRef.current
    const engine = createAudioEngine()
    await engine.resume()
    engineRef.current = engine
    setLayerStates(engine.layers.map(() => false))
    setStarted(true)
    return engine
  }, [])

  const toggleLayer = useCallback((index: number) => {
    const engine = engineRef.current
    if (!engine) return

    const layer: AudioLayer = engine.layers[index]
    if (layer.active) {
      layer.stop()
    } else {
      layer.start()
    }

    setLayerStates(engine.layers.map((l) => l.active))
  }, [])

  useEffect(() => {
    return () => {
      engineRef.current?.dispose()
      engineRef.current = null
    }
  }, [])

  return { engine: engineRef, started, layerStates, init, toggleLayer }
}
