import { memo, useCallback, useMemo, useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, Text, View, type ListRenderItem } from 'react-native'
import type { MobileCatalogModel } from '../types'
import { colors, radii } from './theme'

export interface ModelPickerProps {
  value?: string
  models: MobileCatalogModel[]
  loading?: boolean
  onChange: (id: string) => void
  label?: string
}

interface ModelRowProps {
  id: string
  name: string
  provider: string
  selected: boolean
  supportsTools: boolean
  onSelect: (id: string) => void
}

const ModelRow = memo(function ModelRow({ id, name, provider, selected, supportsTools, onSelect }: ModelRowProps) {
  const press = useCallback(() => onSelect(id), [id, onSelect])
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={press}
      style={({ pressed }) => [
        styles.row,
        selected ? styles.rowSelected : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.rowText}>
        <Text style={styles.modelName}>{name}</Text>
        <Text style={styles.modelMeta}>{provider}</Text>
      </View>
      <Text style={[styles.badge, supportsTools ? styles.badgeOk : styles.badgeMuted]}>
        {supportsTools ? 'tools' : 'chat'}
      </Text>
    </Pressable>
  )
})

export function ModelPicker({ value, models, loading = false, onChange, label = 'Model' }: ModelPickerProps) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => models.find((model) => model.id === value), [models, value])
  const close = useCallback(() => setOpen(false), [])
  const openSheet = useCallback(() => setOpen(true), [])
  const pick = useCallback((id: string) => {
    onChange(id)
    setOpen(false)
  }, [onChange])
  const keyExtractor = useCallback((item: MobileCatalogModel) => item.id, [])
  const renderItem: ListRenderItem<MobileCatalogModel> = useCallback(({ item }) => (
    <ModelRow
      id={item.id}
      name={item.name}
      provider={item.provider}
      selected={item.id === value}
      supportsTools={item.supportsTools}
      onSelect={pick}
    />
  ), [pick, value])

  const triggerText = loading ? 'Loading models' : selected?.name ?? 'Choose model'

  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={openSheet} style={styles.trigger}>
        <Text style={styles.triggerLabel}>{label}</Text>
        <Text numberOfLines={1} style={styles.triggerValue}>{triggerText}</Text>
      </Pressable>
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close model picker" onPress={close} style={styles.closeButton}>
              <Text style={styles.closeText}>Done</Text>
            </Pressable>
          </View>
          <FlatList
            data={models}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={styles.modelList}
            ListEmptyComponent={<Text style={styles.emptyText}>{loading ? 'Loading models...' : 'No models available.'}</Text>}
          />
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  trigger: {
    gap: 3,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
  },
  triggerLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  triggerValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  closeText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  modelList: {
    padding: 14,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.user,
  },
  pressed: {
    opacity: 0.75,
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  modelName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  modelMeta: {
    color: colors.muted,
    fontSize: 13,
  },
  badge: {
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '800',
  },
  badgeOk: {
    color: colors.success,
    backgroundColor: colors.successTint,
  },
  badgeMuted: {
    color: colors.muted,
    backgroundColor: colors.mutedTint,
  },
  emptyText: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 15,
  },
})
