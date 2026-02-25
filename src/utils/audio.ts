export type LayerKind = 'drone' | 'pad' | 'arp' | 'wind' | 'chime'

export interface AudioLayer {
  kind: LayerKind
  label: string
  color: string
  gain: GainNode
  active: boolean
  start: () => void
  stop: () => void
}

const DRONE_FREQS = [55, 82.41, 110]
const PAD_FREQS = [220, 277.18, 329.63, 440]
const ARP_NOTES = [523.25, 659.25, 783.99, 880, 783.99, 659.25]
const CHIME_FREQS = [1046.5, 1318.5, 1568, 1760]

function createDroneLayer(ctx: AudioContext, dest: AudioNode): AudioLayer {
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(dest)

  let oscs: OscillatorNode[] = []

  return {
    kind: 'drone',
    label: 'Sub Current',
    color: '#40e0d0',
    gain,
    active: false,
    start() {
      this.active = true
      oscs = DRONE_FREQS.map((freq, i) => {
        const osc = ctx.createOscillator()
        osc.type = i === 0 ? 'sawtooth' : 'sine'
        osc.frequency.value = freq
        const subGain = ctx.createGain()
        subGain.gain.value = i === 0 ? 0.15 : 0.25
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = 300
        filter.Q.value = 1
        osc.connect(filter)
        filter.connect(subGain)
        subGain.connect(gain)
        osc.start()
        return osc
      })
      gain.gain.setTargetAtTime(0.35, ctx.currentTime, 1.5)
    },
    stop() {
      this.active = false
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.8)
      const refs = oscs
      oscs = []
      setTimeout(() => refs.forEach((o) => { try { o.stop() } catch { /* already stopped */ } }), 2000)
    },
  }
}

function createPadLayer(ctx: AudioContext, dest: AudioNode): AudioLayer {
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(dest)

  let oscs: OscillatorNode[] = []

  return {
    kind: 'pad',
    label: 'Resonance',
    color: '#60a0ff',
    gain,
    active: false,
    start() {
      this.active = true
      oscs = PAD_FREQS.flatMap((freq) => {
        const voices: OscillatorNode[] = []
        for (let d = -4; d <= 4; d += 4) {
          const osc = ctx.createOscillator()
          osc.type = 'sine'
          osc.frequency.value = freq + d
          const sub = ctx.createGain()
          sub.gain.value = 0.08
          osc.connect(sub)
          sub.connect(gain)
          osc.start()
          voices.push(osc)
        }
        return voices
      })
      gain.gain.setTargetAtTime(0.3, ctx.currentTime, 2)
    },
    stop() {
      this.active = false
      gain.gain.setTargetAtTime(0, ctx.currentTime, 1)
      const refs = oscs
      oscs = []
      setTimeout(() => refs.forEach((o) => { try { o.stop() } catch { /* noop */ } }), 2500)
    },
  }
}

function createArpLayer(ctx: AudioContext, dest: AudioNode): AudioLayer {
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(dest)

  let timer: ReturnType<typeof setInterval> | null = null
  let noteIndex = 0

  return {
    kind: 'arp',
    label: 'Pulse Sequence',
    color: '#e0a040',
    gain,
    active: false,
    start() {
      this.active = true
      gain.gain.setTargetAtTime(0.25, ctx.currentTime, 0.5)

      const playNote = () => {
        const freq = ARP_NOTES[noteIndex % ARP_NOTES.length]
        noteIndex++
        const osc = ctx.createOscillator()
        osc.type = 'triangle'
        osc.frequency.value = freq
        const env = ctx.createGain()
        env.gain.value = 0
        env.gain.setTargetAtTime(0.18, ctx.currentTime, 0.05)
        env.gain.setTargetAtTime(0, ctx.currentTime + 0.3, 0.15)
        osc.connect(env)
        env.connect(gain)
        osc.start()
        osc.stop(ctx.currentTime + 1)
      }

      playNote()
      timer = setInterval(playNote, 600)
    },
    stop() {
      this.active = false
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.4)
      if (timer) { clearInterval(timer); timer = null }
    },
  }
}

