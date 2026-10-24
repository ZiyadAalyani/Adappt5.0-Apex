import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius } from '../constants/theme';

interface PushAlertBannerProps {
  visible: boolean;
  title: string;
  message: string;
  severity?: 'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO';
  onDismiss: () => void;
  onInspect?: () => void;
}

export default function PushAlertBanner({
  visible,
  title,
  message,
  severity = 'CRITICAL',
  onDismiss,
  onInspect,
}: PushAlertBannerProps) {
  const translateY = useSharedValue(-150);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 14 });
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withTiming(-150, { duration: 300, easing: Easing.in(Easing.cubic) });
      opacity.value = withTiming(0, { duration: 250 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const isCritical = severity === 'CRITICAL';
  const glowColor = isCritical ? Colors.danger : Colors.warning;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={isCritical ? ['#3F1318', '#1F0B10'] : ['#36240B', '#1C1205']}
        style={[styles.banner, { borderColor: `${glowColor}80` }]}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${glowColor}25` }]}>
          <Ionicons name={isCritical ? 'shield-half' : 'warning'} size={22} color={glowColor} />
        </View>

        <View style={styles.textWrap}>
          <View style={styles.headerRow}>
            <Text style={[styles.badge, { color: glowColor }]}>
              {isCritical ? '🚨 ATTACK BLOCKED' : '⚠️ THREAT INTERCEPTED'}
            </Text>
            <Text style={styles.timeText}>Just now</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.message} numberOfLines={2}>{message}</Text>
        </View>

        <View style={styles.actions}>
          {onInspect && (
            <Pressable style={styles.inspectBtn} onPress={onInspect}>
              <Text style={styles.inspectText}>Inspect</Text>
            </Pressable>
          )}
          <Pressable style={styles.closeBtn} onPress={onDismiss}>
            <Ionicons name="close" size={18} color={Colors.textSecondary} />
          </Pressable>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 20,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  message: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  actions: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  inspectBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 6,
  },
  inspectText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
  },
});
