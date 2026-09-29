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
  TextInput,
  View,
} from 'react-native';
import { api, Note } from '../../src/api/client';

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Editor modal state. `editing` null => closed; note with empty id => new.
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
      sortNotes(
        prev.map((n) => (n.id === note.id ? { ...n, pinned: next } : n)),
      ),
    );
    try {
      await api.updateNote(note.id, { pinned: next });
    } catch {
      setNotes((prev) =>
        sortNotes(
          prev.map((n) =>
            n.id === note.id ? { ...n, pinned: note.pinned } : n,
          ),
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
    <View style={styles.container}>
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
          ListEmptyComponent={
            <Text style={styles.empty}>No notes yet. Tap “+ New”.</Text>
          }
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
                  <Text style={styles.action}>
                    {item.pinned ? 'Unpin' : 'Pin'}
                  </Text>
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
            <TextInput
              style={styles.titleInput}
              placeholder="Title"
              value={draftTitle}
              onChangeText={setDraftTitle}
            />
            <TextInput
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
              <View style={[styles.check, draftPinned && styles.checkOn]}>
                {draftPinned && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.pinToggleText}>Pin to top</Text>
            </Pressable>
            <View style={styles.modalBtns}>
              <Pressable
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={closeEditor}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={save}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/** Pinned first, then keep existing (server-provided, roughly newest-first) order. */
function sortNotes(list: Note[]): Note[] {
  return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned));
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 64 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 32, fontWeight: '700' },
  newBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  newBtnText: { color: '#fff', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pin: { fontSize: 14 },
  cardTitle: { fontSize: 17, fontWeight: '700', flex: 1, color: '#0f172a' },
  cardBody: { color: '#475569', marginTop: 6 },
  cardActions: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 10,
  },
  action: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
  delete: { color: '#dc2626' },
  modalWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 14 },
  titleInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 140,
    marginBottom: 12,
  },
  pinToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  checkMark: { color: '#fff', fontWeight: '700', fontSize: 13 },
  pinToggleText: { fontSize: 15, color: '#334155' },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtn: { backgroundColor: '#e2e8f0' },
  cancelText: { color: '#334155', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563eb' },
  saveText: { color: '#fff', fontWeight: '700' },
});
