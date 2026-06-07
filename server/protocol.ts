export const ASR_SAMPLE_RATE = 16_000

export type ClientMessage =
  | {
      type: 'start'
      sampleRate: number
    }
  | {
      type: 'stop'
    }

export type ServerMessage =
  | {
      type: 'ready'
      engine: string
      sampleRate: number
    }
  | {
      type: 'partial'
      text: string
    }
  | {
      type: 'final'
      text: string
    }
  | {
      type: 'error'
      message: string
      recoverable: boolean
    }
