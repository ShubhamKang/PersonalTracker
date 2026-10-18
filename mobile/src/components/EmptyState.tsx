import { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/theme-context';
import { Colors, spacing } from '../theme/theme';

interface EmptyStateProps {
  message: string;
}

/** Centered muted placeholder shown when a list has no items. */
export function EmptyState({ message }: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Text style={styles.text}>{message}</Text>;
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    text: {
      textAlign: 'center',
      color: colors.faint,
      marginTop: spacing.xl * 2,
      lineHeight: 20,
      paddingHorizontal: spacing.xl,
    },
  });
}
