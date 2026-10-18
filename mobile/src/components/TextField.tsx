import { forwardRef, useMemo } from 'react';
import { StyleProp, StyleSheet, TextInput, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '../theme/theme-context';
import { Colors, radius, spacing } from '../theme/theme';

interface TextFieldProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
}

/** Consistent text input with the app's border/radius/placeholder styling. */
export const TextField = forwardRef<TextInput, TextFieldProps>(
  ({ style, ...props }, ref) => {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    return (
      <TextInput
        ref={ref}
        placeholderTextColor={colors.faint}
        style={[styles.input, style]}
        {...props}
      />
    );
  },
);

TextField.displayName = 'TextField';

function createStyles(colors: Colors) {
  return StyleSheet.create({
    input: {
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: 16,
      color: colors.ink,
      backgroundColor: colors.background,
    },
  });
}
