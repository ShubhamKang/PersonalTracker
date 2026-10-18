import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme-context';
import { Colors, radius, spacing } from '../theme/theme';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  /** Optional leading icon, rendered before the title. */
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}

/** App-wide button with consistent sizing, colors, loading state, and press feedback. */
export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isDisabled = disabled || loading;
  const textColor = variant === 'secondary' ? colors.text : '#fff';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={isDisabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon && <Ionicons name={icon} size={16} color={textColor} />}
          <Text
            style={[
              styles.text,
              variant === 'secondary' && styles.textSecondary,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    base: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.surfaceAlt },
    danger: { backgroundColor: colors.danger },
    disabled: { backgroundColor: colors.primaryDisabled },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    text: { color: '#fff', fontSize: 16, fontWeight: '700' },
    textSecondary: { color: colors.text },
  });
}
