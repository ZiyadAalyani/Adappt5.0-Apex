import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { Colors } from '../constants/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const { width: SCREEN_W } = Dimensions.get('window');

interface ThreatWaveChartProps {
  height?: number;
}

export default function ThreatWaveChart({ height = 120 }: ThreatWaveChartProps) {
  const phase = useSharedValue(0);

  useEffect(() => {
    phase.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const chartWidth = SCREEN_W - 64;

  // Generate a smooth wave path based on threat levels
  const generateWave = (offset: number, amplitude: number, baseY: number) => {
    const points: string[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * chartWidth;
      const y =
        baseY +
        Math.sin((i / steps) * Math.PI * 3 + offset * Math.PI * 2) * amplitude +
        Math.sin((i / steps) * Math.PI * 1.5 + offset) * (amplitude * 0.4);
      points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
    }
    return points.join(' ');
  };

  const animatedProps1 = useAnimatedProps(() => {
    const d = generateWave(phase.value, 18, height * 0.35);
    return { d };
  });

  const animatedProps2 = useAnimatedProps(() => {
    const d = generateWave(phase.value + 0.3, 12, height * 0.55);
    return { d };
  });

  const animatedProps3 = useAnimatedProps(() => {
    const d = generateWave(phase.value + 0.6, 8, height * 0.7);
    return { d };
  });

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Threat Detection</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>+12% safe</Text>
        </View>
      </View>
      <Svg width={chartWidth} height={height - 36}>
        <Defs>
          <LinearGradient id="wave1" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#22D3EE" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#3B82F6" stopOpacity="0.6" />
          </LinearGradient>
          <LinearGradient id="wave2" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#8B5CF6" stopOpacity="0.7" />
            <Stop offset="1" stopColor="#6366F1" stopOpacity="0.4" />
          </LinearGradient>
          <LinearGradient id="wave3" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#10B981" stopOpacity="0.5" />
            <Stop offset="1" stopColor="#059669" stopOpacity="0.3" />
          </LinearGradient>
        </Defs>
        <AnimatedPath
          animatedProps={animatedProps1}
          stroke="url(#wave1)"
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
        />
        <AnimatedPath
          animatedProps={animatedProps2}
          stroke="url(#wave2)"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <AnimatedPath
          animatedProps={animatedProps3}
          stroke="url(#wave3)"
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.labels}>
        <Text style={styles.month}>Jun</Text>
        <Text style={styles.month}>Jul</Text>
        <Text style={styles.month}>Aug</Text>
        <Text style={styles.month}>Sep</Text>
        <Text style={styles.month}>Oct</Text>
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
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  badge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  month: {
    fontSize: 10,
    color: Colors.textMuted,
  },
});
