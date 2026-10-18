import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/auth-context';
import { api } from '../src/api/client';
import { Button, Screen, SectionHeading, TextField } from '../src/components';
import { useTheme, ThemePreference } from '../src/theme/theme-context';
import { Colors, radius, spacing, typography } from '../src/theme/theme';
import { haptics } from '../src/lib/haptics';

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

const APPEARANCE_OPTIONS: { value: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { colors, preference, setPreference } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

  const selectAppearance = (pref: ThemePreference) => {
    haptics.selection();
    setPreference(pref);
  };

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
            <Text style={styles.back}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Settings</Text>
        </View>

        <SectionHeading>ACCOUNT</SectionHeading>
        <View style={styles.card}>
          <Text style={styles.rowLabel}>Email</Text>
          <Text style={styles.rowValue}>{user?.email}</Text>
        </View>

        <SectionHeading>APPEARANCE</SectionHeading>
        <View style={styles.appearanceRow}>
          {APPEARANCE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.appearanceChip, preference === opt.value && styles.appearanceChipActive]}
              onPress={() => selectAppearance(opt.value)}
            >
              <Ionicons
                name={opt.icon}
                size={18}
                color={preference === opt.value ? colors.onDark : colors.text}
              />
              <Text
                style={[
                  styles.appearanceText,
                  preference === opt.value && styles.appearanceTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
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
          <Button title="Log out" variant="danger" icon="log-out-outline" onPress={logout} />
        </View>
      </ScrollView>
    </Screen>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl * 2 },
    header: { marginBottom: spacing.lg },
    backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: 2 },
    back: { color: colors.primary, fontWeight: '600', fontSize: 16 },
    title: { ...typography.screenTitle, color: colors.ink },
    card: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    rowLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
    rowValue: { color: colors.ink, fontSize: 16, marginTop: 2 },
    appearanceRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    appearanceChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
    appearanceChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    appearanceText: { color: colors.text, fontWeight: '600', fontSize: 13 },
    appearanceTextActive: { color: colors.onDark },
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
}
