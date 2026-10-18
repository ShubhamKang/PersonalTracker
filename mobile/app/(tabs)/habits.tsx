import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api, Section } from '../../src/api/client';
import { useInvalidateSections, useSections } from '../../src/api/hooks';
import { Button, EmptyState, Screen, TextField } from '../../src/components';
import { useTheme } from '../../src/theme/theme-context';
import { Colors, radius, spacing, typography } from '../../src/theme/theme';
import { haptics } from '../../src/lib/haptics';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function HabitsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [newSection, setNewSection] = useState('');
  const { data: sections = [], isLoading, isRefetching, refetch } = useSections();
  const invalidate = useInvalidateSections();

  const addSection = async () => {
    const name = newSection.trim();
    if (!name) return;
    try {
      await api.createSection(name);
      setNewSection('');
      void invalidate();
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
          haptics.warning();
          try {
            await api.deleteSection(section.id);
            void invalidate();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
          }
        },
      },
    ]);
  };

  const removeHabit = async (habitId: string) => {
    haptics.warning();
    try {
      await api.deleteHabit(habitId);
      void invalidate();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
          />
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
              onChanged={invalidate}
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [title, setTitle] = useState('');
  const [weekday, setWeekday] = useState(1);
  const [busy, setBusy] = useState(false);

  const [notifOn, setNotifOn] = useState(section.notificationsEnabled);
  const [reminder, setReminder] = useState(section.reminderTime ?? '21:30');
  const [savingNotif, setSavingNotif] = useState(false);

  const addHabit = async () => {
    const t = title.trim();
    if (!t) return;
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

  const selectWeekday = (wd: number) => {
    haptics.selection();
    setWeekday(wd);
  };

  const isValidTime = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s.trim());

  const toggleNotif = async () => {
    haptics.selection();
    const next = !notifOn;
    const time = isValidTime(reminder) ? reminder.trim() : '21:30';
    setNotifOn(next);
    if (!isValidTime(reminder)) setReminder(time);
    setSavingNotif(true);
    try {
      await api.updateSection(section.id, { notificationsEnabled: next, reminderTime: time });
    } catch (e) {
      setNotifOn(!next);
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
      Alert.alert(
        res.count > 0 ? 'Test sent' : 'Nothing to send',
        res.count > 0
          ? `${res.count} reminder(s) evaluated. You'd receive them on a real device.`
          : 'No enabled section has incomplete habits due today.',
      );
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
              <Ionicons name="trash-outline" size={16} color={colors.disabledText} />
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
              onPress={() => selectWeekday(wd)}
            >
              <Text style={[styles.dayChipText, weekday === wd && styles.dayChipTextActive]}>
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

      <View style={styles.notifBlock}>
        <View style={styles.notifToggleRow}>
          <View style={styles.notifLabelWrap}>
            <Text style={styles.notifLabel}>Reminders</Text>
            <Text style={styles.notifHint}>
              {notifOn ? 'Lists only what you missed, at the time below.' : 'Off — no reminders for this section.'}
            </Text>
          </View>
          <Switch
            value={notifOn}
            onValueChange={toggleNotif}
            trackColor={{ false: colors.borderStrong, true: colors.success }}
            thumbColor={colors.onDark}
          />
        </View>

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
            {savingNotif && <ActivityIndicator style={{ marginLeft: 6 }} color={colors.primary} />}
            <Pressable style={styles.testBtn} onPress={sendTest} hitSlop={6}>
              <Ionicons name="notifications-outline" size={13} color={colors.primary} />
              <Text style={styles.testBtnText}>Send test</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl * 2 },
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
    sectionName: { ...typography.sectionTitle, color: colors.ink },
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    testBtnText: { color: colors.primary, fontWeight: '600', fontSize: 12 },
  });
}
