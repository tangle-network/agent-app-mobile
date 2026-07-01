# @tangle-network/agent-app-mobile

React Native / Expo components and transport helpers for agent apps.

This package is intentionally thin. It speaks the `@tangle-network/agent-app` chat stream protocol, but it does not import web/server packages into the native bundle.

- Router-backed chat screens
- Mobile chat message list
- Mobile composer
- Settings sheet with model and agent knobs
- Prompt starters, file import, and optional voice controls
- Tool/activity list
- NDJSON stream consumption for agent-app chat routes

It does not import web UI, sandbox terminal UI, xterm, or sandbox-ui.

## Install

```bash
pnpm add @tangle-network/agent-app-mobile react react-native
```

## Router-backed Mobile Chat

```tsx
import { useRef, useState } from 'react'
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
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  async function send(message: string) {
    const controller = new AbortController()
    abortRef.current = controller
    const assistantId = chat.startTurn(message)
    setStreaming(true)
    try {
      await streamAgentAppTurn({
        start: () => client.start({ message }, { signal: controller.signal }),
        resume: (turnId, fromSeq) => client.resume(turnId, fromSeq, { signal: controller.signal }),
        callbacks: chat.callbacksFor(assistantId),
        onResetForResume: () => chat.resetAssistant(assistantId),
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

  return (
    <AgentChatView
      title="Agent"
      messages={chat.messages}
      value={chat.input}
      onValueChange={chat.setInput}
      onSend={send}
      isStreaming={streaming}
      onCancel={cancel}
      placeholder="Ask Agent"
      onImportFile={() => openNativeDocumentPicker()}
      suggestions={[
        {
          id: 'plan',
          title: 'Plan',
          prompt: 'Plan the next mobile agent workflow.',
        },
        {
          id: 'debug',
          title: 'Debug',
          prompt: 'Help me debug the latest mobile chat run.',
        },
        {
          id: 'ship',
          title: 'Ship',
          prompt: 'Turn this into the smallest shippable change.',
        },
      ]}
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

`onImportFile` and `onVoicePress` are callbacks on purpose. Real apps wire them to their chosen native modules, such as Expo DocumentPicker or a speech-recognition package, without forcing those native dependencies into every install. If `onVoicePress` is omitted, the composer does not show a voice control.

## Expo Example

The example runs in local demo mode unless you point it at a real agent-app route:

```bash
EXPO_PUBLIC_AGENT_APP_BASE_URL=http://localhost:3000 pnpm --filter agent-app-mobile-example start
```

Use a LAN or Tailscale URL instead of `localhost` when testing on a physical phone. Do not put secrets in `EXPO_PUBLIC_*` variables; they are bundled into the app.

The release check exports web, iOS, and Android bundles:

```bash
pnpm prepublishOnly
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
