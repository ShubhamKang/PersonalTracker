import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../src/context/auth-context';
import { Button, TextField } from '../../src/components';
import { colors, spacing, typography } from '../../src/theme/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Enter email and password.');
      return;
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      Alert.alert('Login failed', e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>
      <TextField
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Log in" onPress={onSubmit} loading={busy} style={styles.button} />
      <View style={styles.row}>
        <Text style={styles.muted}>No account? </Text>
        <Link href="/(auth)/signup" style={styles.link}>
          Sign up
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
