import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../constants/theme';

interface RiskMeterProps {
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;
}

export default function RiskMeter({
  critical = 2,
  high = 5,
  medium = 12,
  low = 48,
}: RiskMeterProps) {
  const total = critical + high + medium + low;
  const segments = [
    { value: critical, color: Colors.chartCritical, label: 'Critical' },
    { value: high, color: Colors.chartHigh, label: 'High' },
    { value: medium, color: Colors.chartMedium, label: 'Medium' },
    { value: low, color: Colors.chartSafe, label: 'Safe' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Threat Level Distribution</Text>
      <View style={styles.bar}>
        {segments.map((s, i) => (
          <View
            key={s.label}
            style={[
              styles.segment,
              {
                flex: s.value,
                backgroundColor: s.color,
                borderTopLeftRadius: i === 0 ? 6 : 0,
                borderBottomLeftRadius: i === 0 ? 6 : 0,
                borderTopRightRadius: i === segments.length - 1 ? 6 : 0,
                borderBottomRightRadius: i === segments.length - 1 ? 6 : 0,
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.legend}>
        {segments.map((s) => (
          <View key={s.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendLabel}>{s.label}</Text>
            <Text style={styles.legendValue}>{s.value}</Text>
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
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  bar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  segment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginRight: 4,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
});
