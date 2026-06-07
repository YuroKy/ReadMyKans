import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { ASR_SAMPLE_RATE } from '../protocol.js'
import type { AsrEngine, AsrResult, AsrSession } from './types.js'

type SherpaOnlineRecognizerResult = {
  text?: string
  is_final?: boolean
}

type SherpaOfflineRecognizerResult = {
  text?: string
}

type SherpaOnlineStream = {
  acceptWaveform: (waveform: { samples: Float32Array; sampleRate: number }) => void
  inputFinished: () => void
}

type SherpaOfflineStream = {
  acceptWaveform: (waveform: { samples: Float32Array; sampleRate: number }) => void
}

type SherpaOnlineRecognizer = {
  createStream: () => SherpaOnlineStream
  isReady: (stream: SherpaOnlineStream) => boolean
  decode: (stream: SherpaOnlineStream) => void
  isEndpoint: (stream: SherpaOnlineStream) => boolean
  reset: (stream: SherpaOnlineStream) => void
  getResult: (stream: SherpaOnlineStream) => SherpaOnlineRecognizerResult
}

type SherpaOfflineRecognizer = {
  createStream: () => SherpaOfflineStream
  decode: (stream: SherpaOfflineStream) => void
  getResult: (stream: SherpaOfflineStream) => SherpaOfflineRecognizerResult
}

type SherpaModule = {
  OnlineRecognizer: new (config: Record<string, unknown>) => SherpaOnlineRecognizer
  OfflineRecognizer: new (config: Record<string, unknown>) => SherpaOfflineRecognizer
}

export type SherpaModelType = 'zipformer2Ctc' | 'nemoCtc' | 'paraformer' | 'transducer'
export type SherpaRecognitionMode = 'online' | 'offline'

interface SherpaModelConfigResult {
  config: Record<string, unknown>
  required: Record<string, string>
}

export interface SherpaEngineStatus {
  ready: boolean
  message: string
  missing: string[]
}

const require = createRequire(import.meta.url)
const defaultReazonModelDir = resolve('models/reazonspeech-k2-v2-int8')
const defaultReazonModel = {
  encoder: resolve(defaultReazonModelDir, 'encoder-epoch-99-avg-1.int8.onnx'),
  decoder: resolve(defaultReazonModelDir, 'decoder-epoch-99-avg-1.int8.onnx'),
  joiner: resolve(defaultReazonModelDir, 'joiner-epoch-99-avg-1.int8.onnx'),
  tokens: resolve(defaultReazonModelDir, 'tokens.txt'),
}

const hasDefaultReazonModel = () =>
  Object.values(defaultReazonModel).every((path) => existsSync(path))

const envPath = (name: string, fallback = '') => {
  const value = process.env[name]
  return value ? resolve(value) : fallback
}

const validateFiles = (paths: Record<string, string>) =>
  Object.entries(paths)
    .filter(([, value]) => !value || !existsSync(value))
    .map(([name]) => name)

const modelType = (): SherpaModelType =>
  (process.env.KANA_ASR_MODEL_TYPE as SherpaModelType | undefined) ??
  (hasDefaultReazonModel() ? 'transducer' : 'zipformer2Ctc')

const recognitionMode = (): SherpaRecognitionMode =>
  (process.env.KANA_ASR_MODE as SherpaRecognitionMode | undefined) ??
  (hasDefaultReazonModel() ? 'offline' : 'online')

const createModelConfig = (): SherpaModelConfigResult => {
  const tokens = envPath('KANA_ASR_TOKENS', hasDefaultReazonModel() ? defaultReazonModel.tokens : '')
  const type = modelType()

  if (type === 'transducer') {
    const useDefault = hasDefaultReazonModel()
    const encoder = envPath('KANA_ASR_ENCODER', useDefault ? defaultReazonModel.encoder : '')
    const decoder = envPath('KANA_ASR_DECODER', useDefault ? defaultReazonModel.decoder : '')
    const joiner = envPath('KANA_ASR_JOINER', useDefault ? defaultReazonModel.joiner : '')
    return {
      config: {
        transducer: { encoder, decoder, joiner },
        tokens,
      },
      required: { KANA_ASR_TOKENS: tokens, KANA_ASR_ENCODER: encoder, KANA_ASR_DECODER: decoder, KANA_ASR_JOINER: joiner },
    }
  }

  if (type === 'paraformer') {
    const encoder = envPath('KANA_ASR_ENCODER')
    const decoder = envPath('KANA_ASR_DECODER')
    return {
      config: {
        paraformer: { encoder, decoder },
        tokens,
      },
      required: { KANA_ASR_TOKENS: tokens, KANA_ASR_ENCODER: encoder, KANA_ASR_DECODER: decoder },
    }
  }

  const model = envPath('KANA_ASR_MODEL')
  return {
    config: {
      [type]: { model },
      tokens,
    },
    required: { KANA_ASR_TOKENS: tokens, KANA_ASR_MODEL: model },
  }
}

