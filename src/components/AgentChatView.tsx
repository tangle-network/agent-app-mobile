import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native'
import type { MobileCatalogModel, MobileChatMessage } from '../types'
import { ChatComposer } from './ChatComposer'
import { ChatMessageList } from './ChatMessageList'
import { ModelPicker } from './ModelPicker'
import { colors } from './theme'

export interface AgentChatViewProps {
  title?: string
  messages: MobileChatMessage[]
  value: string
  onValueChange: (value: string) => void
  onSend: (message: string) => void | Promise<void>
  isStreaming?: boolean
  onCancel?: () => void
  disabled?: boolean
  models?: MobileCatalogModel[]
  selectedModelId?: string
  modelsLoading?: boolean
  onModelChange?: (id: string) => void
}

export function AgentChatView({
  title = 'Agent',
  messages,
  value,
  onValueChange,
  onSend,
  isStreaming,
  onCancel,
  disabled,
  models = [],
  selectedModelId,
  modelsLoading,
  onModelChange,
}: AgentChatViewProps) {
  const showModelPicker = models.length > 0 && onModelChange !== undefined
  return (
    <KeyboardAvoidingView
      style={styles.shell}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          {isStreaming ? <Text style={styles.running}>running</Text> : null}
        </View>
        {showModelPicker ? (
          <ModelPicker
            value={selectedModelId}
            models={models}
            loading={modelsLoading}
            onChange={onModelChange}
          />
        ) : null}
      </View>
      <ChatMessageList messages={messages} />
      <View style={styles.composer}>
        <ChatComposer
          value={value}
          onValueChange={onValueChange}
          onSend={onSend}
          isStreaming={isStreaming}
          onCancel={onCancel}
          disabled={disabled}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  running: {
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.warningTint,
    color: colors.warning,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  composer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
})
