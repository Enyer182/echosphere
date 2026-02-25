import * as Tone from 'tone'

export type LayerKind = 'drone' | 'pad' | 'arp' | 'wind' | 'chime'

export interface AudioLayer {
  kind: LayerKind
  label: string
  color: string
  active: boolean
  start: () => void
  stop: () => void
  dispose: () => void
}

interface LayerBuses {
  dry: Tone.Gain
  fx: Tone.Gain
}

interface LayerRouting {
  input: Tone.Gain
  volume: Tone.Volume
  dispose: () => void
}

const PAD_CHORDS = [
  ['A3', 'C4', 'E4', 'G4'],
  ['F3', 'A3', 'C4', 'E4'],
  ['G3', 'B3', 'D4', 'F4'],
  ['E3', 'G3', 'B3', 'D4'],
]

const ARP_NOTES = ['A4', 'E5', 'C5', 'G5', 'E5', 'B4']
const CHIME_NOTES = ['C6', 'E6', 'G6', 'A6', 'B6']

function createLayerRouting(
  buses: LayerBuses,
  options: { panRate: number; panDepth: number; dryLevel: number; fxLevel: number },
): LayerRouting {
  const input = new Tone.Gain(1)
  const volume = new Tone.Volume(-Infinity)
  const autoPanner = new Tone.AutoPanner({
    frequency: options.panRate,
    depth: options.panDepth,
  }).start()
  const drySend = new Tone.Gain(options.dryLevel)
  const fxSend = new Tone.Gain(options.fxLevel)

  input.connect(volume)
  volume.connect(autoPanner)
  autoPanner.connect(drySend)
  autoPanner.connect(fxSend)
  drySend.connect(buses.dry)
  fxSend.connect(buses.fx)

  return {
    input,
    volume,
    dispose() {
      input.dispose()
      volume.dispose()
      autoPanner.dispose()
      drySend.dispose()
      fxSend.dispose()
    },
  }
}

function createDroneLayer(buses: LayerBuses): AudioLayer {
  const routing = createLayerRouting(buses, {
    panRate: 0.02,
    panDepth: 0.6,
    dryLevel: 1,
    fxLevel: 0.45,
  })
  const filter = new Tone.Filter({ type: 'lowpass', frequency: 320, Q: 0.6, rolloff: -24 })
  const drone = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'fatsawtooth', count: 3, spread: 22 },
    envelope: { attack: 2.8, decay: 0.9, sustain: 0.95, release: 5.5 },
  })
  const notes = ['A1', 'E2', 'A2']

  drone.connect(filter)
  filter.connect(routing.input)

  const layer: AudioLayer = {
    kind: 'drone',
    label: 'Sub Current',
    color: '#40e0d0',
    active: false,
    start: () => undefined,
    stop: () => undefined,
    dispose: () => undefined,
  }

  layer.start = () => {
    if (layer.active) return
    layer.active = true
    drone.triggerAttack(notes)
    routing.volume.volume.rampTo(-8, 2.4)
  }

  layer.stop = () => {
    if (!layer.active) return
    layer.active = false
    drone.triggerRelease(notes, Tone.now() + 0.1)
    routing.volume.volume.rampTo(-Infinity, 1.2)
  }

  layer.dispose = () => {
    layer.stop()
    drone.dispose()
    filter.dispose()
    routing.dispose()
  }

  return layer
}

