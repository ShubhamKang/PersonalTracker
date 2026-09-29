import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api, Progress, WeeklyReview } from '../../src/api/client';
import { Button, ProgressBar, Screen } from '../../src/components';
import { colors, radius, spacing, typography } from '../../src/theme/theme';

export default function ReviewScreen() {
  const [review, setReview] = useState<WeeklyReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    try {
      setReview(await api.weeklyReview());
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const exportData = async () => {
    setExporting(true);
    try {
      const data = await api.exportData();
      const json = JSON.stringify(data, null, 2);
      await Share.share({ title: 'Personal Tracker export', message: json });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Screen padded={false}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={styles.title}>Weekly Review</Text>

          {review && (
            <>
              <Text style={styles.range}>
                {review.weekStart} → {review.weekEnd}
              </Text>

              <View style={styles.rateCard}>
                <Text style={styles.rateValue}>{review.completionRate}%</Text>
                <Text style={styles.rateLabel}>overall completion</Text>
                <ProgressBar
                  percent={review.completionRate}
                  color={colors.success}
                  trackColor={colors.primaryDark}
                />
              </View>

              <StatRow label="To-dos" p={review.todos} />
              <StatRow label="Weekly goals" p={review.weeklyGoals} />
              <StatRow label="Monthly goals" p={review.monthlyGoals} />
              <StatRow label="Habits (this week)" p={review.habits} />

              {review.habitBreakdown.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionHeader}>HABIT BREAKDOWN</Text>
                  {review.habitBreakdown.map((h, idx) => (
                    <View key={`${h.title}-${idx}`} style={styles.habitRow}>
                      <Text style={styles.habitTitle} numberOfLines={1}>
                        {h.title}
                      </Text>
                      <Text
                        style={[
                          styles.habitStatus,
                          h.scheduled === 0
                            ? styles.habitNa
                            : h.completed >= h.scheduled
                            ? styles.habitDone
                            : styles.habitMissed,
                        ]}
                      >
                        {h.scheduled === 0
                          ? 'not this week'
                          : h.completed >= h.scheduled
                          ? '✓ done'
                          : 'missed'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          <Button
            title={exporting ? 'Preparing…' : 'Export my data'}
            onPress={exportData}
            loading={exporting}
            style={styles.exportBtn}
          />
          <Text style={styles.exportHint}>
            Exports all your todos, goals, habits, notes, and growth items as
            JSON.
          </Text>
        </ScrollView>
      )}
    </Screen>
  );
}

function StatRow({ label, p }: { label: string; p: Progress }) {
  const pct = p.total === 0 ? 0 : Math.round((p.done / p.total) * 100);
  return (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statCount}>
          {p.done}/{p.total}
        </Text>
      </View>
      <ProgressBar percent={pct} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.xl, paddingBottom: spacing.xl * 2 },
  title: typography.screenTitle,
  range: { color: colors.muted, marginTop: spacing.xs, marginBottom: spacing.lg },
  rateCard: {
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  rateValue: { color: colors.onDark, fontSize: 44, fontWeight: '800' },
  rateLabel: {
    color: colors.onDarkMuted,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  statCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statLabel: { ...typography.label, color: colors.text },
  statCount: { fontSize: 15, fontWeight: '700', color: colors.ink },
  section: { marginTop: spacing.md, marginBottom: spacing.sm },
  sectionHeader: {
    ...typography.overline,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  habitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
  },
  habitTitle: { fontSize: 15, color: colors.ink, flex: 1, marginRight: spacing.md },
  habitStatus: { fontSize: 13, fontWeight: '600' },
  habitDone: { color: colors.successDark },
  habitMissed: { color: colors.danger },
  habitNa: { color: colors.faint },
  exportBtn: { marginTop: spacing.xxl },
  exportHint: {
    color: colors.faint,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
