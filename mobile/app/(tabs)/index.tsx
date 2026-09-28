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
import { useAuth } from '../../src/context/auth-context';
import { api, Todo, DashboardSummary } from '../../src/api/client';

function ProgressCard({
  label,
  done,
  total,
}: {
  label: string;
  done: number;
  total: number;
}) {
  const allDone = total > 0 && done === total;
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={[styles.cardValue, allDone && styles.cardValueDone]}>
        {done}/{total}
      </Text>
    </View>
  );
}

export default function TodayScreen() {
  const { user, logout } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const [list, sum] = await Promise.all([
        api.listTodayTodos(),
        api.dashboardSummary(),
      ]);
      setTodos(list);
      setSummary(sum);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    (async () => {
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const addTodo = async () => {
    const title = newTitle.trim();
    if (!title) {
      return;
    }
    setAdding(true);
    try {
      const created = await api.createTodo(title);
      setTodos((prev) => [...prev, created]);
      setNewTitle('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to add');
    } finally {
      setAdding(false);
    }
  };

  const toggle = async (todo: Todo) => {
    // Optimistic update.
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)),
    );
    try {
      await api.updateTodo(todo.id, { done: !todo.done });
    } catch {
      // Revert on failure.
      setTodos((prev) =>
        prev.map((t) => (t.id === todo.id ? { ...t, done: todo.done } : t)),
      );
      Alert.alert('Error', 'Failed to update.');
    }
  };

  const remove = async (todo: Todo) => {
    const prev = todos;
    setTodos((cur) => cur.filter((t) => t.id !== todo.id));
    try {
      await api.deleteTodo(todo.id);
    } catch {
      setTodos(prev);
      Alert.alert('Error', 'Failed to delete.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Today</Text>
          <Text style={styles.muted}>{user?.email}</Text>
        </View>
        <Pressable onPress={logout} hitSlop={10}>
          <Text style={styles.logout}>Log out</Text>
        </Pressable>
      </View>

      <View style={styles.cards}>
        <ProgressCard
          label="To-dos"
          done={todos.filter((t) => t.done).length}
          total={todos.length}
        />
        <ProgressCard
          label="Weekly"
          done={summary?.weeklyGoals.done ?? 0}
          total={summary?.weeklyGoals.total ?? 0}
        />
        <ProgressCard
          label="Monthly"
          done={summary?.monthlyGoals.done ?? 0}
          total={summary?.monthlyGoals.total ?? 0}
        />
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a to-do…"
          value={newTitle}
          onChangeText={setNewTitle}
          onSubmitEditing={addTodo}
          returnKeyType="done"
        />
        <Pressable style={styles.addBtn} onPress={addTodo} disabled={adding}>
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
          data={todos}
          keyExtractor={(t) => t.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Nothing for today yet. Add one above.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Pressable style={styles.itemMain} onPress={() => toggle(item)}>
                <View style={[styles.check, item.done && styles.checkDone]}>
                  {item.done && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={[styles.itemText, item.done && styles.itemDone]}>
                  {item.title}
                </Text>
              </Pressable>
              <Pressable onPress={() => remove(item)} hitSlop={10}>
                <Text style={styles.delete}>✕</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 64 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: { fontSize: 32, fontWeight: '700' },
  muted: { color: '#666', marginTop: 2 },
  logout: { color: '#ef4444', fontWeight: '600' },
  cards: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  card: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  cardLabel: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  cardValue: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginTop: 4 },
  cardValueDone: { color: '#22c55e' },
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
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
