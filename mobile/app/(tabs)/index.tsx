import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/context/auth-context';

export default function TodayScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today</Text>
      <Text style={styles.muted}>Signed in as</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.tz}>Timezone: {user?.timezone}</Text>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Your daily to-dos, goals, and habits will appear here (Phase 1+).
        </Text>
      </View>

      <Pressable style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 80, gap: 8 },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 16 },
  muted: { color: '#666' },
  email: { fontSize: 18, fontWeight: '600' },
  tz: { color: '#444', marginTop: 4 },
  placeholder: {
    marginTop: 24,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  placeholderText: { color: '#475569', lineHeight: 20 },
  logout: {
    marginTop: 'auto',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
  },
  logoutText: { color: '#ef4444', fontWeight: '600' },
});
