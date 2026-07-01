export interface MobileCatalogModel {
  id: string
  name: string
  provider: string
  supportsTools: boolean
  supportsReasoning?: boolean
  featured?: boolean
  [key: string]: unknown
}

export interface MobileAgentSettingOption {
  id: string
  label: string
  description?: string
}

export interface MobileAgentSetting {
  id: string
  label: string
  value: string
  description?: string
  options: MobileAgentSettingOption[]
  onChange: (id: string) => void
}

export interface MobilePromptSuggestion {
  id: string
  title: string
  prompt: string
}

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
