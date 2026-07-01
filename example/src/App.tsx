import { useMemo, useRef, useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import {
  AgentChatView,
  createAgentAppChatClient,
  streamAgentAppTurn,
  type ComposerAttachment,
  type MobileAgentSetting,
  type MobileCatalogModel,
  type MobilePromptSuggestion,
  useMobileChatState,
} from '@tangle-network/agent-app-mobile'

declare const process: {
  env?: {
    EXPO_PUBLIC_AGENT_APP_BASE_URL?: string
    EXPO_PUBLIC_AGENT_APP_STREAM_PATH?: string
  }
}

const models: MobileCatalogModel[] = [
  {
    id: 'openai/gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    supportsTools: true,
    supportsReasoning: true,
    featured: true,
  },
]

const starters: MobilePromptSuggestion[] = [
  {
    id: 'router',
    title: 'Router chat',
    prompt: 'Show me the cleanest router-backed mobile chat flow.',
  },
  {
    id: 'sandbox',
    title: 'Sandbox app',
    prompt: 'Sketch a mobile sandbox-backed agent screen without a terminal.',
  },
  {
    id: 'files',
    title: 'Use a file',
    prompt: 'Help me import a file and use it in the next agent turn.',
  },
]

function cleanEnv(value: string | undefined): string | undefined {
  return value && value.trim().length > 0 ? value.trim() : undefined
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'The agent turn failed.'
}

function abortError(): Error {
  const error = new Error('Aborted')
  error.name = 'AbortError'
  return error
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError())
      return
    }
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(abortError())
    }, { once: true })
  })
}

export default function App() {
  const chat = useMobileChatState()
  const [modelId, setModelId] = useState(models[0]?.id)
  const [mode, setMode] = useState('router')
  const [effort, setEffort] = useState('medium')
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([])
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const agentAppBaseUrl = cleanEnv(process.env?.EXPO_PUBLIC_AGENT_APP_BASE_URL)
  const streamPath = cleanEnv(process.env?.EXPO_PUBLIC_AGENT_APP_STREAM_PATH)
  const client = useMemo(() => {
    if (!agentAppBaseUrl) return null
    return createAgentAppChatClient({
      baseUrl: agentAppBaseUrl,
      streamPath,
    })
  }, [agentAppBaseUrl, streamPath])

  const settings: MobileAgentSetting[] = [
    {
      id: 'mode',
      label: 'Mode',
      value: mode,
      description: 'Backend used for the next turn.',
      options: [
        { id: 'router', label: 'Router' },
        { id: 'sandbox', label: 'Sandbox' },
      ],
      onChange: setMode,
    },
    {
      id: 'effort',
      label: 'Reasoning',
      value: effort,
      description: 'How much thinking budget the agent should spend.',
      options: [
        { id: 'low', label: 'Low' },
        { id: 'medium', label: 'Medium' },
        { id: 'high', label: 'High' },
      ],
      onChange: setEffort,
    },
  ]

  async function runLocalDemo(assistantId: string, message: string, signal: AbortSignal) {
    await wait(80, signal)
    chat.dispatch({
      type: 'text-delta',
      id: assistantId,
      delta: 'Local demo mode. Configure a backend URL to stream from a real agent-app route.',
    })
    await wait(80, signal)
    chat.dispatch({ type: 'text-delta', id: assistantId, delta: `\n\nYou asked: ${message}` })
    chat.dispatch({ type: 'metadata', id: assistantId, data: { modelUsed: models.find((model) => model.id === modelId)?.name } })
  }

  async function send(message: string) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const assistantId = chat.startTurn(message)
    const turnAttachments = attachments
    setAttachments([])
    setStreaming(true)

    try {
      if (client) {
        await streamAgentAppTurn({
          start: () => client.start({
            message,
            model: modelId,
            mode,
            reasoningEffort: effort,
            attachments: turnAttachments,
          }, { signal: controller.signal }),
          resume: (turnId, fromSeq) => client.resume(turnId, fromSeq, { signal: controller.signal }),
          callbacks: chat.callbacksFor(assistantId),
          onResetForResume: () => chat.resetAssistant(assistantId),
        })
      } else {
        await runLocalDemo(assistantId, message, controller.signal)
      }
    } catch (error) {
      chat.dispatch({
        type: 'error',
        id: assistantId,
        message: controller.signal.aborted ? 'Stopped.' : errorText(error),
      })
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setStreaming(false)
      }
    }
  }

  function cancel() {
    abortRef.current?.abort()
  }

  function importFile() {
    setAttachments((current) => [
      ...current,
      {
        id: `file_${current.length + 1}`,
        name: Platform.OS === 'ios' ? 'iCloud document.pdf' : 'Android document.pdf',
        status: 'ready',
      },
    ])
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((attachment) => attachment.id !== id))
  }

  const showStarters = !chat.messages.some((message) => message.role === 'user')

  return (
    <View style={styles.root}>
      <View style={[styles.screen, Platform.OS === 'web' ? styles.webScreen : null]}>
        <AgentChatView
          title="Pi"
          messages={chat.messages}
          value={chat.input}
          onValueChange={chat.setInput}
          onSend={send}
          isStreaming={streaming}
          onCancel={cancel}
          placeholder="Ask Pi"
          models={models}
          selectedModelId={modelId}
          onModelChange={setModelId}
          settings={settings}
          attachments={attachments}
          onRemoveAttachment={removeAttachment}
          onImportFile={importFile}
          suggestions={showStarters ? starters : []}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
  },
  webScreen: {
    height: 812,
  },
})
