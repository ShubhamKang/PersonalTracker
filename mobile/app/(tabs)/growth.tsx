import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api, DevItem, DevItemType } from '../../src/api/client';
import {
  Button,
  EmptyState,
  ProgressBar,
  Screen,
  TextField,
} from '../../src/components';
import { colors, radius, spacing, typography } from '../../src/theme/theme';

const TYPES: DevItemType[] = ['PERSONALITY', 'SKILL'];
const STEP = 10;

export default function GrowthScreen() {
  const [type, setType] = useState<DevItemType>('PERSONALITY');
  const [items, setItems] = useState<DevItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async (t: DevItemType) => {
    try {
      setItems(await api.listDevItems(t));
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load(type).finally(() => setLoading(false));
  }, [type, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(type);
    setRefreshing(false);
  }, [type, load]);

  const add = async () => {
    const title = newTitle.trim();
    if (!title) {
      return;
    }
    setAdding(true);
    try {
      const created = await api.createDevItem({ type, title, progress: 0 });
      setItems((prev) => [...prev, created]);
      setNewTitle('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to add');
    } finally {
      setAdding(false);
    }
  };

  const setProgress = async (item: DevItem, next: number) => {
    const clamped = Math.max(0, Math.min(100, next));
    if (clamped === item.progress) {
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, progress: clamped } : i)),
    );
    try {
      await api.updateDevItem(item.id, { progress: clamped });
    } catch {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, progress: item.progress } : i,
        ),
      );
      Alert.alert('Error', 'Failed to update progress.');
    }
  };

  const remove = (item: DevItem) => {
    Alert.alert('Delete', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const prev = items;
          setItems((cur) => cur.filter((i) => i.id !== item.id));
          try {
            await api.deleteDevItem(item.id);
          } catch {
            setItems(prev);
            Alert.alert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <Text style={styles.title}>Growth</Text>

      <View style={styles.segment}>
        {TYPES.map((t) => (
          <Pressable
            key={t}
            style={[styles.segItem, type === t && styles.segItemActive]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.segText, type === t && styles.segTextActive]}>
              {t === 'PERSONALITY' ? 'Personality' : 'Skills'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.addRow}>
        <TextField
          style={styles.input}
          placeholder={`Add a ${
            type === 'PERSONALITY' ? 'trait' : 'skill'
          } to develop…`}
          value={newTitle}
          onChangeText={setNewTitle}
          onSubmitEditing={add}
          returnKeyType="done"
        />
        <Button title="Add" onPress={add} loading={adding} style={styles.addBtn} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState message="Nothing tracked yet. Add one above." />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Pressable onPress={() => remove(item)} hitSlop={8}>
                  <Text style={styles.delete}>✕</Text>
                </Pressable>
              </View>

              <ProgressBar
                percent={item.progress}
                color={colors.success}
                height={10}
                style={styles.progress}
              />

              <View style={styles.progressRow}>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setProgress(item, item.progress - STEP)}
                >
                  <Text style={styles.stepText}>−</Text>
                </Pressable>
                <Text style={styles.pct}>{item.progress}%</Text>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => setProgress(item, item.progress + STEP)}
                >
                  <Text style={styles.stepText}>+</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.screenTitle, marginBottom: spacing.lg },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  segItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  segItemActive: { backgroundColor: colors.background },
  segText: { color: colors.muted, fontWeight: '600' },
  segTextActive: { color: colors.ink },
  addRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  input: { flex: 1 },
  addBtn: { minWidth: 64 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: { ...typography.label, fontSize: 16, color: colors.ink, flex: 1 },
  delete: { color: colors.disabledText, fontSize: 18, paddingHorizontal: spacing.xs },
  progress: { marginBottom: spacing.md },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 22, fontWeight: '700', color: colors.text },
  pct: { fontSize: 16, fontWeight: '700', minWidth: 56, textAlign: 'center' },
});
