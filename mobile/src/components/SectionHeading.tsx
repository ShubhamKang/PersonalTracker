import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { colors, spacing, typography } from '../theme/theme';

interface SectionHeadingProps {
  children: string;
  style?: StyleProp<TextStyle>;
}

/** Uppercase overline used to label list sections (e.g. "TO-DOS"). */
export function SectionHeading({ children, style }: SectionHeadingProps) {
  return <Text style={[styles.heading, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  heading: {
    ...typography.overline,
    color: colors.faint,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
});
