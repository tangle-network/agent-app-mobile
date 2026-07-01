import type { CatalogModel } from '@tangle-network/agent-app/runtime'

export type MobileCatalogModel = CatalogModel

export type MobileMessageRole = 'user' | 'assistant' | 'system'

export interface MobileToolCall {
  id: string
  name: string
  status: 'running' | 'done' | 'error'
  args?: Record<string, unknown>
  result?: unknown
}

export interface MobileChatMessage {
  id: string
  role: MobileMessageRole
  content: string
  reasoning?: string
  modelUsed?: string
  toolCalls?: MobileToolCall[]
  promptTokens?: number
  completionTokens?: number
  durationMs?: number
}

export interface MobileActivityItem {
  id: string
  title: string
  subtitle?: string
  status: 'running' | 'done' | 'error' | 'waiting'
  at?: string
}
