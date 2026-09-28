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
import {
  api,
  Goal,
  GoalCategory,
  GoalScope,
} from '../../src/api/client';

const SCOPES: GoalScope[] = ['WEEKLY', 'MONTHLY'];
const CATEGORIES: GoalCategory[] = ['STUDY', 'OTHER'];

export default function GoalsScreen() {
  const [scope, setScope] = useState<GoalScope>('WEEKLY');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [category, setCategory] = useState<GoalCategory>('STUDY');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async (s: GoalScope) => {
    try {
      const list = await api.listGoals(s);
      setGoals(list);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load(scope).finally(() => setLoading(false));
  }, [scope, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(scope);
    setRefreshing(false);
  }, [scope, load]);

  const addGoal = async () => {
    const title = newTitle.trim();
    if (!title) {
      return;
    }
    setAdding(true);
    try {
      const created = await api.createGoal(scope, category, title);
      setGoals((prev) => [...prev, created]);
      setNewTitle('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to add');
    } finally {
      setAdding(false);
    }
  };

  const toggle = async (goal: Goal) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === goal.id ? { ...g, done: !g.done } : g)),
    );
    try {
      await api.updateGoal(goal.id, { done: !goal.done });
    } catch {
      setGoals((prev) =>
        prev.map((g) => (g.id === goal.id ? { ...g, done: goal.done } : g)),
      );
      Alert.alert('Error', 'Failed to update.');
    }
  };

  const remove = async (goal: Goal) => {
    const prev = goals;
    setGoals((cur) => cur.filter((g) => g.id !== goal.id));
    try {
      await api.deleteGoal(goal.id);
    } catch {
      setGoals(prev);
      Alert.alert('Error', 'Failed to delete.');
    }
  };

  const sections = CATEGORIES.map((cat) => ({
    category: cat,
    items: goals.filter((g) => g.category === cat),
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Goals</Text>

      {/* Scope toggle */}
      <View style={styles.segment}>
        {SCOPES.map((s) => (
          <Pressable
            key={s}
            style={[styles.segItem, scope === s && styles.segItemActive]}
            onPress={() => setScope(s)}
          >
            <Text style={[styles.segText, scope === s && styles.segTextActive]}>
              {s === 'WEEKLY' ? 'This Week' : 'This Month'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Add row */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder={`Add a ${scope === 'WEEKLY' ? 'weekly' : 'monthly'} goal…`}
          value={newTitle}
          onChangeText={setNewTitle}
          onSubmitEditing={addGoal}
          returnKeyType="done"
        />
        <Pressable style={styles.addBtn} onPress={addGoal} disabled={adding}>
          {adding ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addBtnText}>Add</Text>
          )}
        </Pressable>
      </View>

      {/* Category selector for new goal */}
      <View style={styles.catRow}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c}
            style={[styles.catChip, category === c && styles.catChipActive]}
            onPress={() => setCategory(c)}
          >
            <Text
              style={[styles.catText, category === c && styles.catTextActive]}
            >
              {c}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(s) => s.category}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No goals yet. Add one above.</Text>
          }
          renderItem={({ item: section }) => (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>{section.category}</Text>
              {section.items.length === 0 ? (
                <Text style={styles.sectionEmpty}>None</Text>
              ) : (
                section.items.map((goal) => (
                  <View key={goal.id} style={styles.item}>
                    <Pressable
                      style={styles.itemMain}
                      onPress={() => toggle(goal)}
                    >
                      <View
                        style={[styles.check, goal.done && styles.checkDone]}
                      >
                        {goal.done && <Text style={styles.checkMark}>✓</Text>}
                      </View>
                      <Text
                        style={[styles.itemText, goal.done && styles.itemDone]}
                      >
                        {goal.title}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => remove(goal)} hitSlop={10}>
                      <Text style={styles.delete}>✕</Text>
                    </Pressable>
                  </View>
                ))
              )}
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
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
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
  catRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  catChipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  catText: { color: '#475569', fontWeight: '600', fontSize: 12 },
  catTextActive: { color: '#fff' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
  section: { marginBottom: 20 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 6,
  },
  sectionEmpty: { color: '#cbd5e1', fontStyle: 'italic', paddingVertical: 6 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemMain: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  checkMark: { color: '#fff', fontWeight: '700', fontSize: 14 },
  itemText: { fontSize: 16, flex: 1 },
  itemDone: { textDecorationLine: 'line-through', color: '#94a3b8' },
  delete: { color: '#cbd5e1', fontSize: 18, paddingHorizontal: 4 },
});
