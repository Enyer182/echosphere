import { useCallback, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import DreamScene from './components/DreamScene'
import { useAudioEngine } from './hooks/useAudioEngine'
import { CRYSTALS } from './components/FloatingCrystals'
import './App.css'

function App() {
  const { started, layerStates, init, toggleLayer } = useAudioEngine()
  const [entered, setEntered] = useState(false)

  const handleEnter = useCallback(async () => {
    await init()
    setEntered(true)
  }, [init])

  const handleToggle = useCallback((index: number) => {
    toggleLayer(index)
  }, [toggleLayer])

  return (
    <div className="app">
      <div className="canvas-container">
        <Canvas
          camera={{ fov: 55, position: [0, 4, 12], near: 0.1, far: 100 }}
          dpr={[1, 1.5]}
          shadows
        >
          <DreamScene layerStates={layerStates} onToggleLayer={handleToggle} />
        </Canvas>
      </div>

      {!entered && (
        <div className="start-overlay">
          <div className="start-content">
            <h1 className="start-title">Echosphere</h1>
            <p className="start-subtitle">A generative audio-visual experience</p>
            <p className="start-hint">Explore a luminous terrain and awaken sound layers<br />by touching the resonant nodes</p>
            <button className="start-button" onClick={handleEnter}>
              Begin
            </button>
            <p className="start-credit">Built with React Three Fiber + Web Audio API</p>
          </div>
        </div>
      )}

      {entered && (
        <div className="hud">
          <div className="hud-title">
            <span className="hud-logo">Echosphere</span>
          </div>

          <div className="layer-indicators">
            {CRYSTALS.map((crystal) => {
              const active = layerStates[crystal.layerIndex] ?? false
              return (
                <button
                  key={crystal.label}
                  className={`layer-pill ${active ? 'active' : ''}`}
                  style={{ '--pill-color': crystal.color } as React.CSSProperties}
                  onClick={() => handleToggle(crystal.layerIndex)}
                >
                  <span className="pill-dot" />
                  <span className="pill-label">{crystal.label}</span>
                </button>
              )
            })}
          </div>

          <p className="hud-hint">
            {started ? 'Click nodes to toggle sound layers' : 'Initializing audio...'}
          </p>
        </div>
      )}
    </div>
  )
}

export default App
