import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api, Section } from '../../src/api/client';
import { Button, EmptyState, Screen, TextField } from '../../src/components';
import { colors, radius, spacing, typography } from '../../src/theme/theme';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // index+1 = ISO weekday

export default function HabitsScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newSection, setNewSection] = useState('');

  const load = useCallback(async () => {
    try {
      setSections(await api.listSections());
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const addSection = async () => {
    const name = newSection.trim();
    if (!name) {
      return;
    }
    try {
      await api.createSection(name);
      setNewSection('');
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    }
  };

  const removeSection = (section: Section) => {
    Alert.alert('Delete section?', `"${section.name}" and all its habits.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteSection(section.id);
            await load();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
          }
        },
      },
    ]);
  };

  const removeHabit = async (habitId: string) => {
    try {
      await api.deleteHabit(habitId);
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Habits</Text>

        <View style={styles.addRow}>
          <TextField
            style={styles.input}
            placeholder="New section (e.g. Skin Care)…"
            value={newSection}
            onChangeText={setNewSection}
            onSubmitEditing={addSection}
            returnKeyType="done"
          />
          <Button title="Add" onPress={addSection} style={styles.addBtn} />
        </View>

        {sections.length === 0 ? (
          <EmptyState message="No sections yet. Create one (Physical Fitness, Skin Care…) then add habits to specific weekdays." />
        ) : (
          sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              onDeleteSection={() => removeSection(section)}
              onDeleteHabit={removeHabit}
              onChanged={load}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function SectionCard({
  section,
  onDeleteSection,
  onDeleteHabit,
  onChanged,
}: {
  section: Section;
  onDeleteSection: () => void;
  onDeleteHabit: (habitId: string) => void;
  onChanged: () => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [weekday, setWeekday] = useState(1);
  const [busy, setBusy] = useState(false);

  const addHabit = async () => {
    const t = title.trim();
    if (!t) {
      return;
    }
    setBusy(true);
    try {
      await api.createHabit(section.id, t, weekday);
      setTitle('');
      await onChanged();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.sectionName}>{section.name}</Text>
        <Pressable onPress={onDeleteSection} hitSlop={8}>
          <Text style={styles.delete}>Delete</Text>
        </Pressable>
      </View>

      {section.habits.length === 0 ? (
        <Text style={styles.noHabits}>No habits yet.</Text>
      ) : (
        section.habits.map((h) => (
          <View key={h.id} style={styles.habitRow}>
            <Text style={styles.habitDay}>{WEEKDAYS[h.weekday - 1]}</Text>
            <Text style={styles.habitTitle}>{h.title}</Text>
            <Pressable onPress={() => onDeleteHabit(h.id)} hitSlop={8}>
              <Text style={styles.habitDelete}>✕</Text>
            </Pressable>
          </View>
        ))
      )}

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d, i) => {
          const wd = i + 1;
          return (
            <Pressable
              key={d}
              style={[styles.dayChip, weekday === wd && styles.dayChipActive]}
              onPress={() => setWeekday(wd)}
            >
              <Text
                style={[
                  styles.dayChipText,
                  weekday === wd && styles.dayChipTextActive,
                ]}
              >
                {d}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.addRow}>
        <TextField
          style={styles.input}
          placeholder={`Habit for ${WEEKDAYS[weekday - 1]}…`}
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={addHabit}
          returnKeyType="done"
        />
        <Button title="Add" onPress={addHabit} loading={busy} style={styles.addBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl * 2,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.screenTitle, marginBottom: spacing.lg },
  addRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  input: { flex: 1 },
  addBtn: { minWidth: 60 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionName: { ...typography.sectionTitle },
  delete: { color: colors.dangerSoft, fontWeight: '600', fontSize: 13 },
  noHabits: { color: colors.disabledText, fontStyle: 'italic', marginBottom: spacing.md },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.md,
  },
  habitDay: { width: 40, fontWeight: '700', color: colors.primary, fontSize: 13 },
  habitTitle: { flex: 1, fontSize: 15, color: colors.ink },
  habitDelete: { color: colors.disabledText, fontSize: 16 },
  weekdayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  dayChip: {
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.lg + 2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { fontSize: 12, color: colors.text, fontWeight: '600' },
  dayChipTextActive: { color: colors.onDark },
});
