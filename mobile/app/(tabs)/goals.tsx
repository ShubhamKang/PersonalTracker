import { useState } from 'react';
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
import { GoalCategory, GoalScope } from '../../src/api/client';
import {
  useCreateGoal,
  useDeleteGoal,
  useGoals,
  useUpdateGoal,
} from '../../src/api/hooks';
import {
  Button,
  Checkbox,
  EmptyState,
  Screen,
  TextField,
} from '../../src/components';
import { colors, radius, spacing, typography } from '../../src/theme/theme';

const SCOPES: GoalScope[] = ['WEEKLY', 'MONTHLY'];
const CATEGORIES: GoalCategory[] = ['STUDY', 'OTHER'];

export default function GoalsScreen() {
  const [scope, setScope] = useState<GoalScope>('WEEKLY');
  const [newTitle, setNewTitle] = useState('');
  const [category, setCategory] = useState<GoalCategory>('STUDY');

  const { data: goals = [], isLoading, isRefetching, refetch } = useGoals(scope);
  const createGoal = useCreateGoal(scope);
  const updateGoal = useUpdateGoal(scope);
  const deleteGoal = useDeleteGoal(scope);

  const addGoal = async () => {
    const title = newTitle.trim();
    if (!title) return;
    try {
      await createGoal.mutateAsync({ category, title });
      setNewTitle('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to add');
    }
  };

  const sections = CATEGORIES.map((cat) => ({
    category: cat,
    items: goals.filter((g) => g.category === cat),
  }));

  return (
    <Screen>
      <Text style={styles.title}>Goals</Text>

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

      <View style={styles.addRow}>
        <TextField
          style={styles.input}
          placeholder={`Add a ${scope === 'WEEKLY' ? 'weekly' : 'monthly'} goal…`}
          value={newTitle}
          onChangeText={setNewTitle}
          onSubmitEditing={addGoal}
          returnKeyType="done"
        />
        <Button
          title="Add"
          onPress={addGoal}
          loading={createGoal.isPending}
          style={styles.addBtn}
        />
      </View>

      <View style={styles.catRow}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c}
            style={[styles.catChip, category === c && styles.catChipActive]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.catText, category === c && styles.catTextActive]}>
              {c}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(s) => s.category}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
            />
          }
          ListEmptyComponent={<EmptyState message="No goals yet. Add one above." />}
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
                      onPress={() =>
                        updateGoal.mutate({ id: goal.id, data: { done: !goal.done } })
                      }
                    >
                      <Checkbox checked={goal.done} />
                      <Text style={[styles.itemText, goal.done && styles.itemDone]}>
                        {goal.title}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => deleteGoal.mutate(goal.id)} hitSlop={10}>
                      <Text style={styles.delete}>✕</Text>
                    </Pressable>
                  </View>
                ))
              )}
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
  addRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm + 2 },
  input: { flex: 1 },
  addBtn: { minWidth: 64 },
  catRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  catChip: {
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  catChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  catText: { color: colors.text, fontWeight: '600', fontSize: 12 },
  catTextActive: { color: colors.onDark },
  section: { marginBottom: spacing.xl },
  sectionHeader: {
    ...typography.overline,
    fontSize: 13,
    color: colors.muted,
    marginBottom: spacing.xs + 2,
  },
  sectionEmpty: {
    color: colors.disabledText,
    fontStyle: 'italic',
    paddingVertical: spacing.xs + 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  itemMain: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.md },
  itemText: { fontSize: 16, flex: 1, color: colors.ink },
  itemDone: { textDecorationLine: 'line-through', color: colors.faint },
  delete: { color: colors.disabledText, fontSize: 18, paddingHorizontal: spacing.xs },
});
