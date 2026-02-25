import { OrbitControls } from '@react-three/drei'
import Terrain from './Terrain'
import ResonantNodes from './ResonantNodes'
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
      <fog attach="fog" args={['#060e16', 10, 45]} />

      <ambientLight intensity={0.38} color="#32546b" />
      <directionalLight
        position={[7, 11, 6]}
        intensity={0.58}
        color="#80c0d0"
        castShadow
      />
      <directionalLight
        position={[-9, 6, -7]}
        intensity={0.36}
        color="#8bb2dd"
      />
      <pointLight position={[0, 4.8, 7]} intensity={1.2} color="#88d0ff" distance={28} decay={1.8} />
      <pointLight position={[-6, 4, -6]} intensity={0.82} color="#4080e0" distance={18} decay={2} />
      <pointLight position={[6, 3, 4]} intensity={0.62} color="#e0a040" distance={16} decay={2} />

      <hemisphereLight
        args={['#21435a', '#03070f', 0.56]}
      />

      <Sky />
      <Terrain />
      <ResonantNodes layerStates={layerStates} onToggleLayer={onToggleLayer} />
      <ParticleField />

      <OrbitControls
        enablePan={false}
        enableZoom
        autoRotate
        autoRotateSpeed={0.12}
        minDistance={5}
        maxDistance={25}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.75}
        dampingFactor={0.05}
        enableDamping
        target={[0, 2, 0]}
      />
    </>
  )
}
