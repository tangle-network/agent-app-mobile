# @tangle-network/agent-app-mobile

React Native / Expo components and transport helpers for agent apps.

This package is intentionally thin. It depends on `@tangle-network/agent-app` for the engine-shaped parts and only owns native mobile UI:

- Router-backed chat screens
- Mobile chat message list
- Mobile composer
- Model picker
- Tool/activity list
- NDJSON stream consumption for agent-app chat routes

It does not import web UI, sandbox terminal UI, xterm, or sandbox-ui.

## Install

```bash
pnpm add @tangle-network/agent-app-mobile @tangle-network/agent-app react react-native
```

## Router-backed Mobile Chat

```tsx
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
    />
  )
}
```

## Sandbox-backed Mobile Chat

Sandbox-backed apps should stream chat/activity to these same components. Do not mount terminal/xterm on phone. Show retained tool runs and sandbox command summaries as activity rows; reserve live terminal for desktop/tablet web.

## Repo Layout

| Path | Purpose |
|---|---|
| `src/stream.ts` | Mobile-safe parser for agent-app NDJSON chat streams |
| `src/state.ts` | Chat reducer + hook for streamed assistant turns |
| `src/components/` | React Native components |
| `example/` | Expo smoke app showing the package surface |
