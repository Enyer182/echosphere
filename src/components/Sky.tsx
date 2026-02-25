import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import type { Group } from 'three'

export default function Sky() {
  const groupRef = useRef<Group>(null)

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.003
    }
  })

  return (
    <group ref={groupRef}>
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
