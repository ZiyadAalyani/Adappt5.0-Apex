import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius } from '../constants/theme';

export type DeviceStatus = 'safe' | 'warning' | 'critical' | 'offline';

interface DeviceCardProps {
  name: string;
  type: string;
  status: DeviceStatus;
  lastSeen?: string;
  onPress?: () => void;
}

const STATUS_CONFIG = {
  safe: { color: Colors.success, icon: 'shield-checkmark' as const, label: 'Protected' },
  warning: { color: Colors.warning, icon: 'warning' as const, label: 'Attention' },
  critical: { color: Colors.danger, icon: 'alert-circle' as const, label: 'At Risk' },
  offline: { color: Colors.textMuted, icon: 'cloud-offline' as const, label: 'Offline' },
};

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  camera: 'videocam',
  lock: 'lock-closed',
  light: 'bulb',
  thermostat: 'thermometer',
  speaker: 'volume-high',
  hub: 'home',
  tv: 'tv',
  plug: 'flash',
};

export default function DeviceCard({ name, type, status, lastSeen, onPress }: DeviceCardProps) {
  const config = STATUS_CONFIG[status];
  const iconName = TYPE_ICONS[type] || 'hardware-chip';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      <LinearGradient
        colors={['rgba(30,41,59,0.9)', 'rgba(15,23,42,0.95)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: `${config.color}40` }]}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${config.color}18` }]}>
          <Ionicons name={iconName} size={22} color={config.color} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.type}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
        </View>
        <View style={styles.statusCol}>
          <View style={[styles.dot, { backgroundColor: config.color }]} />
          <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          {lastSeen && <Text style={styles.lastSeen}>{lastSeen}</Text>}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  type: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusCol: {
    alignItems: 'flex-end',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  lastSeen: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
