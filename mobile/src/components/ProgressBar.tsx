import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius } from '../theme/theme';

interface ProgressBarProps {
  /** 0..100 */
  percent: number;
  color?: string;
  trackColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/** Simple horizontal progress bar clamped to 0..100. */
export function ProgressBar({
  percent,
  color = colors.primary,
  trackColor = colors.border,
  height = 8,
  style,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: trackColor },
        style,
      ]}
    >
      <View
        style={{
          width: `${clamped}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: radius.pill,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
});
