import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius } from '../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  borderGlow?: boolean;
  glowColor?: string;
}

export default function GlassCard({
  children,
  style,
  intensity = 40,
  borderGlow = true,
  glowColor = Colors.primary,
}: GlassCardProps) {
  const content = (
    <LinearGradient
      colors={[
        'rgba(255,255,255,0.08)',
        'rgba(255,255,255,0.03)',
        'rgba(15,23,42,0.4)',
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.innerBorder}>{children}</View>
    </LinearGradient>
  );

  return (
    <View style={[styles.wrapper, borderGlow && { shadowColor: glowColor }, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={intensity} tint="dark" style={styles.blur}>
          {content}
        </BlurView>
      ) : (
        <View style={styles.androidGlassWrapper}>
          {content}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: 'rgba(15,23,42,0.72)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 3,
  },
  androidGlassWrapper: {
    backgroundColor: 'rgba(11,18,34,0.85)',
  },
  blur: {
    width: '100%',
  },
  gradient: {
    width: '100%',
  },
  innerBorder: {
    padding: 2,
  },
});