function createWindLayer(ctx: AudioContext, dest: AudioNode): AudioLayer {
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(dest)

  let bufferSource: AudioBufferSourceNode | null = null

  return {
    kind: 'wind',
    label: 'Atmosphere',
    color: '#e060a0',
    gain,
    active: false,
    start() {
      this.active = true
      const sampleRate = ctx.sampleRate
      const duration = 4
      const buffer = ctx.createBuffer(1, sampleRate * duration, sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5
      }

      bufferSource = ctx.createBufferSource()
      bufferSource.buffer = buffer
      bufferSource.loop = true

      const bandpass = ctx.createBiquadFilter()
      bandpass.type = 'bandpass'
      bandpass.frequency.value = 400
      bandpass.Q.value = 0.5

      const lfo = ctx.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.value = 0.15
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 200
      lfo.connect(lfoGain)
      lfoGain.connect(bandpass.frequency)
      lfo.start()

      bufferSource.connect(bandpass)
      bandpass.connect(gain)
      bufferSource.start()
      gain.gain.setTargetAtTime(0.12, ctx.currentTime, 2)
    },
    stop() {
      this.active = false
      gain.gain.setTargetAtTime(0, ctx.currentTime, 1)
      const ref = bufferSource
      bufferSource = null
      setTimeout(() => { try { ref?.stop() } catch { /* noop */ } }, 2500)
    },
  }
}

function createChimeLayer(ctx: AudioContext, dest: AudioNode): AudioLayer {
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(dest)

  let timer: ReturnType<typeof setInterval> | null = null

  return {
    kind: 'chime',
    label: 'Shimmer',
    color: '#90e870',
    gain,
    active: false,
    start() {
      this.active = true
      gain.gain.setTargetAtTime(0.2, ctx.currentTime, 0.8)

      const playChime = () => {
        const freq = CHIME_FREQS[Math.floor(Math.random() * CHIME_FREQS.length)]
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = freq
        const env = ctx.createGain()
        env.gain.value = 0
        env.gain.setTargetAtTime(0.12, ctx.currentTime, 0.02)
        env.gain.setTargetAtTime(0, ctx.currentTime + 0.1, 0.6)
        const filter = ctx.createBiquadFilter()
        filter.type = 'highpass'
        filter.frequency.value = 800
        osc.connect(filter)
        filter.connect(env)
        env.connect(gain)
        osc.start()
        osc.stop(ctx.currentTime + 2.5)
      }

      playChime()
      timer = setInterval(playChime, 1200 + Math.random() * 800)
    },
    stop() {
      this.active = false
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.6)
      if (timer) { clearInterval(timer); timer = null }
    },
  }
}

export interface AudioEngine {
  ctx: AudioContext
  master: GainNode
  layers: AudioLayer[]
  resume: () => Promise<void>
  dispose: () => void
}

export function createAudioEngine(): AudioEngine {
  const ctx = new AudioContext()

  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = -24
  compressor.knee.value = 12
  compressor.ratio.value = 4
  compressor.connect(ctx.destination)

  const reverb = ctx.createConvolver()
  const reverbGain = ctx.createGain()
  reverbGain.gain.value = 0.3
  reverb.connect(reverbGain)
  reverbGain.connect(compressor)

  const sampleRate = ctx.sampleRate
  const length = sampleRate * 3
  const impulse = ctx.createBuffer(2, length, sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.8))
    }
  }
  reverb.buffer = impulse

  const master = ctx.createGain()
  master.gain.value = 0.7
  master.connect(compressor)
  master.connect(reverb)

  const layers: AudioLayer[] = [
    createDroneLayer(ctx, master),
    createPadLayer(ctx, master),
    createArpLayer(ctx, master),
    createWindLayer(ctx, master),
    createChimeLayer(ctx, master),
  ]

  return {
    ctx,
    master,
    layers,
    async resume() {
      if (ctx.state === 'suspended') await ctx.resume()
    },
    dispose() {
      layers.forEach((l) => { if (l.active) l.stop() })
      ctx.close()
    },
  }
}
