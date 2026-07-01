import { memo, useCallback } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View, type NativeSyntheticEvent, type TextInputKeyPressEventData } from 'react-native'
import { colors, radii } from './theme'

export type ComposerVoiceState = 'idle' | 'listening' | 'transcribing'

export interface ComposerAttachment {
  id: string
  name: string
  status?: 'ready' | 'uploading' | 'error'
}

export interface ChatComposerProps {
  value: string
  onValueChange: (value: string) => void
  onSend: (message: string) => void | Promise<void>
  disabled?: boolean
  isStreaming?: boolean
  onCancel?: () => void
  placeholder?: string
  sendLabel?: string
  stopLabel?: string
  submitOnEnter?: boolean
  attachments?: ComposerAttachment[]
  onRemoveAttachment?: (id: string) => void
  onImportFile?: () => void
  onVoicePress?: () => void
  voiceState?: ComposerVoiceState
}

export const ChatComposer = memo(function ChatComposer({
  value,
  onValueChange,
  onSend,
  disabled = false,
  isStreaming = false,
  onCancel,
  placeholder = 'Message the agent',
  sendLabel = 'Send',
  stopLabel = 'Stop',
  submitOnEnter = true,
  attachments = [],
  onRemoveAttachment,
  onImportFile,
  onVoicePress,
  voiceState = 'idle',
}: ChatComposerProps) {
  const trimmed = value.trim()
  const canSend = trimmed.length > 0 && !disabled && !isStreaming
  const actionLabel = isStreaming ? stopLabel : sendLabel
  const voiceLabel = voiceState === 'listening' ? 'Listening' : voiceState === 'transcribing' ? 'Transcribing' : 'Mic'

  const send = useCallback(() => {
    if (!canSend) return
    onSend(trimmed)
  }, [canSend, onSend, trimmed])

  const pressPrimary = useCallback(() => {
    if (isStreaming) {
      onCancel?.()
      return
    }
    send()
  }, [isStreaming, onCancel, send])

  const submitFromKeyboard = useCallback(() => {
    if (!submitOnEnter) return
    send()
  }, [send, submitOnEnter])

  const handleKeyPress = useCallback((event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    const nativeEvent = event.nativeEvent as TextInputKeyPressEventData & { shiftKey?: boolean }
    if (!submitOnEnter || nativeEvent.key !== 'Enter' || nativeEvent.shiftKey) return
    ;(event as unknown as { preventDefault?: () => void }).preventDefault?.()
    submitFromKeyboard()
  }, [submitFromKeyboard, submitOnEnter])

  return (
    <View style={styles.shell}>
      {attachments.length > 0 ? (
        <View style={styles.attachments}>
          {attachments.map((attachment) => (
            <Pressable
              key={attachment.id}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${attachment.name}`}
              disabled={onRemoveAttachment === undefined}
              onPress={() => onRemoveAttachment?.(attachment.id)}
              style={({ pressed }) => [
                styles.attachment,
                attachment.status === 'error' ? styles.attachmentError : null,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text numberOfLines={1} style={styles.attachmentText}>{attachment.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onValueChange}
          onSubmitEditing={submitFromKeyboard}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          editable={!disabled}
          multiline
          submitBehavior={submitOnEnter ? 'submit' : 'newline'}
          style={styles.input}
          returnKeyType={submitOnEnter ? 'send' : 'default'}
          textAlignVertical="top"
        />
      </View>
      <View style={styles.actionRow}>
        <View style={styles.utilityGroup}>
          {onImportFile ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Import file"
              disabled={disabled}
              onPress={onImportFile}
              style={({ pressed }) => [
                styles.utilityButton,
                disabled ? styles.buttonDisabled : null,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text style={styles.utilityText}>+</Text>
            </Pressable>
          ) : null}
        {onVoicePress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voice dictation"
            disabled={disabled || voiceState === 'transcribing'}
            onPress={onVoicePress}
            style={({ pressed }) => [
              styles.voiceButton,
              voiceState !== 'idle' ? styles.voiceButtonActive : null,
              (disabled || voiceState === 'transcribing') ? styles.buttonDisabled : null,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            <Text style={[styles.utilityText, voiceState !== 'idle' ? styles.voiceTextActive : null]}>{voiceLabel}</Text>
          </Pressable>
        ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          disabled={!canSend && !isStreaming}
          onPress={pressPrimary}
          style={({ pressed }) => [
            styles.button,
            isStreaming ? styles.buttonStop : null,
            (!canSend && !isStreaming) ? styles.buttonDisabled : null,
            pressed ? styles.buttonPressed : null,
          ]}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  shell: {
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderCurve: 'continuous',
  },
  attachments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  attachment: {
    maxWidth: '100%',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.mutedTint,
  },
  attachmentError: {
    backgroundColor: colors.errorTint,
  },
  attachmentText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  utilityGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 132,
    paddingHorizontal: 10,
    paddingVertical: 9,
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
  },
  utilityButton: {
    width: 42,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
  },
  voiceButton: {
    minWidth: 52,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
  },
  voiceButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.user,
  },
  utilityText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  voiceTextActive: {
    color: colors.primary,
  },
  button: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
  },
  buttonPressed: {
    opacity: 0.78,
  },
  buttonStop: {
    backgroundColor: colors.error,
  },
  buttonDisabled: {
    opacity: 0.42,
  },
  buttonText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '700',
  },
})