export const getSherpaEngineStatus = (): SherpaEngineStatus => {
  const { required } = createModelConfig()
  const missing = validateFiles(required)

  if (missing.length > 0) {
    return {
      ready: false,
      missing,
      message:
        'Локальний ASR сервер запущений, але модель sherpa-onnx не знайдена. Виконайте npm run models:download або вкажіть env-шляхи до model/tokens.',
    }
  }

  return {
    ready: true,
    missing: [],
    message: 'sherpa-onnx модель налаштована.',
  }
}

export class SherpaOnlineAsrEngine implements AsrEngine {
  readonly name = `sherpa-onnx:${modelType()}`
  readonly sampleRate = ASR_SAMPLE_RATE
  private recognizer: SherpaOnlineRecognizer

  constructor() {
    const sherpa = require('sherpa-onnx-node') as SherpaModule
    const { config: modelConfig } = createModelConfig()
    const numThreads = Number(process.env.KANA_ASR_THREADS ?? 4)

    this.recognizer = new sherpa.OnlineRecognizer({
      featConfig: {
        sampleRate: ASR_SAMPLE_RATE,
        featureDim: 80,
      },
      modelConfig: {
        ...modelConfig,
        numThreads,
        provider: process.env.KANA_ASR_PROVIDER ?? 'cpu',
        debug: process.env.KANA_ASR_DEBUG === '1' ? 1 : 0,
      },
      decodingMethod: process.env.KANA_ASR_DECODING_METHOD ?? 'greedy_search',
      maxActivePaths: Number(process.env.KANA_ASR_MAX_ACTIVE_PATHS ?? 4),
      enableEndpoint: 1,
      rule1MinTrailingSilence: Number(process.env.KANA_ASR_ENDPOINT_SILENCE_SEC ?? 0.35),
      rule2MinTrailingSilence: Number(process.env.KANA_ASR_ENDPOINT_SILENCE_SEC ?? 0.35),
      rule3MinUtteranceLength: Number(process.env.KANA_ASR_ENDPOINT_UTTERANCE_SEC ?? 10),
    })
  }

  createSession(): AsrSession {
    return new SherpaOnlineAsrSession(this.recognizer, this.sampleRate)
  }

  close() {
    // The node addon does not expose an explicit recognizer destroy method.
  }
}

export class SherpaOfflineAsrEngine implements AsrEngine {
  readonly name = `sherpa-onnx-offline:${modelType()}`
  readonly sampleRate = ASR_SAMPLE_RATE
  private recognizer: SherpaOfflineRecognizer

  constructor() {
    const sherpa = require('sherpa-onnx-node') as SherpaModule
    const { config: modelConfig } = createModelConfig()
    const numThreads = Number(process.env.KANA_ASR_THREADS ?? 4)

    this.recognizer = new sherpa.OfflineRecognizer({
      featConfig: {
        sampleRate: ASR_SAMPLE_RATE,
        featureDim: 80,
      },
      modelConfig: {
        ...modelConfig,
        numThreads,
        provider: process.env.KANA_ASR_PROVIDER ?? 'cpu',
        debug: process.env.KANA_ASR_DEBUG === '1' ? 1 : 0,
      },
    })
  }

  createSession(): AsrSession {
    return new SherpaOfflineAsrSession(this.recognizer, this.sampleRate)
  }

  close() {
    // The node addon does not expose an explicit recognizer destroy method.
  }
}

class SherpaOnlineAsrSession implements AsrSession {
  private stream: SherpaOnlineStream
  private committedText = ''
  private lastText = ''

  constructor(
    private recognizer: SherpaOnlineRecognizer,
    private sampleRate: number,
  ) {
    this.stream = recognizer.createStream()
  }

