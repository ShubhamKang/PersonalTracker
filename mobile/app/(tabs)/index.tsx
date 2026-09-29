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
import { useAuth } from '../../src/context/auth-context';
import { api, Todo, DashboardSummary, DueHabit } from '../../src/api/client';
import {
  Button,
  Checkbox,
  EmptyState,
  Screen,
  SectionHeading,
  TextField,
} from '../../src/components';
import { colors, radius, spacing, typography } from '../../src/theme/theme';

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
  const [habits, setHabits] = useState<DueHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const [list, sum, due] = await Promise.all([
        api.listTodayTodos(),
        api.dashboardSummary(),
        api.habitsToday(),
      ]);
      setTodos(list);
      setSummary(sum);
      setHabits(due);
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
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)),
    );
    try {
      await api.updateTodo(todo.id, { done: !todo.done });
    } catch {
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

  const toggleHabit = async (habit: DueHabit) => {
    const nextDone = !habit.done;
    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id
          ? {
              ...h,
              done: nextDone,
              streak: nextDone ? h.streak + 1 : Math.max(0, h.streak - 1),
            }
          : h,
      ),
    );
    try {
      if (nextDone) {
        await api.completeHabit(habit.id);
      } else {
        await api.uncompleteHabit(habit.id);
      }
    } catch {
      setHabits((prev) => prev.map((h) => (h.id === habit.id ? habit : h)));
      Alert.alert('Error', 'Failed to update habit.');
    }
  };

  const habitSections = Array.from(
    habits.reduce((map, h) => {
      const arr = map.get(h.sectionName) ?? [];
      arr.push(h);
      map.set(h.sectionName, arr);
      return map;
    }, new Map<string, DueHabit[]>()),
  );

  return (
    <Screen>
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
          label="Habits"
          done={habits.filter((h) => h.done).length}
          total={habits.length}
        />
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
        <TextField
          style={styles.input}
          placeholder="Add a to-do…"
          value={newTitle}
          onChangeText={setNewTitle}
          onSubmitEditing={addTodo}
          returnKeyType="done"
        />
        <Button title="Add" onPress={addTodo} loading={adding} style={styles.addBtn} />
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
          ListHeaderComponent={
            <View>
              {habitSections.length > 0 && (
                <View style={styles.habitsBlock}>
                  <SectionHeading>TODAY'S HABITS</SectionHeading>
                  {habitSections.map(([sectionName, items]) => (
                    <View key={sectionName} style={styles.habitSection}>
                      <Text style={styles.habitSectionName}>{sectionName}</Text>
                      {items.map((h) => (
                        <Pressable
                          key={h.id}
                          style={styles.item}
                          onPress={() => toggleHabit(h)}
                        >
                          <View style={styles.itemMain}>
                            <Checkbox checked={h.done} />
                            <Text
                              style={[styles.itemText, h.done && styles.itemDone]}
                            >
                              {h.title}
                            </Text>
                          </View>
                          {h.streak > 0 && (
                            <Text style={styles.streak}>🔥 {h.streak}</Text>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  ))}
                </View>
              )}
              <SectionHeading>TO-DOS</SectionHeading>
            </View>
          }
          ListEmptyComponent={
            <EmptyState message="Nothing for today yet. Add one above." />
          }
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Pressable style={styles.itemMain} onPress={() => toggle(item)}>
                <Checkbox checked={item.done} />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: typography.screenTitle,
  muted: { color: colors.muted, marginTop: 2 },
  logout: { color: colors.dangerSoft, fontWeight: '600' },
  cards: { flexDirection: 'row', gap: spacing.sm + 2, marginBottom: spacing.lg },
  card: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  cardLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  cardValue: { fontSize: 22, fontWeight: '700', color: colors.ink, marginTop: spacing.xs },
  cardValueDone: { color: colors.success },
  habitsBlock: { marginBottom: spacing.md },
  habitSection: { marginBottom: spacing.sm },
  habitSectionName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.xs + 2,
    marginBottom: 2,
  },
  streak: { color: colors.warning, fontWeight: '700', fontSize: 13 },
  addRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  input: { flex: 1 },
  addBtn: { minWidth: 64 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  itemMain: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.md },
  itemText: { fontSize: 16, flex: 1, color: colors.ink },
  itemDone: { textDecorationLine: 'line-through', color: colors.faint },
  delete: { color: colors.disabledText, fontSize: 18, paddingHorizontal: spacing.xs },
});
