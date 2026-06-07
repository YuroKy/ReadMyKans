import { createSherpaEngine, getSherpaEngineStatus } from './sherpaEngine.js'
import type { AsrEngine } from './types.js'

export interface EngineFactoryResult {
  engine: AsrEngine | null
  message: string
  missing: string[]
}

export const createAsrEngine = (): EngineFactoryResult => {
  const status = getSherpaEngineStatus()

  if (!status.ready) {
    return {
      engine: null,
      message: status.message,
      missing: status.missing,
    }
  }

  try {
    return {
      engine: createSherpaEngine(),
      message: status.message,
      missing: [],
    }
  } catch (error) {
    return {
      engine: null,
      message: error instanceof Error ? error.message : 'Не вдалося ініціалізувати sherpa-onnx.',
      missing: [],
    }
  }
}
