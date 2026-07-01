import { useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { AgentChatView, type MobileCatalogModel, useMobileChatState } from '@tangle-network/agent-app-mobile'

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

export default function App() {
  const chat = useMobileChatState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'This is the native mobile shell. Wire onSend to your agent-app chat route.',
    },
  ])
  const [modelId, setModelId] = useState(models[0]?.id)

  function send(message: string) {
    const assistantId = chat.startTurn(message)
    chat.dispatch({ type: 'text-delta', id: assistantId, delta: 'Echo from the Expo smoke app: ' })
    chat.dispatch({ type: 'text-delta', id: assistantId, delta: message })
  }

  return (
    <View style={styles.root}>
      <View style={[styles.screen, Platform.OS === 'web' ? styles.webScreen : null]}>
        <AgentChatView
          title="Agent App Mobile"
          messages={chat.messages}
          value={chat.input}
          onValueChange={chat.setInput}
          onSend={send}
          models={models}
          selectedModelId={modelId}
          onModelChange={setModelId}
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
