import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api, Section } from '../../src/api/client';

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
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Habits</Text>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="New section (e.g. Skin Care)…"
          value={newSection}
          onChangeText={setNewSection}
          onSubmitEditing={addSection}
          returnKeyType="done"
        />
        <Pressable style={styles.addBtn} onPress={addSection}>
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      {sections.length === 0 ? (
        <Text style={styles.empty}>
          No sections yet. Create one (Physical Fitness, Skin Care…) then add
          habits to specific weekdays.
        </Text>
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

      {/* Add habit */}
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
        <TextInput
          style={styles.input}
          placeholder={`Habit for ${WEEKDAYS[weekday - 1]}…`}
          value={title}
          onChangeText={setTitle}
          onSubmitEditing={addHabit}
          returnKeyType="done"
        />
        <Pressable style={styles.addBtn} onPress={addHabit} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addBtnText}>Add</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 64 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 16 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  addBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    minWidth: 60,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '600' },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 30, lineHeight: 20 },
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionName: { fontSize: 18, fontWeight: '700' },
  delete: { color: '#ef4444', fontWeight: '600', fontSize: 13 },
  noHabits: { color: '#cbd5e1', fontStyle: 'italic', marginBottom: 10 },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f7',
    gap: 10,
  },
  habitDay: {
    width: 40,
    fontWeight: '700',
    color: '#2563eb',
    fontSize: 13,
  },
  habitTitle: { flex: 1, fontSize: 15 },
  habitDelete: { color: '#cbd5e1', fontSize: 16 },
  weekdayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    marginBottom: 10,
  },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  dayChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  dayChipText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  dayChipTextActive: { color: '#fff' },
});
