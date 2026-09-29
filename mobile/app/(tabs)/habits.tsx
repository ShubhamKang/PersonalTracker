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

  // Notification settings (FR-21/22). Local mirror for optimistic UI.
  const [notifOn, setNotifOn] = useState(section.notificationsEnabled);
  const [reminder, setReminder] = useState(section.reminderTime ?? '21:30');
  const [savingNotif, setSavingNotif] = useState(false);

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

  const isValidTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s.trim());

  const toggleNotif = async () => {
    const next = !notifOn;
    // When enabling, ensure a valid reminder time is set (default 21:30).
    const time = isValidTime(reminder) ? reminder.trim() : '21:30';
    setNotifOn(next);
    if (!isValidTime(reminder)) {
      setReminder(time);
    }
    setSavingNotif(true);
    try {
      await api.updateSection(section.id, {
        notificationsEnabled: next,
        reminderTime: time,
      });
    } catch (e) {
      setNotifOn(!next); // revert
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setSavingNotif(false);
    }
  };

  const saveReminder = async () => {
    const time = reminder.trim();
    if (!isValidTime(time)) {
      Alert.alert('Invalid time', 'Use 24-hour HH:MM, e.g. 21:30.');
      setReminder(section.reminderTime ?? '21:30');
      return;
    }
    setSavingNotif(true);
    try {
      await api.updateSection(section.id, { reminderTime: time });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setSavingNotif(false);
    }
  };

  const sendTest = async () => {
    try {
      const res = await api.testNotification();
      if (res.count > 0) {
        Alert.alert(
          'Test sent',
          `${res.count} reminder(s) evaluated for your enabled sections. On a real device with notifications allowed, you'd receive them now.`,
        );
      } else {
        Alert.alert(
          'Nothing to send',
          'No enabled section has incomplete habits due today (reminders stay silent when everything is done).',
        );
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
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

      {/* Notification opt-in + reminder time (FR-21/22) */}
      <View style={styles.notifBlock}>
        <Pressable style={styles.notifToggleRow} onPress={toggleNotif}>
          <View style={styles.notifLabelWrap}>
            <Text style={styles.notifLabel}>Reminders</Text>
            <Text style={styles.notifHint}>
              {notifOn
                ? 'Lists only what you missed, at the time below.'
                : 'Off — no reminders for this section.'}
            </Text>
          </View>
          <View style={[styles.switchTrack, notifOn && styles.switchTrackOn]}>
            <View style={[styles.switchThumb, notifOn && styles.switchThumbOn]} />
          </View>
        </Pressable>

        {notifOn && (
          <View style={styles.reminderRow}>
            <Text style={styles.reminderLabel}>At</Text>
            <TextField
              style={styles.timeInput}
              value={reminder}
              onChangeText={setReminder}
              onBlur={saveReminder}
              onSubmitEditing={saveReminder}
              placeholder="21:30"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              returnKeyType="done"
            />
            <Text style={styles.reminderHint}>24-hour HH:MM</Text>
            {savingNotif && <ActivityIndicator style={{ marginLeft: 6 }} />}
            <Pressable style={styles.testBtn} onPress={sendTest} hitSlop={6}>
              <Text style={styles.testBtnText}>Send test</Text>
            </Pressable>
          </View>
        )}
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
  notifBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  notifToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifLabelWrap: { flex: 1, marginRight: spacing.md },
  notifLabel: { ...typography.label, color: colors.ink },
  notifHint: { fontSize: 12, color: colors.muted, marginTop: 2 },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.borderStrong,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackOn: { backgroundColor: colors.success },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.onDark,
    alignSelf: 'flex-start',
  },
  switchThumbOn: { alignSelf: 'flex-end' },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  reminderLabel: { color: colors.text, fontWeight: '600' },
  timeInput: { width: 84, textAlign: 'center' },
  reminderHint: { fontSize: 11, color: colors.faint },
  testBtn: {
    marginLeft: 'auto',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  testBtnText: { color: colors.primary, fontWeight: '600', fontSize: 12 },
});
