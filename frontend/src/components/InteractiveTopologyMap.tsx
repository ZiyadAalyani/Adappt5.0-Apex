import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Line,
  Defs,
  LinearGradient,
  Stop,
  G,
  Text as SvgText,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '../constants/theme';
import { SmartDevice, D2DRule } from '../services/api';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const { width: SCREEN_W } = Dimensions.get('window');

interface InteractiveTopologyMapProps {
  devices: SmartDevice[];
  d2dRules?: D2DRule[];
  onSelectDevice: (device: SmartDevice) => void;
}

export default function InteractiveTopologyMap({
  devices,
  d2dRules = [],
  onSelectDevice,
}: InteractiveTopologyMapProps) {
  const mapSize = SCREEN_W - 32;
  const centerX = mapSize / 2;
  const centerY = mapSize / 2;
  const radius = mapSize * 0.36;

  const pulse = useSharedValue(0);
  const packetFlow = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    packetFlow.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // Compute node positions in an orbit
  const nodeCount = Math.max(1, devices.length);
  const nodeCoords = devices.map((dev, i) => {
    const angle = (i / nodeCount) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { device: dev, x, y };
  });

  // Animated pulse props
  const centerPulseProps = useAnimatedProps(() => ({
    r: 32 + pulse.value * 6,
    opacity: 0.35 - pulse.value * 0.2,
  }));

  // Find zero-trust blocked relationships (e.g. bulb -> lock)
  const bulbNode = nodeCoords.find((n) => n.device.id === 'bulb_01');
  const lockNode = nodeCoords.find((n) => n.device.id === 'lock_01');
  const rogueNode = nodeCoords.find((n) => n.device.id === 'rogue_01');

  return (
    <View style={[styles.container, { width: mapSize, height: mapSize }]}>
      <Svg width={mapSize} height={mapSize}>
        <Defs>
          <LinearGradient id="hubGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#3B82F6" />
            <Stop offset="100%" stopColor="#1D4ED8" />
          </LinearGradient>
          <LinearGradient id="blockedLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#DC2626" stopOpacity="0.2" />
          </LinearGradient>
          <LinearGradient id="safeLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#22D3EE" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
          </LinearGradient>
        </Defs>

        {/* Outer Orbit Track */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={radius}
          stroke="rgba(59,130,246,0.12)"
          strokeWidth="1.5"
          strokeDasharray="6 6"
          fill="none"
        />

        {/* Hub-to-Device Links */}
        {nodeCoords.map((item) => {
          const isQuarantined = item.device.is_quarantined;
          const isCritical = item.device.risk_score >= 80;
          const lineColor = isQuarantined
            ? 'rgba(239,68,68,0.25)'
            : isCritical
            ? 'rgba(245,158,11,0.35)'
            : 'rgba(34,211,238,0.3)';

          return (
            <Line
              key={`hub-link-${item.device.id}`}
              x1={centerX}
              y1={centerY}
              x2={item.x}
              y2={item.y}
              stroke={lineColor}
              strokeWidth={isQuarantined ? 1 : 2}
              strokeDasharray={isQuarantined ? '4 4' : undefined}
            />
          );
        })}

        {/* D2D Zero-Trust Blocked Matrix Line (Bulb -> Lock) */}
        {bulbNode && lockNode && (
          <G>
            <Line
              x1={bulbNode.x}
              y1={bulbNode.y}
              x2={lockNode.x}
              y2={lockNode.y}
              stroke="url(#blockedLineGrad)"
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />
            {/* Midpoint Blocked Badge */}
            <Circle
              cx={(bulbNode.x + lockNode.x) / 2}
              cy={(bulbNode.y + lockNode.y) / 2}
              r="7"
              fill="#EF4444"
            />
          </G>
        )}

        {/* Rogue Device Quarantine Isolation Field */}
        {rogueNode && rogueNode.device.is_quarantined && (
          <Circle
            cx={rogueNode.x}
            cy={rogueNode.y}
            r="28"
            stroke="#EF4444"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            fill="rgba(239,68,68,0.12)"
          />
        )}

        {/* Center Gateway Hub Node */}
        <AnimatedCircle
          cx={centerX}
          cy={centerY}
          animatedProps={centerPulseProps}
          fill="#3B82F6"
        />
        <Circle cx={centerX} cy={centerY} r="26" fill="url(#hubGrad)" stroke="#60A5FA" strokeWidth="2" />
        <Circle cx={centerX} cy={centerY} r="10" fill="#E0F2FE" />
      </Svg>

      {/* Center Hub Label overlay */}
      <View style={[styles.centerLabelWrap, { top: centerY - 14, left: centerX - 26 }]}>
        <Text style={styles.hubLabelText}>GATEWAY</Text>
      </View>

      {/* Clickable Satellite Nodes overlay */}
      {nodeCoords.map((item) => {
        const isQuarantined = item.device.is_quarantined;
        const isRogue = item.device.device_type === 'unknown';
        const nodeColor = isQuarantined
          ? Colors.danger
          : isRogue
          ? Colors.chartCritical
          : item.device.risk_score > 50
          ? Colors.warning
          : Colors.success;

        return (
          <Pressable
            key={`node-${item.device.id}`}
            style={[
              styles.nodeButton,
              {
                left: item.x - 22,
                top: item.y - 22,
                borderColor: nodeColor,
              },
            ]}
            onPress={() => onSelectDevice(item.device)}
          >
            <View style={[styles.nodeInner, { backgroundColor: `${nodeColor}22` }]}>
              <Ionicons
                name={
                  item.device.device_type === 'camera'
                    ? 'videocam'
                    : item.device.device_type === 'lock'
                    ? 'lock-closed'
                    : item.device.device_type === 'light'
                    ? 'bulb'
                    : item.device.device_type === 'speaker'
                    ? 'volume-high'
                    : item.device.device_type === 'thermostat'
                    ? 'thermometer'
                    : 'hardware-chip'
                }
                size={18}
                color={nodeColor}
              />
            </View>
            {/* Floating Device Name Badge */}
            <View style={styles.nodeNameBadge}>
              <Text style={styles.nodeNameText} numberOfLines={1}>
                {item.device.device_name.split(' ')[0]}
              </Text>
            </View>
          </Pressable>
        );
      })}

      {/* Zero-Trust D2D Rule Legend overlay */}
      <View style={styles.mapLegend}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Active IoT (Zero-Trust)</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
          <Text style={styles.legendText}>D2D Traffic Blocked</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  centerLabelWrap: {
    position: 'absolute',
    width: 52,
    alignItems: 'center',
  },
  hubLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  nodeButton: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  nodeInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeNameBadge: {
    position: 'absolute',
    bottom: -16,
    backgroundColor: 'rgba(15,23,42,0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  nodeNameText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.text,
  },
  mapLegend: {
    position: 'absolute',
    bottom: 4,
    left: 8,
    flexDirection: 'row',
    gap: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
