import { useMemo } from 'react'
import { Color } from 'three'

export interface Palette {
  sky: Color
  horizon: Color
  terrain: Color
  terrainPeak: Color
  fog: Color
  ambient: Color
  accent: Color
}

const BASE_PALETTE: Palette = {
  sky: new Color('#0a0620'),
  horizon: new Color('#1a0a3a'),
  terrain: new Color('#1a0e30'),
  terrainPeak: new Color('#c9a055'),
  fog: new Color('#0e0828'),
  ambient: new Color('#2a1a50'),
  accent: new Color('#7b3ff2'),
}

export function useColorPalette(): Palette {
  return useMemo(() => BASE_PALETTE, [])
}
