import { describe, expect, it, vi } from 'vitest'
import {
  consumeChatText,
  createAgentAppChatClient,
  dispatchChatStreamLine,
  streamAgentAppTurn,
  type AgentAppChatResponse,
} from '../src/stream'

function response(text: string, ok = true): AgentAppChatResponse {
  return {
    ok,
    status: ok ? 200 : 500,
    text: async () => text,
    json: async () => ({ error: text }),
  }
}

describe('mobile chat stream parser', () => {
  it('dispatches text, reasoning, tool calls, tool results, usage, and metadata', () => {
    const cb = {
      onText: vi.fn(),
      onReasoning: vi.fn(),
      onToolCall: vi.fn(),
      onToolResult: vi.fn(),
      onUsage: vi.fn(),
      onMetadata: vi.fn(),
    }

    consumeChatText([
      JSON.stringify({ type: 'turn', turnId: 't1' }),
      JSON.stringify({ kind: 'event', event: { type: 'text', text: 'hi' } }),
      JSON.stringify({ type: 'reasoning', text: 'thinking' }),
      JSON.stringify({ type: 'tool_call', call: { id: 'call_1', name: 'submit_proposal', args: { type: 'x' } } }),
      JSON.stringify({ kind: 'tool_result', toolCallId: 'call_1', toolName: 'submit_proposal', outcome: { ok: true, result: { id: 'p1' } } }),
      JSON.stringify({ type: 'usage', usage: { promptTokens: 2, completionTokens: 3 } }),
      JSON.stringify({ type: 'metadata', data: { modelUsed: 'openai/gpt-5' } }),
    ].join('\n'), cb)

    expect(cb.onText).toHaveBeenCalledWith('hi')
    expect(cb.onReasoning).toHaveBeenCalledWith('thinking')
    expect(cb.onToolCall).toHaveBeenCalledWith({ toolCallId: 'call_1', toolName: 'submit_proposal', args: { type: 'x' } })
    expect(cb.onToolResult).toHaveBeenCalledWith({ toolCallId: 'call_1', toolName: 'submit_proposal', label: undefined, outcome: { ok: true, result: { id: 'p1' } } })
    expect(cb.onUsage).toHaveBeenCalledWith({ promptTokens: 2, completionTokens: 3 })
    expect(cb.onMetadata).toHaveBeenCalledWith({ modelUsed: 'openai/gpt-5' })
  })

  it('ignores torn or unknown lines', () => {
    const onText = vi.fn()
    const result = dispatchChatStreamLine('{nope', { onText })

    expect(result.receivedContent).toBe(false)
    expect(onText).not.toHaveBeenCalled()
  })

  it('resumes from the beginning after a dropped transport with a turn id', async () => {
    const onText = vi.fn()
    let starts = 0

    await streamAgentAppTurn({
      start: async () => {
        starts += 1
        if (starts === 1) {
          let pulled = false
          return {
            ok: true,
            status: 200,
            body: new ReadableStream<Uint8Array>({
              pull(controller) {
                if (pulled) {
                  controller.error(new Error('drop'))
                  return
                }
                pulled = true
                controller.enqueue(new TextEncoder().encode(`${JSON.stringify({ type: 'turn', turnId: 't1' })}\n`))
              },
            }),
          }
        }
        return response('')
      },
      resume: async () => response(`${JSON.stringify({ type: 'text', text: 'replayed' })}\n`),
      callbacks: { onText },
    })

    expect(onText).toHaveBeenCalledWith('replayed')
  })

  it('passes request abort signals through start and resume fetches', async () => {
    const fetchImpl = vi.fn(async () => response('{}'))
    const client = createAgentAppChatClient({
      baseUrl: 'https://agent.example',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })
    const controller = new AbortController()

    await client.start({ message: 'hi' }, { signal: controller.signal })
    await client.resume('turn_1', 3, { signal: controller.signal })

    expect(fetchImpl).toHaveBeenNthCalledWith(1, 'https://agent.example/api/chat/stream', expect.objectContaining({
      method: 'POST',
      signal: controller.signal,
    }))
    expect(fetchImpl).toHaveBeenNthCalledWith(2, 'https://agent.example/api/chat/stream/turn_1?fromSeq=3', expect.objectContaining({
      method: 'GET',
      signal: controller.signal,
    }))
  })
})
