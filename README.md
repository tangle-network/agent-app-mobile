# @tangle-network/agent-app-mobile

React Native / Expo components and transport helpers for agent apps.

This package is intentionally thin. It speaks the `@tangle-network/agent-app` chat stream protocol, but it does not import web/server packages into the native bundle.

- Router-backed chat screens
- Mobile chat message list
- Mobile composer
- Settings sheet with model and agent knobs
- File import and voice dictation controls
- Tool/activity list
- NDJSON stream consumption for agent-app chat routes

It does not import web UI, sandbox terminal UI, xterm, or sandbox-ui.

## Install

```bash
pnpm add @tangle-network/agent-app-mobile react react-native
```

## Router-backed Mobile Chat

```tsx
import { useState } from 'react'
import {
  AgentChatView,
  createAgentAppChatClient,
  streamAgentAppTurn,
  useMobileChatState,
} from '@tangle-network/agent-app-mobile'

const client = createAgentAppChatClient({
  baseUrl: 'https://your-agent-app.example',
})

function ChatScreen() {
  const chat = useMobileChatState()
  const [reasoningEffort, setReasoningEffort] = useState('medium')

  async function send(message: string) {
    const assistantId = chat.startTurn(message)
    await streamAgentAppTurn({
      start: () => client.start({ message }),
      resume: client.resume,
      callbacks: chat.callbacksFor(assistantId),
      onResetForResume: () => chat.resetAssistant(assistantId),
    })
  }

  return (
    <AgentChatView
      title="Agent"
      messages={chat.messages}
      value={chat.input}
      onValueChange={chat.setInput}
      onSend={send}
      onImportFile={() => openNativeDocumentPicker()}
      onVoicePress={() => startNativeDictation()}
      settings={[
        {
          id: 'effort',
          label: 'Reasoning',
          value: reasoningEffort,
          options: [
            { id: 'low', label: 'Low' },
            { id: 'medium', label: 'Medium' },
            { id: 'high', label: 'High' },
          ],
          onChange: setReasoningEffort,
        },
      ]}
    />
  )
}
```

`onImportFile` and `onVoicePress` are callbacks on purpose. Real apps wire them to their chosen native modules, such as Expo DocumentPicker or a speech-recognition package, without forcing those native dependencies into every install.

## Sandbox-backed Mobile Chat

Sandbox-backed apps should stream chat/activity to these same components. Do not mount terminal/xterm on phone. Show retained tool runs and sandbox command summaries as activity rows; reserve live terminal for desktop/tablet web.

## Repo Layout

| Path | Purpose |
|---|---|
| `src/stream.ts` | Mobile-safe parser for agent-app NDJSON chat streams |
| `src/state.ts` | Chat reducer + hook for streamed assistant turns |
| `src/components/` | React Native components |
| `example/` | Expo smoke app showing the package surface |
