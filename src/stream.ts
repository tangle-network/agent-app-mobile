export interface ChatStreamToolCall {
  toolCallId?: string
  toolName: string
  args: Record<string, unknown>
}

export interface ChatStreamToolResult {
  toolCallId?: string
  toolName?: string
  label?: string
  outcome: { ok: boolean; result?: unknown; code?: string; message?: string }
}

export interface ChatStreamCallbacks {
  onTurnId?: (turnId: string) => void
  onText?: (delta: string) => void
  onReasoning?: (delta: string) => void
  onToolCall?: (call: ChatStreamToolCall) => void
  onToolResult?: (result: ChatStreamToolResult) => void
  onUsage?: (usage: { promptTokens: number; completionTokens: number }) => void
  onMetadata?: (data: Record<string, unknown>) => void
  onErrorEvent?: (message: string) => void
}

export interface ConsumeChatStreamResult {
  turnId: string | null
  receivedContent: boolean
}

export interface AgentAppChatResponse {
  ok: boolean
  status: number
  body?: ReadableStream<Uint8Array> | null
  json?: () => Promise<unknown>
  text?: () => Promise<string>
}

export interface StreamAgentAppTurnOptions {
  start: () => Promise<AgentAppChatResponse>
  resume?: (turnId: string, fromSeq: number) => Promise<AgentAppChatResponse>
  callbacks: ChatStreamCallbacks
  onResetForResume?: () => void
}

export interface AgentAppChatClientOptions {
  baseUrl: string
  streamPath?: string
  resumePath?: (turnId: string, fromSeq: number) => string
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>)
  fetchImpl?: typeof fetch
}

export interface StartChatInput {
  message: string
  [key: string]: unknown
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null
}

async function errorMessage(res: AgentAppChatResponse): Promise<string> {
  const fromJson = await res.json?.().catch(() => null)
  const json = asRecord(fromJson)
  if (typeof json?.error === 'string') return json.error
  const text = await res.text?.().catch(() => '')
  return text || `HTTP ${res.status}`
}

export function dispatchChatStreamLine(line: string, cb: ChatStreamCallbacks): {
  turnId?: string
  receivedContent: boolean
} {
  let receivedContent = false
  let turnId: string | undefined
  if (!line.trim()) return { receivedContent }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(line) as Record<string, unknown>
  } catch {
    return { receivedContent }
  }

  if (parsed.kind === 'tool_result') {
    cb.onToolResult?.({
      toolCallId: parsed.toolCallId as string | undefined,
      toolName: parsed.toolName as string | undefined,
      label: parsed.label as string | undefined,
      outcome: (parsed.outcome ?? parsed.result) as ChatStreamToolResult['outcome'],
    })
    return { receivedContent: true }
  }

  const evt = (parsed.kind === 'event' ? parsed.event : parsed) as Record<string, unknown>
  if (!evt || typeof evt !== 'object') return { receivedContent }

  switch (evt.type) {
    case 'turn':
      if (typeof evt.turnId === 'string') turnId = evt.turnId
      break
    case 'text':
      if (typeof evt.text === 'string') {
        cb.onText?.(evt.text)
        receivedContent = true
      }
      break
    case 'reasoning':
      if (typeof evt.text === 'string') {
        cb.onReasoning?.(evt.text)
        receivedContent = true
      }
      break
    case 'tool_call': {
      const call = (evt.call ?? evt) as Record<string, unknown>
      cb.onToolCall?.({
        toolCallId: (call.toolCallId ?? call.id) as string | undefined,
        toolName: String(call.toolName ?? call.name ?? 'unknown'),
        args: (call.args ?? {}) as Record<string, unknown>,
      })
      receivedContent = true
      break
    }
    case 'tool_result':
      cb.onToolResult?.({
        toolCallId: evt.toolCallId as string | undefined,
        toolName: evt.toolName as string | undefined,
        label: evt.label as string | undefined,
        outcome: (evt.outcome ?? evt.result) as ChatStreamToolResult['outcome'],
      })
      receivedContent = true
      break
    case 'usage': {
      const usage = evt.usage as { promptTokens?: number; completionTokens?: number } | undefined
      if (usage) {
        cb.onUsage?.({
          promptTokens: usage.promptTokens ?? 0,
          completionTokens: usage.completionTokens ?? 0,
        })
      }
      break
    }
    case 'metadata':
      cb.onMetadata?.((evt.data ?? {}) as Record<string, unknown>)
      break
    case 'error':
      cb.onErrorEvent?.(String(evt.details ?? evt.error ?? 'Unknown stream error'))
      break
    default:
      break
  }

  return { turnId, receivedContent }
}

