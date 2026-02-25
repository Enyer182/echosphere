import { OrbitControls } from '@react-three/drei'
import Terrain from './Terrain'
import FloatingCrystals from './FloatingCrystals'
import ParticleField from './ParticleField'
import Sky from './Sky'

interface DreamSceneProps {
  layerStates: boolean[]
  onToggleLayer: (index: number) => void
}

export default function DreamScene({ layerStates, onToggleLayer }: DreamSceneProps) {
  return (
    <>
      <color attach="background" args={['#040a10']} />
      <fog attach="fog" args={['#060e16', 8, 40]} />

      <ambientLight intensity={0.1} color="#204050" />
      <directionalLight
        position={[8, 12, -5]}
        intensity={0.25}
        color="#80c0d0"
        castShadow
      />
      <pointLight position={[0, 6, 0]} intensity={1.2} color="#30b0b0" distance={20} decay={2} />
      <pointLight position={[-6, 4, -6]} intensity={0.7} color="#4080e0" distance={15} decay={2} />
      <pointLight position={[6, 3, 4]} intensity={0.5} color="#e0a040" distance={12} decay={2} />

      <hemisphereLight
        args={['#0a2030', '#040810', 0.35]}
      />

      <Sky />
      <Terrain />
      <FloatingCrystals layerStates={layerStates} onToggleLayer={onToggleLayer} />
      <ParticleField />

      <OrbitControls
        enablePan={false}
        enableZoom
        autoRotate
        autoRotateSpeed={0.15}
        minDistance={5}
        maxDistance={25}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.55}
        dampingFactor={0.05}
        enableDamping
        target={[0, 0, 0]}
      />
    </>
  )
}
