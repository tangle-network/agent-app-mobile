import { useCallback, useMemo, useReducer, useState, type Dispatch } from 'react'
import type { ChatStreamCallbacks, ChatStreamToolCall, ChatStreamToolResult } from './stream'
import type { MobileChatMessage, MobileToolCall } from './types'

export interface MobileChatState {
  messages: MobileChatMessage[]
}

export type MobileChatAction =
  | { type: 'append-user'; id: string; content: string }
  | { type: 'begin-assistant'; id: string }
  | { type: 'reset-assistant'; id: string }
  | { type: 'text-delta'; id: string; delta: string }
  | { type: 'reasoning-delta'; id: string; delta: string }
  | { type: 'tool-call'; id: string; call: ChatStreamToolCall }
  | { type: 'tool-result'; id: string; result: ChatStreamToolResult }
  | { type: 'usage'; id: string; promptTokens: number; completionTokens: number }
  | { type: 'metadata'; id: string; data: Record<string, unknown> }
  | { type: 'error'; id: string; message: string }

export function createMessageId(prefix: string): string {
  const random = Math.random().toString(36).slice(2)
  return `${prefix}_${Date.now().toString(36)}_${random}`
}

function emptyAssistant(id: string): MobileChatMessage {
  return { id, role: 'assistant', content: '' }
}

function updateMessage(
  state: MobileChatState,
  id: string,
  updater: (message: MobileChatMessage) => MobileChatMessage,
): MobileChatState {
  const index = state.messages.findIndex((message) => message.id === id)
  if (index === -1) return { messages: [...state.messages, updater(emptyAssistant(id))] }
  const next = state.messages.slice()
  next[index] = updater(next[index])
  return { messages: next }
}

function upsertToolCall(calls: MobileToolCall[] | undefined, call: ChatStreamToolCall): MobileToolCall[] {
  const id = call.toolCallId ?? `tool_${call.toolName}_${calls?.length ?? 0}`
  const next = calls ? calls.slice() : []
  const index = next.findIndex((item) => item.id === id)
  const value: MobileToolCall = {
    id,
    name: call.toolName,
    status: 'running',
    args: call.args,
  }
  if (index === -1) next.push(value)
  else next[index] = { ...next[index], ...value }
  return next
}

function applyToolResult(calls: MobileToolCall[] | undefined, result: ChatStreamToolResult): MobileToolCall[] {
  const next = calls ? calls.slice() : []
  const index = result.toolCallId
    ? next.findIndex((item) => item.id === result.toolCallId)
    : next.findIndex((item) => item.name === result.toolName && item.status === 'running')
  if (index === -1) return next
  next[index] = {
    ...next[index],
    status: result.outcome?.ok === false ? 'error' : 'done',
    result: result.outcome,
  }
  return next
}

export function mobileChatReducer(state: MobileChatState, action: MobileChatAction): MobileChatState {
  switch (action.type) {
    case 'append-user':
      return { messages: [...state.messages, { id: action.id, role: 'user', content: action.content }] }
    case 'begin-assistant':
      return updateMessage(state, action.id, () => emptyAssistant(action.id))
    case 'reset-assistant':
      return updateMessage(state, action.id, () => emptyAssistant(action.id))
    case 'text-delta':
      return updateMessage(state, action.id, (message) => ({ ...message, content: message.content + action.delta }))
    case 'reasoning-delta':
      return updateMessage(state, action.id, (message) => ({ ...message, reasoning: `${message.reasoning ?? ''}${action.delta}` }))
    case 'tool-call':
      return updateMessage(state, action.id, (message) => ({ ...message, toolCalls: upsertToolCall(message.toolCalls, action.call) }))
    case 'tool-result':
      return updateMessage(state, action.id, (message) => ({ ...message, toolCalls: applyToolResult(message.toolCalls, action.result) }))
    case 'usage':
      return updateMessage(state, action.id, (message) => ({
        ...message,
        promptTokens: (message.promptTokens ?? 0) + action.promptTokens,
        completionTokens: (message.completionTokens ?? 0) + action.completionTokens,
      }))
    case 'metadata':
      return updateMessage(state, action.id, (message) => ({
        ...message,
        modelUsed: typeof action.data.modelUsed === 'string' ? action.data.modelUsed : message.modelUsed,
      }))
    case 'error':
      return updateMessage(state, action.id, (message) => ({ ...message, content: message.content || action.message }))
    default:
      return state
  }
}

export function callbacksForAssistant(
  dispatch: Dispatch<MobileChatAction>,
  assistantId: string,
): ChatStreamCallbacks {
  return {
    onText: (delta) => dispatch({ type: 'text-delta', id: assistantId, delta }),
    onReasoning: (delta) => dispatch({ type: 'reasoning-delta', id: assistantId, delta }),
    onToolCall: (call) => dispatch({ type: 'tool-call', id: assistantId, call }),
    onToolResult: (result) => dispatch({ type: 'tool-result', id: assistantId, result }),
    onUsage: (usage) => dispatch({ type: 'usage', id: assistantId, ...usage }),
    onMetadata: (data) => dispatch({ type: 'metadata', id: assistantId, data }),
    onErrorEvent: (message) => dispatch({ type: 'error', id: assistantId, message }),
  }
}

export function useMobileChatState(initialMessages: MobileChatMessage[] = []) {
  const [state, dispatch] = useReducer(mobileChatReducer, { messages: initialMessages })
  const [input, setInput] = useState('')

  const startTurn = useCallback((content: string) => {
    const userId = createMessageId('user')
    const assistantId = createMessageId('assistant')
    dispatch({ type: 'append-user', id: userId, content })
    dispatch({ type: 'begin-assistant', id: assistantId })
    setInput('')
    return assistantId
  }, [])

  const resetAssistant = useCallback((assistantId: string) => {
    dispatch({ type: 'reset-assistant', id: assistantId })
  }, [])

  const callbacksFor = useCallback((assistantId: string) => callbacksForAssistant(dispatch, assistantId), [])

  return useMemo(() => ({
    messages: state.messages,
    input,
    setInput,
    dispatch,
    startTurn,
    resetAssistant,
    callbacksFor,
  }), [callbacksFor, input, resetAssistant, startTurn, state.messages])
}
