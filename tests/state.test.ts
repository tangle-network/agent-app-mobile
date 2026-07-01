import { describe, expect, it } from 'vitest'
import { mobileChatReducer, type MobileChatState } from '../src/state'

describe('mobile chat reducer', () => {
  it('accumulates streamed assistant text and usage', () => {
    let state: MobileChatState = { messages: [] }
    state = mobileChatReducer(state, { type: 'begin-assistant', id: 'a1' })
    state = mobileChatReducer(state, { type: 'text-delta', id: 'a1', delta: 'hello ' })
    state = mobileChatReducer(state, { type: 'text-delta', id: 'a1', delta: 'world' })
    state = mobileChatReducer(state, { type: 'usage', id: 'a1', promptTokens: 2, completionTokens: 3 })

    expect(state.messages[0]).toMatchObject({
      id: 'a1',
      role: 'assistant',
      content: 'hello world',
      promptTokens: 2,
      completionTokens: 3,
    })
  })

  it('updates tool call state by id', () => {
    let state: MobileChatState = { messages: [] }
    state = mobileChatReducer(state, { type: 'begin-assistant', id: 'a1' })
    state = mobileChatReducer(state, {
      type: 'tool-call',
      id: 'a1',
      call: { toolCallId: 'tc1', toolName: 'sandbox_run_command', args: { command: 'ls' } },
    })
    state = mobileChatReducer(state, {
      type: 'tool-result',
      id: 'a1',
      result: { toolCallId: 'tc1', toolName: 'sandbox_run_command', outcome: { ok: true, result: { stdout: 'ok' } } },
    })

    expect(state.messages[0]?.toolCalls?.[0]).toMatchObject({
      id: 'tc1',
      name: 'sandbox_run_command',
      status: 'done',
    })
  })
})
