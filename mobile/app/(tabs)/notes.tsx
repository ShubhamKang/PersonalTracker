import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api, Note } from '../../src/api/client';
import {
  Button,
  Checkbox,
  EmptyState,
  Screen,
  TextField,
} from '../../src/components';
import { colors, radius, spacing, typography } from '../../src/theme/theme';

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editing, setEditing] = useState<Note | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftPinned, setDraftPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setNotes(await api.listNotes());
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

  const openNew = () => {
    setEditing({ id: '', userId: '', title: '', content: '', pinned: false });
    setDraftTitle('');
    setDraftContent('');
    setDraftPinned(false);
  };

  const openEdit = (note: Note) => {
    setEditing(note);
    setDraftTitle(note.title);
    setDraftContent(note.content);
    setDraftPinned(note.pinned);
  };

  const closeEditor = () => setEditing(null);

  const save = async () => {
    const title = draftTitle.trim();
    if (!title) {
      Alert.alert('Title required', 'Please enter a title.');
      return;
    }
    setSaving(true);
    try {
      if (editing && editing.id) {
        const updated = await api.updateNote(editing.id, {
          title,
          content: draftContent,
          pinned: draftPinned,
        });
        setNotes((prev) =>
          sortNotes(prev.map((n) => (n.id === updated.id ? updated : n))),
        );
      } else {
        const created = await api.createNote({
          title,
          content: draftContent,
          pinned: draftPinned,
        });
        setNotes((prev) => sortNotes([created, ...prev]));
      }
      closeEditor();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const togglePin = async (note: Note) => {
    const next = !note.pinned;
    setNotes((prev) =>
      sortNotes(prev.map((n) => (n.id === note.id ? { ...n, pinned: next } : n))),
    );
    try {
      await api.updateNote(note.id, { pinned: next });
    } catch {
      setNotes((prev) =>
        sortNotes(
          prev.map((n) => (n.id === note.id ? { ...n, pinned: note.pinned } : n)),
        ),
      );
      Alert.alert('Error', 'Failed to update pin.');
    }
  };

  const remove = (note: Note) => {
    Alert.alert('Delete note', `Delete "${note.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const prev = notes;
          setNotes((cur) => cur.filter((n) => n.id !== note.id));
          try {
            await api.deleteNote(note.id);
          } catch {
            setNotes(prev);
            Alert.alert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Notes</Text>
        <Pressable style={styles.newBtn} onPress={openNew}>
          <Text style={styles.newBtnText}>+ New</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" />
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(n) => n.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={<EmptyState message="No notes yet. Tap “+ New”." />}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => openEdit(item)}>
              <View style={styles.cardHeader}>
                {item.pinned && <Text style={styles.pin}>📌</Text>}
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
              {item.content ? (
                <Text style={styles.cardBody} numberOfLines={2}>
                  {item.content}
                </Text>
              ) : null}
              <View style={styles.cardActions}>
                <Pressable onPress={() => togglePin(item)} hitSlop={8}>
                  <Text style={styles.action}>{item.pinned ? 'Unpin' : 'Pin'}</Text>
                </Pressable>
                <Pressable onPress={() => remove(item)} hitSlop={8}>
                  <Text style={[styles.action, styles.delete]}>Delete</Text>
                </Pressable>
              </View>
            </Pressable>
          )}
        />
      )}

      <Modal
        visible={editing !== null}
        animationType="slide"
        transparent
        onRequestClose={closeEditor}
      >
        <KeyboardAvoidingView
          style={styles.modalWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editing && editing.id ? 'Edit note' : 'New note'}
            </Text>
            <TextField
              style={styles.titleInput}
              placeholder="Title"
              value={draftTitle}
              onChangeText={setDraftTitle}
            />
            <TextField
              style={styles.contentInput}
              placeholder="Write something…"
              value={draftContent}
              onChangeText={setDraftContent}
              multiline
              textAlignVertical="top"
            />
            <Pressable
              style={styles.pinToggle}
              onPress={() => setDraftPinned((p) => !p)}
            >
              <Checkbox checked={draftPinned} size={22} />
              <Text style={styles.pinToggleText}>Pin to top</Text>
            </Pressable>
            <View style={styles.modalBtns}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={closeEditor}
                style={styles.modalBtn}
              />
              <Button
                title="Save"
                onPress={save}
                loading={saving}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

/** Pinned first, then keep existing (server-provided, roughly newest-first) order. */
function sortNotes(list: Note[]): Note[] {
  return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned));
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: typography.screenTitle,
  newBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  newBtnText: { color: colors.onDark, fontWeight: '600' },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  pin: { fontSize: 14 },
  cardTitle: { fontSize: 17, fontWeight: '700', flex: 1, color: colors.ink },
  cardBody: { color: colors.text, marginTop: spacing.xs + 2 },
  cardActions: { flexDirection: 'row', gap: spacing.lg + 2, marginTop: spacing.sm + 2 },
  action: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  delete: { color: colors.danger },
  modalWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    padding: spacing.xl,
    paddingBottom: spacing.xxl + spacing.sm,
  },
  modalTitle: { ...typography.sectionTitle, fontSize: 20, marginBottom: spacing.md + 2 },
  titleInput: { marginBottom: spacing.sm + 2 },
  contentInput: { minHeight: 140, marginBottom: spacing.md },
  pinToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    marginBottom: spacing.lg + 2,
  },
  pinToggleText: { fontSize: 15, color: colors.text },
  modalBtns: { flexDirection: 'row', gap: spacing.md },
  modalBtn: { flex: 1 },
});
