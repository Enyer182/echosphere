import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { BufferAttribute, Color, IcosahedronGeometry, Vector3 } from 'three'
import type { Group, Mesh, PointLight } from 'three'

interface NodeConfig {
  position: [number, number, number]
  color: string
  scale: number
  layerIndex: number
  label: string
  seed: number
  spikeFactor: number
}

const NODE_CONFIGS: NodeConfig[] = [
  {
    position: [-3.6, 1.9, 0.35],
    color: '#4f87ad',
    scale: 0.95,
    layerIndex: 0,
    label: 'Sub Current',
    seed: 17,
    spikeFactor: 0.42,
  },
  {
    position: [3.3, 2.15, -0.2],
    color: '#7a9fbf',
    scale: 1,
    layerIndex: 1,
    label: 'Resonance',
    seed: 29,
    spikeFactor: 0.38,
  },
  {
    position: [0, 2.5, -3.6],
    color: '#b68b5a',
    scale: 1.15,
    layerIndex: 2,
    label: 'Pulse Sequence',
    seed: 43,
    spikeFactor: 0.3,
  },
  {
    position: [-2.2, 1.75, 3.1],
    color: '#7a7f8a',
    scale: 0.82,
    layerIndex: 3,
    label: 'Atmosphere',
    seed: 61,
    spikeFactor: 0.46,
  },
  {
    position: [2.1, 1.95, 3.05],
    color: '#7d9770',
    scale: 0.9,
    layerIndex: 4,
    label: 'Shimmer',
    seed: 83,
    spikeFactor: 0.35,
  },
]

function seededRandom(seed: number): () => number {
  let value = seed
  return () => {
    value = (value * 16807 + 0) % 2147483647
    return value / 2147483647
  }
}

function createSpikyGeometry(seed: number, spikeFactor: number): IcosahedronGeometry {
  const geometry = new IcosahedronGeometry(1, 5)
  const position = geometry.getAttribute('position') as BufferAttribute
  const direction = new Vector3()
  const rng = seededRandom(seed)

  for (let i = 0; i < position.count; i++) {
    direction.set(position.getX(i), position.getY(i), position.getZ(i)).normalize()
    const harmonic = Math.sin(direction.y * 12 + direction.x * 7 + seed * 0.31) * spikeFactor * 0.26
    const randomSpike = (rng() - 0.5) * spikeFactor * 0.9
    const radialScale = 1 + harmonic + randomSpike
    position.setXYZ(i, direction.x * radialScale, direction.y * radialScale, direction.z * radialScale)
  }

  position.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

interface ResonantNodeProps {
  config: NodeConfig
  active: boolean
  onToggle: () => void
}

function ResonantNode({ config, active, onToggle }: ResonantNodeProps) {
  const meshRef = useRef<Mesh>(null)
  const ringRef = useRef<Group>(null)
  const pointLightRef = useRef<PointLight>(null)
  const groupRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)

  const geometry = useMemo(
    () => createSpikyGeometry(config.seed, config.spikeFactor),
    [config.seed, config.spikeFactor],
  )

  const tone = useMemo(() => new Color(config.color), [config.color])
  const activeTone = useMemo(() => tone.clone().lerp(new Color('#d9ecff'), 0.35), [tone])
  const hoverTone = useMemo(() => tone.clone().lerp(new Color('#c6dcf4'), 0.22), [tone])

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (0.22 + config.layerIndex * 0.015)
      meshRef.current.rotation.x = Math.sin(meshRef.current.rotation.y * 0.5 + config.seed * 0.1) * 0.05
    }

    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 0.7
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(ringRef.current.rotation.y * 0.35) * 0.08
    }

    if (pointLightRef.current) {
      const targetIntensity = active ? 0.95 : hovered ? 0.55 : 0.24
      pointLightRef.current.intensity += (targetIntensity - pointLightRef.current.intensity) * Math.min(1, delta * 5)
    }

    if (groupRef.current) {
      const targetScale = hovered ? 1.08 : 1
      groupRef.current.scale.lerp(
        new Vector3(targetScale, targetScale, targetScale),
        delta * 5,
      )
    }
  })

  const color = active ? activeTone : hovered ? hoverTone : tone
  const roughness = active ? 0.18 : hovered ? 0.25 : 0.34
  const metalness = active ? 0.56 : hovered ? 0.42 : 0.3

  return (
    <Float
      speed={1.2}
      rotationIntensity={0.1}
      floatIntensity={0.32}
      position={config.position}
    >
      <group
        ref={groupRef}
        onClick={(e) => { e.stopPropagation(); onToggle() }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
      >
        <mesh ref={meshRef} geometry={geometry} scale={config.scale} castShadow receiveShadow>
          <meshStandardMaterial
            color={color}
            emissive="#0d1727"
            emissiveIntensity={active ? 0.07 : hovered ? 0.03 : 0}
            roughness={roughness}
            metalness={metalness}
          />
        </mesh>

        <pointLight
          ref={pointLightRef}
          position={[0.7, 0.5, 0.8]}
          color="#b8d8ff"
          intensity={0.24}
          distance={active ? 11 : 8}
          decay={2}
        />

        {active && (
          <group ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
            <mesh>
              <torusGeometry args={[config.scale * 1.28, 0.015, 16, 128]} />
              <meshStandardMaterial
                color="#c8dcf6"
                emissive="#8da6c2"
                emissiveIntensity={0.24}
                metalness={0.86}
                roughness={0.24}
                transparent
                opacity={0.45}
              />
            </mesh>
          </group>
        )}
      </group>
    </Float>
  )
}

interface ResonantNodesProps {
  layerStates: boolean[]
  onToggleLayer: (index: number) => void
}

export default function ResonantNodes({ layerStates, onToggleLayer }: ResonantNodesProps) {
  return (
    <group>
      {NODE_CONFIGS.map((config) => (
        <ResonantNode
          key={config.label}
          config={config}
          active={layerStates[config.layerIndex] ?? false}
          onToggle={() => onToggleLayer(config.layerIndex)}
        />
      ))}
    </group>
  )
}

export { NODE_CONFIGS }
