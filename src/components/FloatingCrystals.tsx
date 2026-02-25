import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { Vector3 } from 'three'
import type { Mesh, Group } from 'three'

interface CrystalConfig {
  position: [number, number, number]
  color: string
  emissive: string
  scale: number
  layerIndex: number
  label: string
}

const CRYSTALS: CrystalConfig[] = [
  { position: [-3, 1.5, -2], color: '#40e0d0', emissive: '#20b0a0', scale: 0.6, layerIndex: 0, label: 'Sub Current' },
  { position: [2.5, 2.2, -4], color: '#60a0ff', emissive: '#3070d0', scale: 0.55, layerIndex: 1, label: 'Resonance' },
  { position: [0, 3, -1], color: '#e0a040', emissive: '#c08020', scale: 0.5, layerIndex: 2, label: 'Pulse Sequence' },
  { position: [-4.5, 1.8, 1], color: '#e060a0', emissive: '#c04080', scale: 0.45, layerIndex: 3, label: 'Atmosphere' },
  { position: [4, 2.5, 0.5], color: '#90e870', emissive: '#60c040', scale: 0.5, layerIndex: 4, label: 'Shimmer' },
]

interface CrystalProps {
  config: CrystalConfig
  active: boolean
  onToggle: () => void
}

function Crystal({ config, active, onToggle }: CrystalProps) {
  const meshRef = useRef<Mesh>(null)
  const glowRef = useRef<Mesh>(null)
  const groupRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5
      meshRef.current.rotation.x += delta * 0.2
    }
    if (glowRef.current) {
      glowRef.current.rotation.y -= delta * 0.3
      glowRef.current.rotation.z += delta * 0.15
      const pulse = Math.sin(state.clock.elapsedTime * 2 + config.layerIndex) * 0.05
      const baseScale = config.scale * (active ? 1.8 : 1.4)
      glowRef.current.scale.setScalar(baseScale + pulse)
    }
    if (groupRef.current) {
      const targetScale = hovered ? 1.15 : 1
      groupRef.current.scale.lerp(
        new Vector3(targetScale, targetScale, targetScale),
        delta * 5,
      )
    }
  })

  const emissiveIntensity = active ? 3 : hovered ? 1.5 : 0.6

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.3}
      floatIntensity={0.6}
      position={config.position}
    >
      <group
        ref={groupRef}
        onClick={(e) => { e.stopPropagation(); onToggle() }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
      >
        <mesh ref={meshRef} scale={config.scale}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={config.color}
            emissive={config.emissive}
            emissiveIntensity={emissiveIntensity}
            metalness={0.3}
            roughness={0.2}
            transparent
            opacity={active ? 0.95 : 0.7}
          />
        </mesh>

        <mesh ref={glowRef} scale={config.scale * 1.5}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial
            color={config.emissive}
            transparent
            opacity={active ? 0.12 : 0.04}
            wireframe
          />
        </mesh>

        <pointLight
          color={config.emissive}
          intensity={active ? 12 : hovered ? 4 : 1}
          distance={active ? 10 : 5}
          decay={2}
        />

        {active && (
          <mesh scale={config.scale * 2.2}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial
              color={config.emissive}
              transparent
              opacity={0.05}
            />
          </mesh>
        )}
      </group>
    </Float>
  )
}

interface FloatingCrystalsProps {
  layerStates: boolean[]
  onToggleLayer: (index: number) => void
}

export default function FloatingCrystals({ layerStates, onToggleLayer }: FloatingCrystalsProps) {
  return (
    <group>
      {CRYSTALS.map((config) => (
        <Crystal
          key={config.label}
          config={config}
          active={layerStates[config.layerIndex] ?? false}
          onToggle={() => onToggleLayer(config.layerIndex)}
        />
      ))}
    </group>
  )
}

export { CRYSTALS }
