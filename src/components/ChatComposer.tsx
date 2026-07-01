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
  placeholder = 'Ask Agent',
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
  const showVoice = onVoicePress !== undefined && !canSend && !isStreaming
  const showPrimary = isStreaming || canSend

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
        {onImportFile ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Import file"
            disabled={disabled}
            onPress={onImportFile}
            style={({ pressed }) => [
              styles.iconButton,
              disabled ? styles.buttonDisabled : null,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            <Text style={styles.iconText}>+</Text>
          </Pressable>
        ) : null}
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
        {showVoice ? (
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
            <Text style={[styles.voiceText, voiceState !== 'idle' ? styles.voiceTextActive : null]}>{voiceLabel}</Text>
          </Pressable>
        ) : null}
        {showPrimary ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={pressPrimary}
          style={({ pressed }) => [
            styles.button,
            isStreaming ? styles.buttonStop : null,
            pressed ? styles.buttonPressed : null,
          ]}
        >
          <Text style={styles.buttonText}>{isStreaming ? '■' : '↑'}</Text>
        </Pressable>
        ) : null}
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  shell: {
    gap: 8,
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
    gap: 6,
    minHeight: 52,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 26,
    borderCurve: 'continuous',
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 104,
    paddingHorizontal: 6,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    outlineColor: 'transparent',
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 19,
    borderCurve: 'continuous',
  },
  voiceButton: {
    minWidth: 44,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 19,
    borderCurve: 'continuous',
  },
  voiceButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.user,
  },
  iconText: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '800',
  },
  voiceText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  voiceTextActive: {
    color: colors.primary,
  },
  button: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 19,
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
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '900',
  },
})
