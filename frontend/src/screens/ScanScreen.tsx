import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from '../components/GlassCard';
import DeviceDetailModal from '../components/DeviceDetailModal';
import { Colors, BorderRadius } from '../constants/theme';
import {
  triggerSubnetScan,
  executeAction,
  fetchTelemetry,
  SmartDevice,
} from '../services/api';

const { width } = Dimensions.get('window');

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanResult, setScanResult] = useState<any>(null);
  const [selectedDevice, setSelectedDevice] = useState<SmartDevice | null>(null);

  const scanRotation = useSharedValue(0);

  useEffect(() => {
    loadScanPreview();
  }, []);

  const loadScanPreview = async () => {
    const res = await triggerSubnetScan();
    setScanResult(res);
  };

  const startDeepScan = () => {
    setScanning(true);
    setProgress(0);

    scanRotation.value = withRepeat(
      withTiming(360, { duration: 1600, easing: Easing.linear }),
      -1,
      false
    );

    let p = 0;
    const interval = setInterval(async () => {
      p += 5;
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(interval);
        setScanning(false);
        const res = await triggerSubnetScan();
        setScanResult(res);
      }
    }, 90);
  };

  const handleAutoRemediate = async () => {
    await executeAction({ type: 'AUTO_REMEDIATE_ALL' });
    const res = await triggerSubnetScan();
    setScanResult(res);
  };

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${scanRotation.value}deg` }],
  }));

  const devicesList = scanResult?.devices || [];
  const vulnerableList = devicesList.filter((d: any) => d.vulnerabilities?.length > 0);
  const rogueList = devicesList.filter((d: any) => d.isRogue);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0A0E17', '#0F172A', '#0A0E17']} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Subnet & Port Auditor</Text>
        <Text style={styles.subtitle}>Deep Wi-Fi IoT scan, cleartext port detection & rogue hunter</Text>

        {/* 3D Radar Visualizer */}
        <View style={styles.radarWrapper}>
          <View style={styles.radarRingOuter} />
          <View style={styles.radarRingMid} />
          <View style={styles.radarRingInner} />

          {/* Crosshairs */}
          <View style={styles.crosshairV} />
          <View style={styles.crosshairH} />

          {/* Sweeping radar beam */}
          {scanning && (
            <Animated.View style={[styles.sweepBeamWrap, ringStyle]}>
              <LinearGradient
                colors={['rgba(34,211,238,0.7)', 'rgba(59,130,246,0.1)', 'transparent']}
                start={{ x: 1, y: 0.5 }}
                end={{ x: 0, y: 0.5 }}
                style={styles.sweepBeam}
              />
            </Animated.View>
          )}

          {/* Blips */}
          <View style={[styles.blip, styles.blip1, { backgroundColor: Colors.danger }]} />
          <View style={[styles.blip, styles.blip2, { backgroundColor: Colors.warning }]} />
          <View style={[styles.blip, styles.blip3, { backgroundColor: Colors.success }]} />

          <View style={styles.radarCenter}>
            <Text style={styles.radarPercent}>{scanning ? `${progress}%` : 'AUDIT'}</Text>
            <Text style={styles.radarSub}>{scanning ? 'SCANNING' : 'READY'}</Text>
          </View>
        </View>

        {/* Scan Trigger Button */}
        <Pressable
          style={[styles.scanBtn, scanning && styles.scanBtnActive]}
          onPress={startDeepScan}
          disabled={scanning}
        >
          <LinearGradient
            colors={scanning ? ['#0F766E', '#115E59'] : [Colors.primary, Colors.primaryDark]}
            style={styles.scanBtnGradient}
          >
            <Ionicons name={scanning ? 'sync' : 'scan'} size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.scanBtnText}>
              {scanning ? `Auditing Subnet (${progress}%)` : 'Run Subnet & Port Audit'}
            </Text>
          </LinearGradient>
        </Pressable>

        {/* Audit Summary Badges */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard} glowColor={Colors.primary}>
            <Text style={styles.statNum}>{devicesList.length || 7}</Text>
            <Text style={styles.statLabel}>Devices Scanned</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} glowColor={Colors.danger}>
            <Text style={[styles.statNum, { color: Colors.danger }]}>{vulnerableList.length}</Text>
            <Text style={styles.statLabel}>Insecure Ports</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} glowColor={Colors.warning}>
            <Text style={[styles.statNum, { color: Colors.warning }]}>{rogueList.length}</Text>
            <Text style={styles.statLabel}>Rogue Devices</Text>
          </GlassCard>
        </View>

        {/* Remediation Banner */}
        {vulnerableList.length > 0 && (
          <GlassCard style={styles.remediateCard} glowColor={Colors.success}>
            <View style={styles.remediateLeft}>
              <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.remediateTitle}>Automated Protocol Hardening</Text>
                <Text style={styles.remediateSub}>
                  Upgrade cleartext Telnet/HTTP/MQTT to TLS/MQTTS and isolate rogue ESP32 with one click.
                </Text>
              </View>
            </View>
            <Pressable style={styles.remediateBtn} onPress={handleAutoRemediate}>
              <Text style={styles.remediateBtnText}>One-Touch Fix All</Text>
            </Pressable>
          </GlassCard>
        )}

        {/* Protocol Vulnerability Roster */}
        <Text style={styles.sectionHeading}>Discovered Open Ports & Protocols</Text>
        {devicesList.map((dev: any) => (
          <GlassCard key={dev.id} style={styles.deviceAuditCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.devName}>{dev.name}</Text>
                <Text style={styles.devIp}>{dev.ip} • MAC: {dev.mac}</Text>
              </View>
              <View
                style={[
                  styles.riskPill,
                  { backgroundColor: dev.riskScore > 50 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)' },
                ]}
              >
                <Text
                  style={[
                    styles.riskPillText,
                    { color: dev.riskScore > 50 ? Colors.danger : Colors.success },
                  ]}
                >
                  Risk: {dev.riskScore}/100
                </Text>
              </View>
            </View>

            {/* Ports Badges */}
            <View style={styles.portsRow}>
              {dev.openPorts?.map((port: number) => {
                const isInsecure = port === 23 || port === 80 || port === 554 || port === 1883;
                return (
                  <View
                    key={port}
                    style={[
                      styles.portChip,
                      {
                        borderColor: isInsecure ? 'rgba(239,68,68,0.5)' : 'rgba(16,185,129,0.5)',
                        backgroundColor: isInsecure ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                      },
                    ]}
                  >
                    <Ionicons
                      name={isInsecure ? 'warning' : 'lock-closed'}
                      size={12}
                      color={isInsecure ? Colors.danger : Colors.success}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.portChipText,
                        { color: isInsecure ? Colors.danger : Colors.success },
                      ]}
                    >
                      Port {port} ({port === 23 ? 'Telnet' : port === 80 ? 'HTTP' : port === 554 ? 'RTSP' : port === 1883 ? 'MQTT' : 'TLS'})
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Detailed Vulnerability Notes */}
            {dev.vulnerabilities?.map((vuln: string, idx: number) => (
              <View key={idx} style={styles.vulnNotice}>
                <Ionicons name="alert-circle" size={14} color={Colors.warning} />
                <Text style={styles.vulnNoticeText}>{vuln}</Text>
              </View>
            ))}
          </GlassCard>
        ))}
      </ScrollView>

      {/* Device Detail Modal */}
      <DeviceDetailModal
        device={selectedDevice}
        visible={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
        onQuarantineToggle={async (id, q) => {
          await executeAction({ type: q ? 'UNQUARANTINE_DEVICE' : 'QUARANTINE_DEVICE', deviceId: id });
          loadScanPreview();
        }}
        onEnforceEncryption={async (id) => {
          await executeAction({ type: 'ENFORCE_ENCRYPTION', deviceId: id });
          loadScanPreview();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  radarWrapper: {
    width: width - 32,
    height: 220,
    alignSelf: 'center',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.25)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  radarRingOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.18)',
  },
  radarRingMid: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.25)',
  },
  radarRingInner: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.35)',
  },
  crosshairV: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(34,211,238,0.12)',
  },
  crosshairH: {
    position: 'absolute',
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(34,211,238,0.12)',
  },
  sweepBeamWrap: {
    position: 'absolute',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sweepBeam: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    borderTopRightRadius: 100,
  },
  blip: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  blip1: { top: 50, right: 80 },
  blip2: { bottom: 40, left: 70 },
  blip3: { top: 80, left: 110 },
  radarCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarPercent: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  radarSub: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accent,
    marginTop: 2,
  },
  scanBtn: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: 16,
  },
  scanBtnActive: {
    opacity: 0.9,
  },
  scanBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  scanBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  remediateCard: {
    padding: 14,
    marginBottom: 20,
  },
  remediateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  remediateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  remediateSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  remediateBtn: {
    backgroundColor: Colors.success,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  remediateBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deviceAuditCard: {
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  devName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  devIp: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  riskPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  riskPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  portsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  portChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  portChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  vulnNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  vulnNoticeText: {
    fontSize: 11,
    color: Colors.warning,
    marginLeft: 6,
  },
});