export function consumeChatText(text: string, cb: ChatStreamCallbacks): ConsumeChatStreamResult {
  let turnId: string | null = null
  let receivedContent = false
  for (const line of text.split('\n')) {
    const result = dispatchChatStreamLine(line, cb)
    if (result.turnId) {
      turnId = result.turnId
      cb.onTurnId?.(result.turnId)
    }
    if (result.receivedContent) receivedContent = true
  }
  return { turnId, receivedContent }
}

function decodeChunk(decoder: TextDecoder | null, value: Uint8Array): string {
  if (decoder) return decoder.decode(value, { stream: true })
  let text = ''
  for (const byte of value) text += String.fromCharCode(byte)
  return text
}

export async function consumeChatStream(
  body: ReadableStream<Uint8Array>,
  cb: ChatStreamCallbacks,
): Promise<ConsumeChatStreamResult> {
  const reader = body.getReader()
  const decoder = typeof TextDecoder === 'undefined' ? null : new TextDecoder()
  let buffer = ''
  let turnId: string | null = null
  let receivedContent = false

  const handle = (line: string) => {
    const result = dispatchChatStreamLine(line, cb)
    if (result.turnId) {
      turnId = result.turnId
      cb.onTurnId?.(result.turnId)
    }
    if (result.receivedContent) receivedContent = true
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (done) {
      if (buffer.trim()) handle(buffer)
      break
    }
    buffer += decodeChunk(decoder, value)
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) handle(line)
  }

  return { turnId, receivedContent }
}

async function consumeResponse(
  res: AgentAppChatResponse,
  cb: ChatStreamCallbacks,
): Promise<ConsumeChatStreamResult> {
  if (!res.ok) throw new Error(await errorMessage(res))
  if (res.body && typeof res.body.getReader === 'function') return consumeChatStream(res.body, cb)
  const text = await res.text?.()
  if (text !== undefined) return consumeChatText(text, cb)
  throw new Error('Chat response has no readable body')
}

export async function streamAgentAppTurn(opts: StreamAgentAppTurnOptions): Promise<ConsumeChatStreamResult> {
  let turnId: string | null = null
  const callbacks: ChatStreamCallbacks = {
    ...opts.callbacks,
    onTurnId: (id) => {
      turnId = id
      opts.callbacks.onTurnId?.(id)
    },
  }

  try {
    return await consumeResponse(await opts.start(), callbacks)
  } catch (err) {
    if (!turnId || !opts.resume) throw err
    opts.onResetForResume?.()
    return consumeResponse(await opts.resume(turnId, 0), callbacks)
  }
}

export function createAgentAppChatClient(opts: AgentAppChatClientOptions) {
  const fetchImpl = opts.fetchImpl ?? fetch
  const streamPath = opts.streamPath ?? '/api/chat/stream'
  const resumePath = opts.resumePath ?? ((turnId, fromSeq) => `/api/chat/stream/${encodeURIComponent(turnId)}?fromSeq=${fromSeq}`)

  async function headers(): Promise<HeadersInit> {
    return typeof opts.headers === 'function' ? opts.headers() : opts.headers ?? {}
  }

  function url(path: string): string {
    return new URL(path, opts.baseUrl).toString()
  }

  return {
    async start(input: StartChatInput): Promise<AgentAppChatResponse> {
      return fetchImpl(url(streamPath), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await headers()),
        },
        body: JSON.stringify(input),
      })
    },
    async resume(turnId: string, fromSeq: number): Promise<AgentAppChatResponse> {
      return fetchImpl(url(resumePath(turnId, fromSeq)), {
        method: 'GET',
        headers: await headers(),
      })
    },
  }
}
