import type { Move } from 'chess.js'

let ctx: AudioContext | null = null
let unlocked = false

function getContext() {
  if (!ctx) {
    ctx = new AudioContext()
  }
  return ctx
}

/** Call once after user interacts so browsers allow audio. */
export function unlockMoveSounds() {
  const audio = getContext()
  if (audio.state === 'suspended') {
    void audio.resume()
  }
  unlocked = true
}

function tone(
  frequency: number,
  durationSec: number,
  volume: number,
  type: OscillatorType = 'sine',
) {
  if (!unlocked) return
  const audio = getContext()
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, audio.currentTime)
  gain.gain.setValueAtTime(0, audio.currentTime)
  gain.gain.linearRampToValueAtTime(volume, audio.currentTime + 0.008)
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audio.currentTime + durationSec,
  )
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(audio.currentTime)
  osc.stop(audio.currentTime + durationSec)
}

export function playMoveSound(move: Move) {
  unlockMoveSounds()
  const captured = Boolean(move.captured)
  const isCheck = move.san.includes('+') || move.san.includes('#')

  if (captured) {
    tone(220, 0.1, 0.22, 'triangle')
    tone(165, 0.12, 0.14, 'sine')
    return
  }

  if (isCheck) {
    tone(520, 0.07, 0.16, 'sine')
    tone(780, 0.09, 0.1, 'triangle')
    return
  }

  tone(340, 0.055, 0.14, 'triangle')
}
