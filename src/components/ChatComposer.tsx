import { memo, useCallback } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { colors, radii } from './theme'

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
}: ChatComposerProps) {
  const trimmed = value.trim()
  const canSend = trimmed.length > 0 && !disabled && !isStreaming
  const actionLabel = isStreaming ? stopLabel : sendLabel

  const submit = useCallback(() => {
    if (isStreaming) {
      onCancel?.()
      return
    }
    if (!canSend) return
    onSend(trimmed)
  }, [canSend, isStreaming, onCancel, onSend, trimmed])

  return (
    <View style={styles.shell}>
      <TextInput
        value={value}
        onChangeText={onValueChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        editable={!disabled}
        multiline
        style={styles.input}
        returnKeyType="default"
        textAlignVertical="top"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        disabled={!canSend && !isStreaming}
        onPress={submit}
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
  )
})

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderCurve: 'continuous',
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
