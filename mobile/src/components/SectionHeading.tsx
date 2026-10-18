import { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { useTheme } from '../theme/theme-context';
import { Colors, spacing, typography } from '../theme/theme';

interface SectionHeadingProps {
  children: string;
  style?: StyleProp<TextStyle>;
}

/** Uppercase overline used to label list sections (e.g. "TO-DOS"). */
export function SectionHeading({ children, style }: SectionHeadingProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Text style={[styles.heading, style]}>{children}</Text>;
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    heading: {
      ...typography.overline,
      color: colors.faint,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
  });
}
