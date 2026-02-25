import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Center, Float, useGLTF } from '@react-three/drei'
import { Box3, Vector3 } from 'three'
import type { Group, Material, Mesh, MeshStandardMaterial, PointLight } from 'three'

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

const DEFAULT_MODEL_SCALE = 0.0012

function cloneMaterial(material: Material | Material[]) {
  if (Array.isArray(material)) return material.map((entry) => entry.clone())
  return material.clone()
}

function isStandardMaterial(material: Material): material is MeshStandardMaterial {
  return 'emissive' in material && 'emissiveIntensity' in material
}

function getNormalizedScale(model: Group, desiredRadius: number): number {
  const size = new Vector3()
  new Box3().setFromObject(model).getSize(size)
  const maxDimension = Math.max(size.x, size.y, size.z)
  if (maxDimension <= 0) return DEFAULT_MODEL_SCALE * desiredRadius
  return (desiredRadius * 2) / maxDimension
}

interface CrystalProps {
  config: CrystalConfig
  active: boolean
  onToggle: () => void
}

function Crystal({ config, active, onToggle }: CrystalProps) {
  const planetRef = useRef<Group>(null)
  const pointLightRef = useRef<PointLight>(null)
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
      const clonedMaterial = cloneMaterial(mesh.material as Material | Material[])
      const materials = Array.isArray(clonedMaterial) ? clonedMaterial : [clonedMaterial]
      materials.forEach((material) => {
        if (!isStandardMaterial(material)) return
        material.roughness = Math.min(material.roughness, 0.86)
        material.metalness = Math.min(material.metalness, 0.18)
        material.envMapIntensity = 0.9
      })
      mesh.material = clonedMaterial
    })
    cloned.scale.setScalar(getNormalizedScale(cloned, config.scale))
    return cloned
  }, [config.scale, gltf.scene])

  useEffect(() => {
    const emissiveIntensity = active ? 0.26 : hovered ? 0.12 : 0.04
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

  useFrame((_, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * (0.18 + config.layerIndex * 0.015)
      planetRef.current.rotation.x = Math.sin(planetRef.current.rotation.y * 0.5) * 0.05
    }
    if (pointLightRef.current) {
      const targetIntensity = active ? 2.2 : hovered ? 1.15 : 0.65
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

  return (
    <Float
      speed={1.2}
      rotationIntensity={0.1}
      floatIntensity={0.35}
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
            <primitive object={model} />
          </Center>
        </group>

        <pointLight
          ref={pointLightRef}
          position={[0.7, 0.5, 0.8]}
          color={config.emissive}
          intensity={0.65}
          distance={active ? 13 : 10}
          decay={2}
        />
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

CRYSTALS.forEach((config) => {
  useGLTF.preload(config.modelPath)
})
