import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as Localization from 'expo-localization';
import { Link } from 'expo-router';
import { useAuth } from '../../src/context/auth-context';
import { Button, TextField } from '../../src/components';
import { colors, spacing, typography } from '../../src/theme/theme';

export default function SignupScreen() {
  const { signup } = useAuth();
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
    <View style={styles.container}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: { ...typography.screenTitle, fontSize: 28, marginBottom: spacing.md },
  button: { marginTop: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sm },
  muted: { color: colors.muted },
  link: { color: colors.primary, fontWeight: '600' },
});
