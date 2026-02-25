import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import type { Points } from 'three'

const DUST_COUNT = 300

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return s / 2147483647
  }
}

function createDustData() {
  const rng = seededRandom(12345)
  const pos = new Float32Array(DUST_COUNT * 3)
  const vel = new Float32Array(DUST_COUNT)
  for (let i = 0; i < DUST_COUNT; i++) {
    pos[i * 3] = (rng() - 0.5) * 30
    pos[i * 3 + 1] = rng() * 10 - 3
    pos[i * 3 + 2] = (rng() - 0.5) * 30
    vel[i] = 0.1 + rng() * 0.3
  }
  return { positions: pos, velocities: vel }
}

const DUST_DATA = createDustData()

function RisingDust() {
  const ref = useRef<Points>(null)
  const { positions, velocities } = DUST_DATA

  useFrame((_, delta) => {
    if (!ref.current) return
    const posAttr = ref.current.geometry.getAttribute('position')
    const arr = posAttr.array as Float32Array

    for (let i = 0; i < DUST_COUNT; i++) {
      arr[i * 3 + 1] += velocities[i] * delta
      arr[i * 3] += Math.sin(arr[i * 3 + 1] * 0.5) * delta * 0.05

      if (arr[i * 3 + 1] > 10) {
        arr[i * 3 + 1] = -3
        arr[i * 3] = ((i * 7919 + 104729) % 30000) / 1000 - 15
        arr[i * 3 + 2] = ((i * 6271 + 83497) % 30000) / 1000 - 15
      }
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#80e0e8"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

export default function ParticleField() {
  return (
    <group>
      <Sparkles
        count={250}
        speed={0.15}
        size={2.5}
        scale={[35, 15, 35]}
        color="#80e0e8"
        opacity={0.4}
      />
      <Sparkles
        count={100}
        speed={0.08}
        size={4}
        scale={[30, 20, 30]}
        color="#c0f0ff"
        opacity={0.25}
      />
      <RisingDust />
    </group>
  )
}
