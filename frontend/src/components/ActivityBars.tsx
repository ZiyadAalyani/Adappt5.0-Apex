import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/theme';

const DATA = [
  { label: 'Mon', value: 0.35 },
  { label: 'Tue', value: 0.55 },
  { label: 'Wed', value: 0.42 },
  { label: 'Thu', value: 0.78 },
  { label: 'Fri', value: 0.92 },
  { label: 'Sat', value: 0.65 },
  { label: 'Sun', value: 0.48 },
];

interface BarProps {
  value: number;
  delay: number;
  isPeak?: boolean;
}

function Bar({ value, delay, isPeak }: BarProps) {
  const height = useSharedValue(0);

  useEffect(() => {
    height.value = withDelay(
      delay,
      withTiming(value, { duration: 900, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    height: `${height.value * 100}%`,
  }));

  return (
    <View style={styles.barTrack}>
      <Animated.View
        style={[
          styles.barFill,
          style,
          isPeak && styles.barPeak,
        ]}
      />
    </View>
  );
}

export default function ActivityBars() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Device Activity</Text>
        <Text style={styles.count}>142 events</Text>
      </View>
      <View style={styles.chart}>
        {DATA.map((d, i) => (
          <View key={d.label} style={styles.col}>
            <Bar value={d.value} delay={i * 80} isPeak={d.value > 0.8} />
            <Text style={styles.label}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  count: {
    fontSize: 12,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  chart: {
    flexDirection: 'row',
    height: 90,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 18,
    height: '85%',
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 6,
    opacity: 0.85,
  },
  barPeak: {
    backgroundColor: Colors.accent,
  },
  label: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 6,
  },
});
