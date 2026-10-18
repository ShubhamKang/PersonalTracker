import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme/theme-context';
import { Colors, radius } from '../theme/theme';

interface ProgressBarProps {
  /** 0..100 */
  percent: number;
  color?: string;
  trackColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/** Horizontal progress bar, clamped to 0..100, that animates between values. */
export function ProgressBar({
  percent,
  color,
  trackColor,
  height = 8,
  style,
}: ProgressBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fillColor = color ?? colors.primary;
  const fillTrackColor = trackColor ?? colors.border;

  const clamped = Math.max(0, Math.min(100, percent));
  const animated = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    Animated.timing(animated, {
      toValue: clamped,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [clamped, animated]);

  const width = animated.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: fillTrackColor },
        style,
      ]}
    >
      <Animated.View
        style={{
          width,
          height: '100%',
          backgroundColor: fillColor,
          borderRadius: radius.pill,
        }}
      />
    </Animated.View>
  );
}

function createStyles(_colors: Colors) {
  return StyleSheet.create({
    track: { width: '100%', overflow: 'hidden' },
  });
}
