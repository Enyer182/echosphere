import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { createNoise2D, fbm } from '../utils/noise'
import type { Mesh, BufferGeometry, BufferAttribute as ThreeBufferAttribute } from 'three'
import { Color } from 'three'

const SEGMENTS = 128
const SIZE = 40
const HEIGHT_SCALE = 2.8
const LOW_COLOR = new Color('#081820')
const MID_COLOR = new Color('#1a5060')
const HIGH_COLOR = new Color('#b0e8f0')

export default function Terrain() {
  const meshRef = useRef<Mesh>(null)
  const noise = useMemo(() => createNoise2D(77), [])
  const timeRef = useRef(0)

  const { positions, colors, indices } = useMemo(() => {
    const count = (SEGMENTS + 1) * (SEGMENTS + 1)
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const idx: number[] = []
    const half = SIZE / 2

    for (let iy = 0; iy <= SEGMENTS; iy++) {
      for (let ix = 0; ix <= SEGMENTS; ix++) {
        const i = iy * (SEGMENTS + 1) + ix
        const x = (ix / SEGMENTS) * SIZE - half
        const z = (iy / SEGMENTS) * SIZE - half

        const h = fbm(noise, x * 0.08, z * 0.08, 5, 2.1, 0.48) * HEIGHT_SCALE
        pos[i * 3] = x
        pos[i * 3 + 1] = h
        pos[i * 3 + 2] = z

        const t = (h / HEIGHT_SCALE + 1) * 0.5
        const c = new Color()
        if (t < 0.5) {
          c.lerpColors(LOW_COLOR, MID_COLOR, t * 2)
        } else {
          c.lerpColors(MID_COLOR, HIGH_COLOR, (t - 0.5) * 2)
        }
        col[i * 3] = c.r
        col[i * 3 + 1] = c.g
        col[i * 3 + 2] = c.b
      }
    }

    for (let iy = 0; iy < SEGMENTS; iy++) {
      for (let ix = 0; ix < SEGMENTS; ix++) {
        const a = iy * (SEGMENTS + 1) + ix
        const b = a + 1
        const c = a + (SEGMENTS + 1)
        const d = c + 1
        idx.push(a, c, b, b, c, d)
      }
    }

    return { positions: pos, colors: col, indices: new Uint32Array(idx) }
  }, [noise])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    timeRef.current += delta * 0.02

    const geom: BufferGeometry = meshRef.current.geometry
    const posAttr = geom.getAttribute('position') as ThreeBufferAttribute
    const colAttr = geom.getAttribute('color') as ThreeBufferAttribute
    const half = SIZE / 2
    const t0 = timeRef.current

    for (let iy = 0; iy <= SEGMENTS; iy++) {
      for (let ix = 0; ix <= SEGMENTS; ix++) {
        const i = iy * (SEGMENTS + 1) + ix
        const x = (ix / SEGMENTS) * SIZE - half
        const z = (iy / SEGMENTS) * SIZE - half

        const h = fbm(noise, x * 0.08 + t0, z * 0.08 + t0 * 0.6, 5, 2.1, 0.48) * HEIGHT_SCALE
        posAttr.setY(i, h)

        const tn = (h / HEIGHT_SCALE + 1) * 0.5
        const c = new Color()
        if (tn < 0.5) {
          c.lerpColors(LOW_COLOR, MID_COLOR, tn * 2)
        } else {
          c.lerpColors(MID_COLOR, HIGH_COLOR, (tn - 0.5) * 2)
        }
        colAttr.setXYZ(i, c.r, c.g, c.b)
      }
    }

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
    geom.computeVertexNormals()
  })

  return (
    <mesh ref={meshRef} position={[0, -3, 0]} receiveShadow>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="index" args={[indices, 1]} />
      </bufferGeometry>
      <meshStandardMaterial
        vertexColors
        metalness={0.2}
        roughness={0.65}
        flatShading
      />
    </mesh>
  )
}
