import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius } from '../constants/theme';
import { SmartDevice } from '../services/api';

interface DeviceDetailModalProps {
  device: SmartDevice | null;
  visible: boolean;
  onClose: () => void;
  onQuarantineToggle: (deviceId: string, isQuarantined: boolean) => void;
  onEnforceEncryption: (deviceId: string) => void;
  onThrottleToggle?: (deviceId: string) => void;
}

export default function DeviceDetailModal({
  device,
  visible,
  onClose,
  onQuarantineToggle,
  onEnforceEncryption,
  onThrottleToggle,
}: DeviceDetailModalProps) {
  if (!device) return null;

  const isQuarantined = device.is_quarantined;
  const isEncrypted = device.encryption_enforced;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,8,16,0.85)' }]} />
        )}
        <Pressable style={styles.dismissArea} onPress={onClose} />

        <View style={styles.sheet}>
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            style={styles.sheetInner}
          >
            {/* Grabber */}
            <View style={styles.grabber} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name={
                    device.device_type === 'camera'
                      ? 'videocam'
                      : device.device_type === 'lock'
                      ? 'lock-closed'
                      : device.device_type === 'light'
                      ? 'bulb'
                      : device.device_type === 'speaker'
                      ? 'volume-high'
                      : device.device_type === 'thermostat'
                      ? 'thermometer'
                      : 'hardware-chip'
                  }
                  size={26}
                  color={isQuarantined ? Colors.danger : Colors.primaryLight}
                />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>{device.device_name}</Text>
                <Text style={styles.ipText}>{device.ip_address} • {device.mac_address}</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close-circle" size={26} color={Colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
              {/* Status Chips */}
              <View style={styles.chipsRow}>
                <View style={[styles.chip, { backgroundColor: isQuarantined ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.15)' }]}>
                  <Text style={[styles.chipText, { color: isQuarantined ? Colors.danger : Colors.success }]}>
                    {isQuarantined ? '🛡️ Quarantined' : '✅ Active Hub'}
                  </Text>
                </View>
                <View style={[styles.chip, { backgroundColor: isEncrypted ? 'rgba(34,211,238,0.15)' : 'rgba(245,158,11,0.2)' }]}>
                  <Text style={[styles.chipText, { color: isEncrypted ? Colors.accent : Colors.warning }]}>
                    {isEncrypted ? '🔒 TLS Encrypted' : '⚠️ Cleartext Protocols'}
                  </Text>
                </View>
                <View style={[styles.chip, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                  <Text style={[styles.chipText, { color: Colors.primaryLight }]}>
                    Risk: {device.risk_score}/100
                  </Text>
                </View>
              </View>

              {/* Network Ports & Protocols */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Port & Protocol Audit</Text>
                <View style={styles.portsGrid}>
                  {device.open_ports.map((port) => {
                    const isInsecure = port === 23 || port === 80 || port === 554 || port === 1883;
                    return (
                      <View
                        key={port}
                        style={[
                          styles.portBadge,
                          { borderColor: isInsecure ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)' },
                        ]}
                      >
                        <Text style={[styles.portNum, { color: isInsecure ? Colors.danger : Colors.success }]}>
                          Port {port}
                        </Text>
                        <Text style={styles.portLabel}>
                          {port === 23 ? 'Telnet' : port === 80 ? 'HTTP' : port === 554 ? 'RTSP' : port === 1883 ? 'MQTT' : port === 8883 ? 'MQTTS' : 'HTTPS'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Bandwidth & Telemetry */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Outbound Bandwidth & Telemetry</Text>
                <View style={styles.telemetryCard}>
                  <View style={styles.telemetryItem}>
                    <Text style={styles.telemetryVal}>{device.egress_mbps || 0.4} MB/s</Text>
                    <Text style={styles.telemetryLbl}>Egress Bandwidth</Text>
                  </View>
                  <View style={styles.telemetryDivider} />
                  <View style={styles.telemetryItem}>
                    <Text style={styles.telemetryVal}>{device.packets_per_sec || 25} pps</Text>
                    <Text style={styles.telemetryLbl}>Packet Velocity</Text>
                  </View>
                </View>
              </View>

              {/* Zero-Trust Action Buttons */}
              <View style={styles.actionGroup}>
                <Pressable
                  style={[styles.actionBtn, { backgroundColor: isQuarantined ? Colors.success : Colors.danger }]}
                  onPress={() => onQuarantineToggle(device.id, isQuarantined)}
                >
                  <Ionicons name={isQuarantined ? 'shield-checkmark' : 'ban'} size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.actionBtnText}>
                    {isQuarantined ? 'Release from Quarantine' : 'One-Tap Quarantine Device'}
                  </Text>
                </Pressable>

                {!isEncrypted && (
                  <Pressable
                    style={[styles.actionBtn, styles.encryptBtn]}
                    onPress={() => onEnforceEncryption(device.id)}
                  >
                    <Ionicons name="lock-closed" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.actionBtnText}>Enforce TLS / MQTTS Encryption</Text>
                  </Pressable>
                )}

                {onThrottleToggle && (
                  <Pressable
                    style={[styles.actionBtn, styles.throttleBtn]}
                    onPress={() => onThrottleToggle(device.id)}
                  >
                    <Ionicons name="speedometer" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.actionBtnText}>
                      {device.telemetry_throttled ? 'Restore Full Bandwidth' : 'Throttle Background Telemetry'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    maxHeight: '82%',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  sheetInner: {
    padding: 20,
    paddingBottom: 36,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  ipText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingBottom: 24,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  portsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  portBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    alignItems: 'center',
  },
  portNum: {
    fontSize: 13,
    fontWeight: '800',
  },
  portLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  telemetryCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
  },
  telemetryVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  telemetryLbl: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  telemetryDivider: {
    width: 1,
    backgroundColor: Colors.glassBorder,
  },
  actionGroup: {
    gap: 10,
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
  },
  encryptBtn: {
    backgroundColor: Colors.primary,
  },
  throttleBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