function createPadLayer(buses: LayerBuses): AudioLayer {
  const routing = createLayerRouting(buses, {
    panRate: 0.01,
    panDepth: 0.48,
    dryLevel: 1,
    fxLevel: 0.65,
  })
  const pad = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 1.6,
    modulationIndex: 4,
    oscillator: { type: 'sine' },
    envelope: { attack: 1.8, decay: 0.7, sustain: 0.75, release: 4.2 },
    modulation: { type: 'triangle' },
    modulationEnvelope: { attack: 1.3, decay: 0.4, sustain: 0.45, release: 3.1 },
  })
  let chordIndex = 0
  const progression = new Tone.Loop((time) => {
    const chord = PAD_CHORDS[chordIndex % PAD_CHORDS.length]
    chordIndex += 1
    pad.triggerAttackRelease(chord, '2m', time, 0.55)
  }, '2m')
  progression.humanize = 0.015

  pad.connect(routing.input)

  const layer: AudioLayer = {
    kind: 'pad',
    label: 'Resonance',
    color: '#60a0ff',
    active: false,
    start: () => undefined,
    stop: () => undefined,
    dispose: () => undefined,
  }

  layer.start = () => {
    if (layer.active) return
    layer.active = true
    chordIndex = 0
    progression.start(0)
    pad.triggerAttackRelease(PAD_CHORDS[0], '2m', Tone.now(), 0.55)
    chordIndex = 1
    routing.volume.volume.rampTo(-11, 2.2)
  }

  layer.stop = () => {
    if (!layer.active) return
    layer.active = false
    progression.stop(0)
    pad.releaseAll(Tone.now() + 0.2)
    routing.volume.volume.rampTo(-Infinity, 1.1)
  }

  layer.dispose = () => {
    layer.stop()
    progression.dispose()
    pad.dispose()
    routing.dispose()
  }

  return layer
}

function createArpLayer(buses: LayerBuses): AudioLayer {
  const routing = createLayerRouting(buses, {
    panRate: 0.07,
    panDepth: 0.85,
    dryLevel: 1,
    fxLevel: 0.5,
  })
  const filter = new Tone.Filter({ type: 'highpass', frequency: 420, Q: 0.3 })
  const synth = new Tone.Synth({
    oscillator: { type: 'triangle8' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.12, release: 0.55 },
  })
  const sequence = new Tone.Sequence(
    (time, note) => {
      synth.triggerAttackRelease(note as string, '16n', time, 0.7)
    },
    ARP_NOTES,
    '8n',
  )
  sequence.humanize = 0.01

  synth.connect(filter)
  filter.connect(routing.input)

  const layer: AudioLayer = {
    kind: 'arp',
    label: 'Pulse Sequence',
    color: '#e0a040',
    active: false,
    start: () => undefined,
    stop: () => undefined,
    dispose: () => undefined,
  }

  layer.start = () => {
    if (layer.active) return
    layer.active = true
    sequence.start(0)
    routing.volume.volume.rampTo(-13, 0.8)
  }

  layer.stop = () => {
    if (!layer.active) return
    layer.active = false
    sequence.stop(0)
    routing.volume.volume.rampTo(-Infinity, 0.5)
  }

  layer.dispose = () => {
    layer.stop()
    sequence.dispose()
    synth.dispose()
    filter.dispose()
    routing.dispose()
  }

  return layer
}

function createWindLayer(buses: LayerBuses): AudioLayer {
  const routing = createLayerRouting(buses, {
    panRate: 0.006,
    panDepth: 0.35,
    dryLevel: 1,
    fxLevel: 0.9,
  })
  const noise = new Tone.Noise('pink')
  const bandpass = new Tone.Filter({ type: 'bandpass', frequency: 400, Q: 0.55 })
  const movement = new Tone.LFO({ frequency: 0.09, min: 210, max: 910 }).start()
  const tremolo = new Tone.Tremolo({ frequency: 0.16, depth: 0.23, spread: 180 }).start()

  movement.connect(bandpass.frequency)
  noise.connect(bandpass)
  bandpass.connect(tremolo)
  tremolo.connect(routing.input)
  noise.start()

  const layer: AudioLayer = {
    kind: 'wind',
    label: 'Atmosphere',
    color: '#e060a0',
    active: false,
    start: () => undefined,
    stop: () => undefined,
    dispose: () => undefined,
  }

  layer.start = () => {
    if (layer.active) return
    layer.active = true
    routing.volume.volume.rampTo(-19, 2.8)
  }

  layer.stop = () => {
    if (!layer.active) return
    layer.active = false
    routing.volume.volume.rampTo(-Infinity, 1.4)
  }

  layer.dispose = () => {
    layer.stop()
    noise.stop()
    noise.dispose()
    bandpass.dispose()
    movement.dispose()
    tremolo.dispose()
    routing.dispose()
  }

  return layer
}

