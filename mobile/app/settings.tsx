import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/auth-context';
import { api } from '../src/api/client';
import { Button, Screen, SectionHeading, TextField } from '../src/components';
import { colors, radius, spacing, typography } from '../src/theme/theme';

// A short curated list of common IANA zones for quick selection. Users can
// also type any valid IANA zone; the backend validates it.
const COMMON_ZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney',
  'UTC',
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const [timezone, setTimezone] = useState(user?.timezone ?? 'Asia/Kolkata');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const tz = timezone.trim();
    if (!tz) {
      Alert.alert('Timezone required', 'Enter or pick a timezone.');
      return;
    }
    setSaving(true);
    try {
      await api.updateProfile({ timezone: tz });
      await refreshUser();
      Alert.alert('Saved', 'Your timezone has been updated.');
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'Failed to update timezone',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Text style={styles.title}>Settings</Text>
        </View>

        <SectionHeading>ACCOUNT</SectionHeading>
        <View style={styles.card}>
          <Text style={styles.rowLabel}>Email</Text>
          <Text style={styles.rowValue}>{user?.email}</Text>
        </View>

        <SectionHeading>TIMEZONE</SectionHeading>
        <Text style={styles.help}>
          Used for “today”, weekly/monthly rollovers, and reminder times.
        </Text>
        <TextField
          value={timezone}
          onChangeText={setTimezone}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="e.g. Asia/Kolkata"
          style={styles.tzInput}
        />
        <View style={styles.chips}>
          {COMMON_ZONES.map((z) => (
            <Pressable
              key={z}
              style={[styles.chip, timezone === z && styles.chipActive]}
              onPress={() => setTimezone(z)}
            >
              <Text
                style={[styles.chipText, timezone === z && styles.chipTextActive]}
              >
                {z}
              </Text>
            </Pressable>
          ))}
        </View>
        <Button
          title="Save timezone"
          onPress={save}
          loading={saving}
          style={styles.saveBtn}
        />

        <View style={styles.logoutWrap}>
          <Button title="Log out" variant="danger" onPress={logout} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl * 2 },
  header: { marginBottom: spacing.lg },
  back: { color: colors.primary, fontWeight: '600', fontSize: 16, marginBottom: spacing.sm },
  title: typography.screenTitle,
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  rowLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  rowValue: { color: colors.ink, fontSize: 16, marginTop: 2 },
  help: { color: colors.muted, fontSize: 13, marginBottom: spacing.sm },
  tzInput: { marginBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 12 },
  chipTextActive: { color: colors.onDark },
  saveBtn: { marginBottom: spacing.xxl },
  logoutWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xl,
  },
});
