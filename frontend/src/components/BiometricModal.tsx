import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius } from '../constants/theme';
import { requestBiometricStepUp } from '../services/biometrics';

interface BiometricModalProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function BiometricModal({
  visible,
  title = 'Biometric Authorization',
  subtitle = 'High-risk security action detected. Scan fingerprint or face to proceed.',
  actionLabel = 'Authorize Action',
  onSuccess,
  onCancel,
}: BiometricModalProps) {
  const handleScan = async () => {
    const res = await requestBiometricStepUp(subtitle);
    if (res.success) {
      onSuccess();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,8,16,0.85)' }]} />
        )}
        <View style={styles.cardWrapper}>
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            style={styles.card}
          >
            <View style={styles.glowRing}>
              <View style={styles.iconCircle}>
                <Ionicons name="finger-print" size={48} color={Colors.accent} />
              </View>
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
              <Text style={styles.badgeText}>Zero-Trust Step-Up Interceptor</Text>
            </View>

            <Pressable style={styles.authBtn} onPress={handleScan}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.authGradient}
              >
                <Ionicons name="scan" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.authBtnText}>{actionLabel}</Text>
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel Command</Text>
            </Pressable>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 360,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.3)',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 16,
  },
  card: {
    padding: 28,
    alignItems: 'center',
  },
  glowRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(34,211,238,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.35)',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(15,23,42,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    marginBottom: 24,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
    marginLeft: 6,
  },
  authBtn: {
    width: '100%',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: 12,
  },
  authGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  authBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
