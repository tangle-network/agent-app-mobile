import { memo, useCallback } from 'react'
import { FlatList, StyleSheet, Text, View, type ListRenderItem } from 'react-native'
import type { MobileActivityItem } from '../types'
import { colors, radii } from './theme'

export interface ActivityListProps {
  activity: MobileActivityItem[]
  emptyTitle?: string
}

interface ActivityRowProps {
  title: string
  subtitle?: string
  status: MobileActivityItem['status']
}

const STATUS_COLOR: Record<MobileActivityItem['status'], string> = {
  running: colors.warning,
  done: colors.success,
  error: colors.error,
  waiting: colors.muted,
}

const ActivityRow = memo(function ActivityRow({ title, subtitle, status }: ActivityRowProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: STATUS_COLOR[status] }]} />
      <View style={styles.textGroup}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.status}>{status}</Text>
    </View>
  )
})

export function ActivityList({ activity, emptyTitle = 'No activity yet.' }: ActivityListProps) {
  const keyExtractor = useCallback((item: MobileActivityItem) => item.id, [])
  const renderItem: ListRenderItem<MobileActivityItem> = useCallback(({ item }) => (
    <ActivityRow title={item.title} subtitle={item.subtitle} status={item.status} />
  ), [])

  return (
    <FlatList
      data={activity}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={activity.length === 0 ? styles.emptyContainer : styles.listContainer}
      ListEmptyComponent={<Text style={styles.emptyText}>{emptyTitle}</Text>}
    />
  )
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    gap: 9,
  },
  emptyContainer: {
    padding: 24,
  },
  emptyText: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderCurve: 'continuous',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  textGroup: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
  },
  status: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
})
