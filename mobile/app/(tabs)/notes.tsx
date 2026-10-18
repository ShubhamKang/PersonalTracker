import { useMemo, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { Note } from '../../src/api/client';
import {
  useCreateNote,
  useDeleteNote,
  useNotes,
  useUpdateNote,
} from '../../src/api/hooks';
import {
  Button,
  Checkbox,
  EmptyState,
  Screen,
  TextField,
} from '../../src/components';
import { useTheme } from '../../src/theme/theme-context';
import { Colors, radius, spacing, typography } from '../../src/theme/theme';
import { haptics } from '../../src/lib/haptics';

export default function NotesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data: notes = [], isLoading, isRefetching, refetch } = useNotes();

  const [editing, setEditing] = useState<Note | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftPinned, setDraftPinned] = useState(false);

  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

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
    try {
      if (editing && editing.id) {
        await updateNote.mutateAsync({
          id: editing.id,
          data: { title, content: draftContent, pinned: draftPinned },
        });
      } else {
        await createNote.mutateAsync({
          title,
          content: draftContent,
          pinned: draftPinned,
        });
      }
      closeEditor();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    }
  };

  const togglePin = (note: Note) => {
    haptics.selection();
    updateNote.mutate({ id: note.id, data: { pinned: !note.pinned } });
  };

  const remove = (note: Note) => {
    Alert.alert('Delete note', `Delete "${note.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          haptics.warning();
          deleteNote.mutate(note.id);
        },
      },
    ]);
  };

  const saving = createNote.isPending || updateNote.isPending;

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Notes</Text>
        <Pressable style={styles.newBtn} onPress={openNew}>
          <Ionicons name="add" size={16} color={colors.onDark} />
          <Text style={styles.newBtnText}>New</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={notes as Note[]}
          keyExtractor={(n) => n.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
            />
          }
          ListEmptyComponent={<EmptyState message={'No notes yet. Tap "+ New".'} />}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => openEdit(item)}
            >
              <View style={styles.cardHeader}>
                {item.pinned && (
                  <Ionicons name="pin" size={14} color={colors.primary} />
                )}
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
                <Pressable onPress={() => togglePin(item)} hitSlop={8} style={styles.actionBtn}>
                  <Ionicons
                    name={item.pinned ? 'pin' : 'pin-outline'}
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={styles.action}>{item.pinned ? 'Unpin' : 'Pin'}</Text>
                </Pressable>
                <Pressable onPress={() => remove(item)} hitSlop={8} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={14} color={colors.danger} />
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

function createStyles(colors: Colors) {
  return StyleSheet.create({
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    title: typography.screenTitle,
    newBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
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
    cardPressed: { opacity: 0.7 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
    cardTitle: { fontSize: 17, fontWeight: '700', flex: 1, color: colors.ink },
    cardBody: { color: colors.text, marginTop: spacing.xs + 2 },
    cardActions: { flexDirection: 'row', gap: spacing.lg + 2, marginTop: spacing.sm + 2 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
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
    modalTitle: { ...typography.sectionTitle, fontSize: 20, marginBottom: spacing.md + 2, color: colors.ink },
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
}
