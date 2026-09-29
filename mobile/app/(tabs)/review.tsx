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
      await Share.share({
        title: 'Personal Tracker export',
        message: json,
      });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
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

          {/* Overall completion ring-ish header */}
          <View style={styles.rateCard}>
            <Text style={styles.rateValue}>{review.completionRate}%</Text>
            <Text style={styles.rateLabel}>overall completion</Text>
            <View style={styles.rateBar}>
              <View
                style={[
                  styles.rateFill,
                  { width: `${review.completionRate}%` },
                ]}
              />
            </View>
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

      <Text
        style={[styles.exportBtn, exporting && styles.exportBtnDisabled]}
        onPress={exporting ? undefined : exportData}
        suppressHighlighting
      >
        {exporting ? 'Preparing…' : 'Export my data'}
      </Text>
      <Text style={styles.exportHint}>
        Exports all your todos, goals, habits, notes, and growth items as JSON.
      </Text>
    </ScrollView>
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
      <View style={styles.statBar}>
        <View style={[styles.statFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 64, paddingBottom: 48 },
  title: { fontSize: 32, fontWeight: '700' },
  range: { color: '#64748b', marginTop: 4, marginBottom: 18 },
  rateCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  rateValue: { color: '#fff', fontSize: 44, fontWeight: '800' },
  rateLabel: { color: '#94a3b8', marginTop: 2, marginBottom: 14 },
  rateBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1e293b',
    overflow: 'hidden',
  },
  rateFill: { height: '100%', backgroundColor: '#22c55e' },
  statCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: { fontSize: 15, fontWeight: '600', color: '#334155' },
  statCount: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  statBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  statFill: { height: '100%', backgroundColor: '#2563eb' },
  section: { marginTop: 12, marginBottom: 8 },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 8,
  },
  habitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  habitTitle: { fontSize: 15, color: '#0f172a', flex: 1, marginRight: 12 },
  habitStatus: { fontSize: 13, fontWeight: '600' },
  habitDone: { color: '#16a34a' },
  habitMissed: { color: '#dc2626' },
  habitNa: { color: '#94a3b8' },
  exportBtn: {
    marginTop: 24,
    backgroundColor: '#2563eb',
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    overflow: 'hidden',
  },
  exportBtnDisabled: { backgroundColor: '#93c5fd' },
  exportHint: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