  acceptAudio(samples: Float32Array): AsrResult | null {
    this.stream.acceptWaveform({ samples, sampleRate: this.sampleRate })

    let decoded = false
    while (this.recognizer.isReady(this.stream)) {
      this.recognizer.decode(this.stream)
      decoded = true
    }

    if (!decoded) {
      return null
    }

    const result = this.recognizer.getResult(this.stream)
    const text = result.text?.trim() ?? ''

    if (text === this.lastText && !this.recognizer.isEndpoint(this.stream)) {
      return null
    }

    this.lastText = text

    if (this.recognizer.isEndpoint(this.stream)) {
      const finalText = [this.committedText, text].filter(Boolean).join('')
      this.committedText = finalText
      this.recognizer.reset(this.stream)
      this.lastText = ''
      return { text: finalText, isFinal: true }
    }

    return {
      text: [this.committedText, text].filter(Boolean).join(''),
      isFinal: Boolean(result.is_final),
    }
  }

  finish(): AsrResult | null {
    this.stream.inputFinished()

    while (this.recognizer.isReady(this.stream)) {
      this.recognizer.decode(this.stream)
    }

    const result = this.recognizer.getResult(this.stream)
    const text = [this.committedText, result.text?.trim() ?? ''].filter(Boolean).join('')
    return text ? { text, isFinal: true } : null
  }

  close() {
    this.finish()
  }
}

class SherpaOfflineAsrSession implements AsrSession {
  private chunks: Float32Array[] = []
  // bufferedSamples — скільки семплів реально зберігається в chunks (після trim)
  private bufferedSamples = 0
  // totalSamples — монотонно зростаючий лічильник для частоти декодування
  private totalSamples = 0
  private lastDecodeSamples = 0
  private lastText = ''
  private readonly decodeEverySamples: number
  // Максимальне вікно контексту: не перераховуємо більше N секунд аудіо
  private readonly maxContextSamples: number

  constructor(
    private recognizer: SherpaOfflineRecognizer,
    private sampleRate: number,
  ) {
    this.decodeEverySamples = Math.floor(
      sampleRate * Number(process.env.KANA_ASR_OFFLINE_PARTIAL_SEC ?? 0.9),
    )
    this.maxContextSamples = Math.floor(
      sampleRate * Number(process.env.KANA_ASR_OFFLINE_MAX_CONTEXT_SEC ?? 10),
    )
  }

  acceptAudio(samples: Float32Array): AsrResult | null {
    this.chunks.push(new Float32Array(samples))
    this.bufferedSamples += samples.length
    this.totalSamples += samples.length

    // Обрізаємо старі chunks щоб буфер не перевищував вікно контексту.
    // Це виправляє O(n²): decodeAccumulated завжди обробляє ≤ maxContextSamples.
    while (this.chunks.length > 1 && this.bufferedSamples > this.maxContextSamples) {
      this.bufferedSamples -= this.chunks.shift()!.length
    }

    if (this.totalSamples - this.lastDecodeSamples < this.decodeEverySamples) {
      return null
    }

    this.lastDecodeSamples = this.totalSamples
    const text = this.decodeAccumulated()

    if (!text || text === this.lastText) {
      return null
    }

    this.lastText = text
    return { text, isFinal: false }
  }

  finish(): AsrResult | null {
    const text = this.decodeAccumulated()
    return text ? { text, isFinal: true } : null
  }

  close() {
    this.chunks = []
    this.bufferedSamples = 0
    this.totalSamples = 0
    this.lastDecodeSamples = 0
    this.lastText = ''
  }

  private decodeAccumulated() {
    if (this.bufferedSamples === 0) {
      return ''
    }

    const samples = new Float32Array(this.bufferedSamples)
    let offset = 0

    for (const chunk of this.chunks) {
      samples.set(chunk, offset)
      offset += chunk.length
    }

    const stream = this.recognizer.createStream()
    stream.acceptWaveform({ samples, sampleRate: this.sampleRate })
    this.recognizer.decode(stream)
    return this.recognizer.getResult(stream).text?.trim() ?? ''
  }
}

export const createSherpaEngine = () =>
  recognitionMode() === 'offline' ? new SherpaOfflineAsrEngine() : new SherpaOnlineAsrEngine()
