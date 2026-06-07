import { createServer } from 'node:http'
import { WebSocketServer, WebSocket } from 'ws'
import { ASR_SAMPLE_RATE, type ClientMessage, type ServerMessage } from './protocol.js'
import { createAsrEngine } from './asr/createEngine.js'
import type { AsrEngine, AsrSession } from './asr/types.js'

const port = Number(process.env.KANA_ASR_PORT ?? 3001)
const host = process.env.KANA_ASR_HOST ?? '0.0.0.0'
const engineResult = createAsrEngine()
const engine = engineResult.engine

const sendJson = (socket: WebSocket, message: ServerMessage) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message))
  }
}

const parseClientMessage = (data: WebSocket.RawData): ClientMessage | null => {
  const raw = Array.isArray(data) ? Buffer.concat(data).toString('utf8') : data.toString()

  try {
    return JSON.parse(raw) as ClientMessage
  } catch {
    return null
  }
}

// CORS: дозволяємо фронтенду (інший порт) опитувати /health
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const createHttpServer = (asrEngine: AsrEngine | null) =>
  createServer((request, response) => {
    if (request.method === 'OPTIONS') {
      response.writeHead(204, corsHeaders)
      response.end()
      return
    }

    if (request.url === '/health') {
      response.writeHead(asrEngine ? 200 : 503, {
        'Content-Type': 'application/json; charset=utf-8',
        ...corsHeaders,
      })
      response.end(
        JSON.stringify({
          ok: Boolean(asrEngine),
          engine: asrEngine?.name ?? null,
          // Витягуємо режим (online/offline) з імені двигуна для UI
          mode: asrEngine?.name.includes('offline') ? 'offline' : asrEngine ? 'online' : null,
          sampleRate: ASR_SAMPLE_RATE,
          message: engineResult.message,
          missing: engineResult.missing,
        }),
      )
      return
    }

    response.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders })
    response.end(JSON.stringify({ error: 'Not found' }))
  })

const server = createHttpServer(engine)
const wss = new WebSocketServer({ server, path: '/asr' })

wss.on('connection', (socket) => {
  let session: AsrSession | null = null

  if (!engine) {
    sendJson(socket, {
      type: 'error',
      message: engineResult.message,
      recoverable: true,
    })
    socket.close(1013, 'ASR engine is not configured')
    return
  }

  sendJson(socket, {
    type: 'ready',
    engine: engine.name,
    sampleRate: engine.sampleRate,
  })

  socket.on('message', (data, isBinary) => {
    if (!isBinary) {
      const message = parseClientMessage(data)

      if (message?.type === 'start') {
        session?.close()
        session = engine.createSession()
        return
      }

      if (message?.type === 'stop') {
        const result = session?.finish()
        if (result) {
          sendJson(socket, { type: 'final', text: result.text })
        }
        session?.close()
        session = null
      }

      return
    }

    if (!session) {
      session = engine.createSession()
    }

    const buffer = Buffer.isBuffer(data) ? data : Buffer.concat(Array.isArray(data) ? data : [Buffer.from(data)])
    const samples = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / Float32Array.BYTES_PER_ELEMENT)
    const result = session.acceptAudio(samples)

    if (!result) {
      return
    }

    sendJson(socket, {
      type: result.isFinal ? 'final' : 'partial',
      text: result.text,
    })
  })

  socket.on('close', () => {
    session?.close()
    session = null
  })

  socket.on('error', () => {
    session?.close()
    session = null
  })
})

server.listen(port, host, () => {
  const status = engine ? `${engine.name} ready` : `ASR unavailable: ${engineResult.message}`
  console.log(`Kana Reader ASR server listening on http://${host}:${port} (${status})`)
})
