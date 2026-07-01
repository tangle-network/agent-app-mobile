import { useCallback } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import type { MobileAgentSetting, MobileCatalogModel, MobileChatMessage, MobilePromptSuggestion } from '../types'
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
  placeholder?: string
  suggestions?: MobilePromptSuggestion[]
  onSuggestionPress?: (suggestion: MobilePromptSuggestion) => void
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
  placeholder,
  suggestions = [],
  onSuggestionPress,
}: AgentChatViewProps) {
  const showSettings = (models.length > 0 && onModelChange !== undefined) || settings.length > 0
  const chooseSuggestion = useCallback((suggestion: MobilePromptSuggestion) => {
    if (onSuggestionPress) {
      onSuggestionPress(suggestion)
      return
    }
    onValueChange(suggestion.prompt)
  }, [onSuggestionPress, onValueChange])

  return (
    <KeyboardAvoidingView
      style={styles.shell}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleCluster}>
            <Text numberOfLines={1} style={styles.title}>{title}</Text>
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
      </View>
      <ChatMessageList messages={messages} />
      <View style={styles.composer}>
        {suggestions.length > 0 ? (
          <View style={styles.suggestions}>
            {suggestions.slice(0, 3).map((suggestion) => (
              <Pressable
                key={suggestion.id}
                accessibilityRole="button"
                accessibilityLabel={suggestion.title}
                onPress={() => chooseSuggestion(suggestion)}
                style={({ pressed }) => [
                  styles.suggestion,
                  pressed ? styles.suggestionPressed : null,
                ]}
              >
                <Text numberOfLines={1} style={styles.suggestionText}>{suggestion.title}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
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
          placeholder={placeholder}
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
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  title: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleCluster: {
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  suggestions: {
    flexDirection: 'row',
    gap: 8,
  },
  suggestion: {
    minWidth: 0,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 999,
  },
  suggestionPressed: {
    opacity: 0.75,
  },
  suggestionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
})
