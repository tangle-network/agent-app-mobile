import { memo, useCallback, useMemo, useState } from 'react'
import { Modal, Platform, Pressable, SectionList, StyleSheet, Text, View, type SectionListData, type SectionListRenderItem } from 'react-native'
import type { MobileAgentSetting, MobileCatalogModel } from '../types'
import { colors, radii } from './theme'

export interface AgentSettingsSheetProps {
  models?: MobileCatalogModel[]
  selectedModelId?: string
  modelsLoading?: boolean
  onModelChange?: (id: string) => void
  settings?: MobileAgentSetting[]
  label?: string
}

type SettingsRow =
  | { kind: 'model'; model: MobileCatalogModel }
  | { kind: 'setting'; setting: MobileAgentSetting }

interface SettingsSection {
  title: string
  data: SettingsRow[]
}

interface ModelRowProps {
  id: string
  name: string
  provider: string
  selected: boolean
  supportsTools: boolean
  onSelect: (id: string) => void
}

interface SettingRowProps {
  setting: MobileAgentSetting
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
        <Text style={styles.rowTitle}>{name}</Text>
        <Text style={styles.rowMeta}>{provider}</Text>
      </View>
      <Text style={[styles.badge, supportsTools ? styles.badgeOk : styles.badgeMuted]}>
        {supportsTools ? 'tools' : 'chat'}
      </Text>
    </Pressable>
  )
})

const SettingRow = memo(function SettingRow({ setting }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{setting.label}</Text>
        {setting.description ? <Text style={styles.rowMeta}>{setting.description}</Text> : null}
      </View>
      <View style={styles.options}>
        {setting.options.map((option) => {
          const selected = option.id === setting.value
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${setting.label}: ${option.label}`}
              onPress={() => setting.onChange(option.id)}
              style={({ pressed }) => [
                styles.option,
                selected ? styles.optionSelected : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={[styles.optionText, selected ? styles.optionTextSelected : null]}>{option.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
})

export function AgentSettingsSheet({
  models = [],
  selectedModelId,
  modelsLoading = false,
  onModelChange,
  settings = [],
  label = 'Settings',
}: AgentSettingsSheetProps) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => models.find((model) => model.id === selectedModelId), [models, selectedModelId])
  const close = useCallback(() => setOpen(false), [])
  const webCloseProps = Platform.OS === 'web' ? ({ onClick: close } as Record<string, unknown>) : undefined
  const openSheet = useCallback(() => setOpen(true), [])
  const pickModel = useCallback((id: string) => {
    onModelChange?.(id)
  }, [onModelChange])

  const sections = useMemo<SettingsSection[]>(() => {
    const next: SettingsSection[] = []
    if (models.length > 0 || modelsLoading) {
      next.push({
        title: 'Model',
        data: models.map((model) => ({ kind: 'model', model })),
      })
    }
    if (settings.length > 0) {
      next.push({
        title: 'Settings',
        data: settings.map((setting) => ({ kind: 'setting', setting })),
      })
    }
    return next
  }, [models, modelsLoading, settings])

  const renderItem: SectionListRenderItem<SettingsRow, SettingsSection> = useCallback(({ item }) => {
    if (item.kind === 'model') {
      return (
        <ModelRow
          id={item.model.id}
          name={item.model.name}
          provider={item.model.provider}
          selected={item.model.id === selectedModelId}
          supportsTools={item.model.supportsTools}
          onSelect={pickModel}
        />
      )
    }
    return <SettingRow setting={item.setting} />
  }, [pickModel, selectedModelId])

  const renderSectionHeader = useCallback(({ section }: { section: SectionListData<SettingsRow, SettingsSection> }) => (
    <Text style={styles.sectionTitle}>{section.title}</Text>
  ), [])

  const triggerText = selected?.name ?? (modelsLoading ? 'Loading' : 'Settings')

  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={openSheet} style={styles.trigger}>
        <Text numberOfLines={1} style={styles.triggerValue}>{triggerText}</Text>
        <Text style={styles.triggerIcon}>⌄</Text>
      </Pressable>
      {open ? (
        <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close settings"
                onPress={close}
                onPressIn={close}
                style={styles.closeButton}
                {...webCloseProps}
              >
                <Text style={styles.closeText}>Done</Text>
              </Pressable>
            </View>
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.kind === 'model' ? `model:${item.model.id}` : `setting:${item.setting.id}`}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              contentInsetAdjustmentBehavior="automatic"
              contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.list}
              ListEmptyComponent={<Text style={styles.emptyText}>No settings available.</Text>}
            />
          </View>
        </Modal>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  trigger: {
    maxWidth: 178,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: 999,
    borderCurve: 'continuous',
  },
  triggerValue: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  triggerIcon: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 16,
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
  list: {
    gap: 10,
    padding: 14,
  },
  emptyContainer: {
    padding: 24,
  },
  emptyText: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 15,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    paddingBottom: 6,
    paddingTop: 4,
    textTransform: 'uppercase',
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
  rowTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  rowMeta: {
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
  settingRow: {
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderCurve: 'continuous',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 999,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.user,
  },
  optionText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  optionTextSelected: {
    color: colors.primary,
  },
})
