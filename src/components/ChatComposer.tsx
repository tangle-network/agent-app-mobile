import { memo, useCallback, useEffect, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
  type TextInputKeyPressEventData,
} from 'react-native'
import { colors } from './theme'

export type ComposerVoiceState = 'idle' | 'listening' | 'transcribing'

const INPUT_LINE_HEIGHT = 22
const INPUT_VERTICAL_PADDING = 4
const MIN_INPUT_HEIGHT = INPUT_LINE_HEIGHT + (INPUT_VERTICAL_PADDING * 2)
const MAX_INPUT_LINES = 7
const MAX_INPUT_HEIGHT = (INPUT_LINE_HEIGHT * MAX_INPUT_LINES) + (INPUT_VERTICAL_PADDING * 2)
const ICON_SIZE = 36

function clampInputHeight(height: number): number {
  return Math.min(MAX_INPUT_HEIGHT, Math.max(MIN_INPUT_HEIGHT, Math.ceil(height)))
}

function heightFromExplicitLines(value: string): number {
  const lineCount = Math.max(1, value.split('\n').length)
  return clampInputHeight((Math.min(lineCount, MAX_INPUT_LINES) * INPUT_LINE_HEIGHT) + (INPUT_VERTICAL_PADDING * 2))
}

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
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT)
  const isSingleLineInput = inputHeight <= MIN_INPUT_HEIGHT + 1

  const send = useCallback(() => {
    if (!canSend) return
    onSend(trimmed)
  }, [canSend, onSend, trimmed])

  const resizeInput = useCallback((height: number) => {
    const nextHeight = clampInputHeight(height)
    setInputHeight((currentHeight) => (
      Math.abs(currentHeight - nextHeight) > 1 ? nextHeight : currentHeight
    ))
  }, [])

  const handleContentSizeChange = useCallback((
    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ) => {
    resizeInput(event.nativeEvent.contentSize.height)
  }, [resizeInput])

  useEffect(() => {
    if (value.length === 0) {
      resizeInput(MIN_INPUT_HEIGHT)
      return
    }

    if (value.includes('\n')) {
      resizeInput(heightFromExplicitLines(value))
    }
  }, [resizeInput, value])

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
      <View style={[styles.inputRow, isSingleLineInput ? styles.inputRowSingleLine : null]}>
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
            <View style={styles.plusIcon} aria-hidden>
              <View style={[styles.plusBar, styles.plusBarHorizontal]} />
              <View style={[styles.plusBar, styles.plusBarVertical]} />
            </View>
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
          numberOfLines={1}
          onContentSizeChange={handleContentSizeChange}
          submitBehavior={submitOnEnter ? 'submit' : 'newline'}
          scrollEnabled={inputHeight >= MAX_INPUT_HEIGHT}
          style={[styles.input, { height: inputHeight }]}
          returnKeyType={submitOnEnter ? 'send' : 'default'}
          textAlignVertical={isSingleLineInput ? 'center' : 'top'}
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
    minHeight: ICON_SIZE + 8,
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 22,
    borderCurve: 'continuous',
  },
  inputRowSingleLine: {
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: MIN_INPUT_HEIGHT,
    maxHeight: MAX_INPUT_HEIGHT,
    paddingHorizontal: 6,
    paddingVertical: INPUT_VERTICAL_PADDING,
    color: colors.text,
    fontSize: 16,
    lineHeight: INPUT_LINE_HEIGHT,
    overflow: 'hidden',
    outlineColor: 'transparent',
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  iconButton: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: ICON_SIZE / 2,
    borderCurve: 'continuous',
  },
  voiceButton: {
    minWidth: 42,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: ICON_SIZE / 2,
    borderCurve: 'continuous',
  },
  voiceButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.user,
  },
  plusIcon: {
    position: 'relative',
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBar: {
    position: 'absolute',
    backgroundColor: colors.text,
    borderRadius: 2,
  },
  plusBarHorizontal: {
    width: 14,
    height: 3,
  },
  plusBarVertical: {
    width: 3,
    height: 14,
  },
  voiceText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  voiceTextActive: {
    color: colors.primary,
  },
  button: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: ICON_SIZE / 2,
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
