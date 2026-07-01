import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native'
import type { MobileAgentSetting, MobileCatalogModel, MobileChatMessage } from '../types'
import type { ComposerAttachment, ComposerVoiceState } from './ChatComposer'
import { AgentSettingsSheet } from './AgentSettingsSheet'
import { ChatComposer } from './ChatComposer'
import { ChatMessageList } from './ChatMessageList'
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
  settings?: MobileAgentSetting[]
  attachments?: ComposerAttachment[]
  onRemoveAttachment?: (id: string) => void
  onImportFile?: () => void
  onVoicePress?: () => void
  voiceState?: ComposerVoiceState
  submitOnEnter?: boolean
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
  settings = [],
  attachments,
  onRemoveAttachment,
  onImportFile,
  onVoicePress,
  voiceState,
  submitOnEnter,
}: AgentChatViewProps) {
  const showSettings = (models.length > 0 && onModelChange !== undefined) || settings.length > 0
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
        {showSettings ? (
          <AgentSettingsSheet
            models={models}
            selectedModelId={selectedModelId}
            modelsLoading={modelsLoading}
            onModelChange={onModelChange}
            settings={settings}
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
          submitOnEnter={submitOnEnter}
          attachments={attachments}
          onRemoveAttachment={onRemoveAttachment}
          onImportFile={onImportFile}
          onVoicePress={onVoicePress}
          voiceState={voiceState}
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
