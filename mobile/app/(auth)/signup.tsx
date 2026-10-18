import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Localization from 'expo-localization';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/auth-context';
import { Button, TextField } from '../../src/components';
import { useTheme } from '../../src/theme/theme-context';
import { Colors, radius, spacing, typography } from '../../src/theme/theme';

export default function SignupScreen() {
  const { signup } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Enter email and password.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Use at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      // Capture device timezone automatically.
      const timezone = Localization.getCalendars()[0]?.timeZone ?? undefined;
      await signup(email.trim(), password, timezone);
    } catch (e) {
      Alert.alert('Signup failed', e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.mark}>
            <Ionicons name="checkmark-done" size={32} color={colors.onDark} />
          </View>
          <Text style={styles.appName}>Personal Tracker</Text>
          <Text style={styles.tagline}>Track your days, your way.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Create account</Text>
          <TextField
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            placeholder="Password (min 8 chars)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Button title="Sign up" onPress={onSubmit} loading={busy} style={styles.button} />
          <View style={styles.row}>
            <Text style={styles.muted}>Have an account? </Text>
            <Link href="/(auth)/login" style={styles.link}>
              Log in
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xxl },
    brand: { alignItems: 'center', marginBottom: spacing.xxl },
    mark: {
      width: 64,
      height: 64,
      borderRadius: radius.xl,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    appName: { ...typography.sectionTitle, fontSize: 22, color: colors.ink },
    tagline: { color: colors.muted, marginTop: 2, fontSize: 13 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xl,
      gap: spacing.md,
    },
    title: { ...typography.screenTitle, fontSize: 24, color: colors.ink, marginBottom: spacing.xs },
    button: { marginTop: spacing.xs },
    row: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sm },
    muted: { color: colors.muted },
    link: { color: colors.primary, fontWeight: '600' },
  });
}
