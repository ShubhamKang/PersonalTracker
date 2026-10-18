import { ReactNode, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme-context';
import { Colors, spacing } from '../theme/theme';

interface ScreenProps {
  children: ReactNode;
  /** Adds horizontal + top padding (default true). Set false for full-bleed lists. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Base screen wrapper that respects the device's safe-area top inset instead
 * of a hardcoded paddingTop, so headers clear the notch/status bar on every
 * device. Adds a small minimum in case insets are 0 (e.g. Android emulators).
 */
export function Screen({ children, padded = true, style }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + (padded ? spacing.md : 0),
          paddingHorizontal: padded ? spacing.xl : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
  });
}
