import { createWriteStream } from 'node:fs'
import { mkdir, rename, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const repo = 'reazon-research/reazonspeech-k2-v2'
const revision = 'main'
const targetDir = resolve('models/reazonspeech-k2-v2-int8')
const files = [
  'encoder-epoch-99-avg-1.int8.onnx',
  'decoder-epoch-99-avg-1.int8.onnx',
  'joiner-epoch-99-avg-1.int8.onnx',
  'tokens.txt',
]

const downloadUrl = (file) =>
  `https://huggingface.co/${repo}/resolve/${revision}/${encodeURIComponent(file)}?download=true`

const localFileSize = async (path) => {
  try {
    const result = await stat(path)
    return result.isFile() ? result.size : 0
  } catch {
    return 0
  }
}

const remoteFileSize = async (file) => {
  const response = await fetch(downloadUrl(file), {
    method: 'HEAD',
    redirect: 'follow',
    headers: {
      'User-Agent': 'KanaReaderModelDownloader/1.0',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to check ${file}: HTTP ${response.status}`)
  }

  return Number(response.headers.get('content-length') ?? 0)
}

const downloadFile = async (file) => {
  const destination = join(targetDir, file)
  const temporaryDestination = `${destination}.download`
  const expectedSize = await remoteFileSize(file)
  const existingSize = await localFileSize(destination)

  if ((expectedSize > 0 && existingSize === expectedSize) || (expectedSize === 0 && existingSize > 0)) {
    console.log(`✓ ${file} already exists (${existingSize} bytes)`)
    return
  }

  if (existingSize > 0 && expectedSize > 0) {
    console.log(`↻ Re-downloading ${file}: local ${existingSize} bytes, expected ${expectedSize} bytes`)
  }

  console.log(`↓ Downloading ${file}`)
  const response = await fetch(downloadUrl(file), {
    redirect: 'follow',
    headers: {
      'User-Agent': 'KanaReaderModelDownloader/1.0',
    },
  })

  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${file}: HTTP ${response.status}`)
  }

  await mkdir(dirname(destination), { recursive: true })
  await pipeline(Readable.fromWeb(response.body), createWriteStream(temporaryDestination))

  const downloadedSize = await localFileSize(temporaryDestination)
  if (expectedSize > 0 && downloadedSize !== expectedSize) {
    throw new Error(
      `Incomplete download for ${file}: got ${downloadedSize} bytes, expected ${expectedSize} bytes`,
    )
  }

  await rename(temporaryDestination, destination)
  console.log(`✓ Saved ${destination}`)
}

const envExample = `# Kana Reader local ASR model
KANA_ASR_MODE=offline
KANA_ASR_MODEL_TYPE=transducer
KANA_ASR_ENCODER=./models/reazonspeech-k2-v2-int8/encoder-epoch-99-avg-1.int8.onnx
KANA_ASR_DECODER=./models/reazonspeech-k2-v2-int8/decoder-epoch-99-avg-1.int8.onnx
KANA_ASR_JOINER=./models/reazonspeech-k2-v2-int8/joiner-epoch-99-avg-1.int8.onnx
KANA_ASR_TOKENS=./models/reazonspeech-k2-v2-int8/tokens.txt
KANA_ASR_THREADS=2
`

await mkdir(targetDir, { recursive: true })

for (const file of files) {
  await downloadFile(file)
}

await writeFile(join(targetDir, '.env.example'), envExample, 'utf8')
await writeFile(resolve('.env.local'), envExample, 'utf8')

console.log('')
console.log('Model downloaded.')
console.log('Also wrote .env.local with local ASR settings.')
console.log('Use these env vars when starting the ASR server:')
console.log(envExample)
