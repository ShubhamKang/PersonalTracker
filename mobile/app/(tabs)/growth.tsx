import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api, DevItem, DevItemType } from '../../src/api/client';

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
    <View style={styles.container}>
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
        <TextInput
          style={styles.input}
          placeholder={`Add a ${
            type === 'PERSONALITY' ? 'trait' : 'skill'
          } to develop…`}
          value={newTitle}
          onChangeText={setNewTitle}
          onSubmitEditing={add}
          returnKeyType="done"
        />
        <Pressable style={styles.addBtn} onPress={add} disabled={adding}>
          {adding ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addBtnText}>Add</Text>
          )}
        </Pressable>
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
            <Text style={styles.empty}>Nothing tracked yet. Add one above.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Pressable onPress={() => remove(item)} hitSlop={8}>
                  <Text style={styles.delete}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${item.progress}%` }]}
                />
              </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 64 },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 16 },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  segItem: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segItemActive: { backgroundColor: '#fff' },
  segText: { color: '#64748b', fontWeight: '600' },
  segTextActive: { color: '#0f172a' },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  addBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 18,
    borderRadius: 10,
    justifyContent: 'center',
    minWidth: 64,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', flex: 1 },
  delete: { color: '#cbd5e1', fontSize: 18, paddingHorizontal: 4 },
  progressBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: { height: '100%', backgroundColor: '#22c55e' },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 22, fontWeight: '700', color: '#334155' },
  pct: { fontSize: 16, fontWeight: '700', minWidth: 56, textAlign: 'center' },
});