function createChimeLayer(buses: LayerBuses): AudioLayer {
  const routing = createLayerRouting(buses, {
    panRate: 0.05,
    panDepth: 1,
    dryLevel: 1,
    fxLevel: 0.75,
  })
  const highpass = new Tone.Filter({ type: 'highpass', frequency: 950, Q: 0.4 })
  const chorus = new Tone.Chorus({ frequency: 0.25, delayTime: 4.5, depth: 0.2, spread: 180, wet: 0.35 }).start()
  const synth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.005, decay: 0.24, sustain: 0, release: 1.6 },
  })
  const loop = new Tone.Loop((time) => {
    const note = CHIME_NOTES[Math.floor(Math.random() * CHIME_NOTES.length)]
    synth.triggerAttackRelease(note, '8n', time, 0.3)
    if (Math.random() > 0.64) {
      const shimmer = Tone.Frequency(note).transpose(12).toNote()
      synth.triggerAttackRelease(shimmer, '16n', time + Tone.Time('8n').toSeconds(), 0.18)
    }
  }, '2n')
  loop.humanize = 0.03

  synth.connect(chorus)
  chorus.connect(highpass)
  highpass.connect(routing.input)

  const layer: AudioLayer = {
    kind: 'chime',
    label: 'Shimmer',
    color: '#90e870',
    active: false,
    start: () => undefined,
    stop: () => undefined,
    dispose: () => undefined,
  }

  layer.start = () => {
    if (layer.active) return
    layer.active = true
    loop.start(0)
    routing.volume.volume.rampTo(-15, 1.1)
  }

  layer.stop = () => {
    if (!layer.active) return
    layer.active = false
    loop.stop(0)
    routing.volume.volume.rampTo(-Infinity, 0.9)
  }

  layer.dispose = () => {
    layer.stop()
    loop.dispose()
    synth.dispose()
    chorus.dispose()
    highpass.dispose()
    routing.dispose()
  }

  return layer
}

export interface AudioEngine {
  ctx: AudioContext
  master: Tone.Gain
  layers: AudioLayer[]
  resume: () => Promise<void>
  dispose: () => void
}

export function createAudioEngine(): AudioEngine {
  Tone.Transport.bpm.value = 72
  Tone.Transport.swing = 0.08
  Tone.Transport.swingSubdivision = '8n'

  const limiter = new Tone.Limiter(-1).toDestination()
  const master = new Tone.Gain(0.82)
  const compressor = new Tone.Compressor({ threshold: -22, ratio: 3.4, attack: 0.02, release: 0.3 })
  const reverb = new Tone.Reverb({ decay: 8.4, preDelay: 0.18, wet: 0.4 })
  const delay = new Tone.PingPongDelay({ delayTime: '8n', feedback: 0.3, wet: 0.26 })
  const dryBus = new Tone.Gain(1)
  const fxBus = new Tone.Gain(0.8)

  dryBus.connect(master)
  fxBus.connect(reverb)
  fxBus.connect(delay)
  reverb.connect(master)
  delay.connect(master)
  master.connect(compressor)
  compressor.connect(limiter)

  const layers: AudioLayer[] = [
    createDroneLayer({ dry: dryBus, fx: fxBus }),
    createPadLayer({ dry: dryBus, fx: fxBus }),
    createArpLayer({ dry: dryBus, fx: fxBus }),
    createWindLayer({ dry: dryBus, fx: fxBus }),
    createChimeLayer({ dry: dryBus, fx: fxBus }),
  ]

  return {
    ctx: Tone.getContext().rawContext as AudioContext,
    master,
    layers,
    async resume() {
      await Tone.start()
      if (Tone.Transport.state !== 'started') {
        Tone.Transport.start('+0.05')
      }
    },
    dispose() {
      layers.forEach((layer) => {
        if (layer.active) layer.stop()
        layer.dispose()
      })
      Tone.Transport.stop()
      Tone.Transport.cancel(0)
      dryBus.dispose()
      fxBus.dispose()
      delay.dispose()
      reverb.dispose()
      compressor.dispose()
      master.dispose()
      limiter.dispose()
    },
  }
}
