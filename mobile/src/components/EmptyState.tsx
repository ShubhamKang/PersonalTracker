import { StyleSheet, Text } from 'react-native';
import { colors, spacing } from '../theme/theme';

interface EmptyStateProps {
  message: string;
}

/** Centered muted placeholder shown when a list has no items. */
export function EmptyState({ message }: EmptyStateProps) {
  return <Text style={styles.text}>{message}</Text>;
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
    color: colors.faint,
    marginTop: spacing.xl * 2,
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
  },
});
