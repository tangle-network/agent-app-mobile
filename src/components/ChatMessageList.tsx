import { memo, useCallback } from 'react'
import { FlatList, StyleSheet, Text, View, type ListRenderItem } from 'react-native'
import type { MobileChatMessage, MobileToolCall } from '../types'
import { colors, radii } from './theme'

export interface ChatMessageListProps {
  messages: MobileChatMessage[]
  emptyTitle?: string
}

interface MessageRowProps {
  id: string
  role: MobileChatMessage['role']
  content: string
  reasoning?: string
  modelUsed?: string
  promptTokens?: number
  completionTokens?: number
  toolCalls?: MobileToolCall[]
}

const TOOL_STATUS_COLORS: Record<MobileToolCall['status'], { text: string; background: string }> = {
  running: { text: colors.warning, background: colors.warningTint },
  done: { text: colors.success, background: colors.successTint },
  error: { text: colors.error, background: colors.errorTint },
}

function tokenLabel(promptTokens?: number, completionTokens?: number): string | null {
  const total = (promptTokens ?? 0) + (completionTokens ?? 0)
  return total > 0 ? `${total} tokens` : null
}

const MessageRow = memo(function MessageRow({
  role,
  content,
  reasoning,
  modelUsed,
  promptTokens,
  completionTokens,
  toolCalls = [],
}: MessageRowProps) {
  const isUser = role === 'user'
  const title = role === 'assistant' ? 'Agent' : role === 'system' ? 'System' : 'You'
  const tokens = tokenLabel(promptTokens, completionTokens)
  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={styles.metaRow}>
        <Text style={styles.label}>{title}</Text>
        {modelUsed ? <Text numberOfLines={1} style={styles.meta}>{modelUsed}</Text> : null}
        {tokens ? <Text style={styles.meta}>{tokens}</Text> : null}
      </View>
      <Text style={styles.content}>{content || 'Thinking...'}</Text>
      {reasoning ? <Text style={styles.reasoning}>{reasoning}</Text> : null}
      {toolCalls.length > 0 ? (
        <View style={styles.tools}>
          {toolCalls.map((tool) => {
            const status = TOOL_STATUS_COLORS[tool.status]
            return (
              <View key={tool.id} style={[styles.toolChip, { backgroundColor: status.background }]}>
                <Text numberOfLines={1} style={[styles.toolText, { color: status.text }]}>
                  {tool.name}
                </Text>
              </View>
            )
          })}
        </View>
      ) : null}
    </View>
  )
})

export function ChatMessageList({ messages, emptyTitle = 'Start a conversation.' }: ChatMessageListProps) {
  const keyExtractor = useCallback((item: MobileChatMessage) => item.id, [])
  const renderItem: ListRenderItem<MobileChatMessage> = useCallback(({ item }) => (
    <MessageRow
      id={item.id}
      role={item.role}
      content={item.content}
      reasoning={item.reasoning}
      modelUsed={item.modelUsed}
      promptTokens={item.promptTokens}
      completionTokens={item.completionTokens}
      toolCalls={item.toolCalls}
    />
  ), [])

  return (
    <FlatList
      data={messages}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={messages.length === 0 ? styles.emptyContainer : styles.listContainer}
      ListEmptyComponent={<Text style={styles.emptyText}>{emptyTitle}</Text>}
    />
  )
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    gap: 10,
  },
  emptyContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    gap: 6,
    maxWidth: '88%',
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },
  rowAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: colors.assistant,
  },
  rowUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.user,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  content: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 23,
  },
  reasoning: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  tools: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 2,
  },
  toolChip: {
    maxWidth: '100%',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  toolText: {
    fontSize: 12,
    fontWeight: '800',
  },
})
