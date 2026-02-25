import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Center, Float, useGLTF } from '@react-three/drei'
import { Vector3 } from 'three'
import type { Group, Material, Mesh, MeshStandardMaterial } from 'three'

interface CrystalConfig {
  position: [number, number, number]
  color: string
  emissive: string
  scale: number
  layerIndex: number
  label: string
  modelPath: string
}

const PLANET_MODELS_BASE_URL = `${import.meta.env.BASE_URL}models/planets/`

function planetModelPath(fileName: string): string {
  return `${PLANET_MODELS_BASE_URL}${fileName}`
}

const CRYSTALS: CrystalConfig[] = [
  {
    position: [-3.6, 1.9, 0.35],
    color: '#40e0d0',
    emissive: '#20b0a0',
    scale: 1,
    layerIndex: 0,
    label: 'Sub Current',
    modelPath: planetModelPath('neptune.glb'),
  },
  {
    position: [3.3, 2.15, -0.2],
    color: '#60a0ff',
    emissive: '#3070d0',
    scale: 1.05,
    layerIndex: 1,
    label: 'Resonance',
    modelPath: planetModelPath('earth.glb'),
  },
  {
    position: [0, 2.5, -3.6],
    color: '#e0a040',
    emissive: '#c08020',
    scale: 1.2,
    layerIndex: 2,
    label: 'Pulse Sequence',
    modelPath: planetModelPath('jupiter.glb'),
  },
  {
    position: [-2.2, 1.75, 3.1],
    color: '#e060a0',
    emissive: '#c04080',
    scale: 0.78,
    layerIndex: 3,
    label: 'Atmosphere',
    modelPath: planetModelPath('mercury.glb'),
  },
  {
    position: [2.1, 1.95, 3.05],
    color: '#90e870',
    emissive: '#60c040',
    scale: 0.92,
    layerIndex: 4,
    label: 'Shimmer',
    modelPath: planetModelPath('mars.glb'),
  },
]

const MODEL_WORLD_SCALE = 0.0012

function cloneMaterial(material: Material | Material[]) {
  if (Array.isArray(material)) return material.map((entry) => entry.clone())
  return material.clone()
}

function isStandardMaterial(material: Material): material is MeshStandardMaterial {
  return 'emissive' in material && 'emissiveIntensity' in material
}

interface CrystalProps {
  config: CrystalConfig
  active: boolean
  onToggle: () => void
}

function Crystal({ config, active, onToggle }: CrystalProps) {
  const planetRef = useRef<Group>(null)
  const glowRef = useRef<Mesh>(null)
  const groupRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const gltf = useGLTF(config.modelPath)

  const model = useMemo(() => {
    const cloned = gltf.scene.clone(true)
    cloned.traverse((child) => {
      if (!('isMesh' in child) || !child.isMesh) return
      const mesh = child as Mesh
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.material = cloneMaterial(mesh.material as Material | Material[])
    })
    return cloned
  }, [gltf.scene])

  useEffect(() => {
    const emissiveIntensity = active ? 0.95 : hovered ? 0.45 : 0.15
    model.traverse((child) => {
      if (!('isMesh' in child) || !child.isMesh) return
      const mesh = child as Mesh
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach((material) => {
        if (!isStandardMaterial(material)) return
        material.emissive.set(config.emissive)
        material.emissiveIntensity = emissiveIntensity
      })
    })
  }, [active, config.emissive, hovered, model])

  useFrame((state, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.24
      planetRef.current.rotation.x += delta * 0.05
    }
    if (glowRef.current) {
      glowRef.current.rotation.y -= delta * 0.3
      glowRef.current.rotation.z += delta * 0.15
      const pulse = Math.sin(state.clock.elapsedTime * 2 + config.layerIndex) * 0.04
      const baseScale = config.scale * (active ? 0.98 : hovered ? 0.85 : 0.75)
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

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.2}
      floatIntensity={0.6}
      position={config.position}
    >
      <group
        ref={groupRef}
        onClick={(e) => { e.stopPropagation(); onToggle() }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
      >
        <group ref={planetRef}>
          <Center>
            <primitive object={model} scale={MODEL_WORLD_SCALE * config.scale} />
          </Center>
        </group>

        <mesh ref={glowRef} scale={config.scale * 0.8}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color={config.emissive}
            transparent
            opacity={active ? 0.16 : hovered ? 0.09 : 0.05}
            wireframe
          />
        </mesh>

        <pointLight
          color={config.emissive}
          intensity={active ? 10 : hovered ? 3.5 : 1}
          distance={active ? 12 : 6}
          decay={2}
        />

        {active && (
          <mesh scale={config.scale * 1.6}>
            <sphereGeometry args={[1, 20, 20]} />
            <meshBasicMaterial
              color={config.emissive}
              transparent
              opacity={0.08}
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
      <mesh position={[0, 2.05, -0.2]}>
        <sphereGeometry args={[0.36, 32, 32]} />
        <meshStandardMaterial
          color="#9fdcf5"
          emissive="#3da0cf"
          emissiveIntensity={1.35}
          metalness={0.2}
          roughness={0.18}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh position={[0, 2.05, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.56, 0.03, 16, 64]} />
        <meshBasicMaterial color="#4ec7ff" transparent opacity={0.35} />
      </mesh>

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

CRYSTALS.forEach((config) => {
  useGLTF.preload(config.modelPath)
})
