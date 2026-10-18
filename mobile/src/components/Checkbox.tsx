import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme-context';
import { Colors, radius } from '../theme/theme';

interface CheckboxProps {
  checked: boolean;
  size?: number;
}

/** Square check indicator used across todo/goal/habit lists. */
export function Checkbox({ checked, size = 24 }: CheckboxProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const scale = useRef(new Animated.Value(checked ? 1 : 0.6)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: checked ? 1 : 0.6,
      useNativeDriver: true,
      friction: 5,
      tension: 200,
    }).start();
  }, [checked, scale]);

  return (
    <View
      style={[
        styles.box,
        { width: size, height: size },
        checked && styles.boxChecked,
      ]}
    >
      {checked && (
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="checkmark" size={size * 0.7} color={colors.onDark} />
        </Animated.View>
      )}
    </View>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    box: {
      borderRadius: radius.sm,
      borderWidth: 2,
      borderColor: colors.faint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    boxChecked: { backgroundColor: colors.success, borderColor: colors.success },
  });
}
