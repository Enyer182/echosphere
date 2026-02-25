import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, useTexture } from '@react-three/drei'
import { BackSide, SRGBColorSpace } from 'three'
import type { Group, Texture } from 'three'

export default function Sky() {
  const groupRef = useRef<Group>(null)
  const sourceTexture = useTexture(`${import.meta.env.BASE_URL}textures/spiky_cluster_env.jpg`) as Texture
  const environmentTexture = useMemo(() => {
    const texture = sourceTexture.clone()
    texture.colorSpace = SRGBColorSpace
    texture.needsUpdate = true
    return texture
  }, [sourceTexture])

  useEffect(() => {
    return () => environmentTexture.dispose()
  }, [environmentTexture])

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.003
    }
  })

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[95, 64, 32]} />
        <meshBasicMaterial
          map={environmentTexture}
          side={BackSide}
          transparent
          opacity={0.32}
          depthWrite={false}
        />
      </mesh>
      <Stars
        radius={80}
        depth={60}
        count={4000}
        factor={4}
        saturation={0.6}
        fade
        speed={0.5}
      />
    </group>
  )
}
