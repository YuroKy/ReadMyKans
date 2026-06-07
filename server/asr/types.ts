export interface AsrSession {
  acceptAudio(samples: Float32Array): AsrResult | null
  finish(): AsrResult | null
  close(): void
}

export interface AsrResult {
  text: string
  isFinal: boolean
}

export interface AsrEngine {
  readonly name: string
  readonly sampleRate: number
  createSession(): AsrSession
  close(): void
}
