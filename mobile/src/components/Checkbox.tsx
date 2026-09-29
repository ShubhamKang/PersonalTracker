import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme/theme';

interface CheckboxProps {
  checked: boolean;
  size?: number;
}

/** Square check indicator used across todo/goal/habit lists. */
export function Checkbox({ checked, size = 24 }: CheckboxProps) {
  return (
    <View
      style={[
        styles.box,
        { width: size, height: size },
        checked && styles.boxChecked,
      ]}
    >
      {checked && <Text style={styles.mark}>✓</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.success, borderColor: colors.success },
  mark: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
