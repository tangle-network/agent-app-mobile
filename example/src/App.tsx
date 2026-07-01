import { useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import {
  AgentChatView,
  type ComposerAttachment,
  type MobileAgentSetting,
  type MobileCatalogModel,
  type MobilePromptSuggestion,
  useMobileChatState,
} from '@tangle-network/agent-app-mobile'

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

export default function App() {
  const chat = useMobileChatState()
  const [modelId, setModelId] = useState(models[0]?.id)
  const [mode, setMode] = useState('router')
  const [effort, setEffort] = useState('medium')
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([])

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

  function send(message: string) {
    const assistantId = chat.startTurn(message)
    setAttachments([])
    chat.dispatch({ type: 'text-delta', id: assistantId, delta: 'Echo from the Expo smoke app: ' })
    chat.dispatch({ type: 'text-delta', id: assistantId, delta: message })
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
