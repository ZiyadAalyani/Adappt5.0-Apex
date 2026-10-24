import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import CyberBot from '../components/CyberBot';
import GlassCard from '../components/GlassCard';
import ProtectionRing from '../components/ProtectionRing';
import ThreatWaveChart from '../components/ThreatWaveChart';
import ActivityBars from '../components/ActivityBars';
import RiskMeter from '../components/RiskMeter';
import DeviceCard from '../components/DeviceCard';
import DeviceDetailModal from '../components/DeviceDetailModal';
import BiometricModal from '../components/BiometricModal';
import PushAlertBanner from '../components/PushAlertBanner';
import { Colors, BorderRadius } from '../constants/theme';
import {
  fetchTelemetry,
  executeAction,
  simulateAttack,
  SmartDevice,
  TelemetryState,
} from '../services/api';

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [telemetry, setTelemetry] = useState<TelemetryState | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<SmartDevice | null>(null);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [pendingHighRiskAction, setPendingHighRiskAction] = useState<any>(null);
  const [pushAlert, setPushAlert] = useState<any>(null);
  const [showAlertsModal, setShowAlertsModal] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const data = await fetchTelemetry();
    setTelemetry(data);
  };

  const handleDevicePress = (device: SmartDevice) => {
    if (device.device_type === 'lock') {
      // High-risk command requires Biometric Step-Up Authorization
      setPendingHighRiskAction({ type: 'LOCK_COMMAND', device });
      setShowBiometricModal(true);
    } else {
      setSelectedDevice(device);
    }
  };

  const handleBiometricSuccess = () => {
    setShowBiometricModal(false);
    if (pendingHighRiskAction?.device) {
      setSelectedDevice(pendingHighRiskAction.device);
    }
    setPendingHighRiskAction(null);
  };

  const handleQuarantine = async (deviceId: string, isQuarantined: boolean) => {
    const updated = await executeAction({
      type: isQuarantined ? 'UNQUARANTINE_DEVICE' : 'QUARANTINE_DEVICE',
      deviceId,
    });
    setTelemetry(updated);
    if (selectedDevice && selectedDevice.id === deviceId) {
      const dev = updated.devices.find((d) => d.id === deviceId);
      if (dev) setSelectedDevice(dev);
    }
  };

  const handleEnforceEncryption = async (deviceId: string) => {
    const updated = await executeAction({ type: 'ENFORCE_ENCRYPTION', deviceId });
    setTelemetry(updated);
    if (selectedDevice && selectedDevice.id === deviceId) {
      const dev = updated.devices.find((d) => d.id === deviceId);
      if (dev) setSelectedDevice(dev);
    }
  };

  const handleSimulateAttack = async () => {
    const res = await simulateAttack();
    if (res.pushNotification) {
      setPushAlert(res.pushNotification);
    }
    loadData();
  };

  const handleAutoRemediate = async () => {
    const updated = await executeAction({ type: 'AUTO_REMEDIATE_ALL' });
    setTelemetry(updated);
  };

  const devices = telemetry?.devices || [];
  const healthScore = telemetry?.policy.overall_health_score || 78;
  const activeAlerts = telemetry?.alerts || [];
  const privacyMode = telemetry?.policy.current_privacy_mode || 'NORMAL';

  const criticalCount = devices.filter((d) => d.risk_score >= 80).length;
  const highCount = devices.filter((d) => d.risk_score >= 50 && d.risk_score < 80).length;
  const medCount = devices.filter((d) => d.risk_score >= 20 && d.risk_score < 50).length;
  const safeCount = devices.filter((d) => d.risk_score < 20).length;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0A0E17', '#0F172A', '#0A0E17']} style={StyleSheet.absoluteFill} />

      {/* Ambient glow orbs */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />

      {/* Push Intrusion Banner */}
      <PushAlertBanner
        visible={!!pushAlert}
        title={pushAlert?.title || ''}
        message={pushAlert?.body || ''}
        severity="CRITICAL"
        onDismiss={() => setPushAlert(null)}
        onInspect={() => {
          setPushAlert(null);
          navigation?.navigate('Sentinel');
        }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Zero-Trust Smart Home</Text>
            <Text style={styles.userName}>SecureNest</Text>
          </View>
          <Pressable style={styles.notifBtn} onPress={() => setShowAlertsModal(true)}>
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
            {activeAlerts.length > 0 && <View style={styles.notifDot} />}
          </Pressable>
        </View>

        {/* Cute SecureBot Hero - CLICKABLE TO REDIRECT TO AEGISBOT AI */}
        <Pressable
          style={styles.heroPressable}
          onPress={() => navigation?.navigate('AegisBot')}
        >
          <LinearGradient
            colors={['rgba(99,102,241,0.25)', 'rgba(15,23,42,0.65)']}
            style={styles.heroBox}
          >
            <View style={styles.botContainer}>
              <CyberBot size={72} mood={criticalCount > 0 ? 'alert' : 'happy'} />
              <View style={styles.speechBubble}>
                <Ionicons name="sparkles" size={12} color="#A5B4FC" style={{ marginRight: 4 }} />
                <Text style={styles.speechBubbleText}>Hi! Tap me to chat</Text>
              </View>
            </View>

            <View style={styles.heroText}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>SecureBot Online</Text>
              </View>
              <Text style={styles.heroTitle}>Smart Home{'\n'}Protected</Text>
              <Text style={styles.heroSub}>
                {devices.length} devices monitored • {activeAlerts.length} threats flagged
              </Text>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Quick Action Command Strip */}
        <View style={styles.actionStrip}>
          <Pressable style={styles.actionPill} onPress={handleAutoRemediate}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
            <Text style={styles.actionPillText}>Auto-Remediate</Text>
          </Pressable>

          <Pressable
            style={styles.actionPill}
            onPress={() =>
              executeAction({
                type: 'QUARANTINE_DEVICE',
                deviceId: 'rogue_01',
              }).then(loadData)
            }
          >
            <Ionicons name="ban" size={16} color={Colors.danger} />
            <Text style={styles.actionPillText}>Quarantine Rogue</Text>
          </Pressable>

          <Pressable
            style={styles.actionPill}
            onPress={() =>
              executeAction({
                type: 'SET_PRIVACY_MODE',
                mode: privacyMode === 'SLEEP' ? 'NORMAL' : 'SLEEP',
              }).then(loadData)
            }
          >
            <Ionicons name="moon" size={16} color={Colors.accent} />
            <Text style={styles.actionPillText}>
              {privacyMode === 'SLEEP' ? 'Sleep: ON' : 'Sleep Mode'}
            </Text>
          </Pressable>

          <Pressable style={styles.actionPill} onPress={handleSimulateAttack}>
            <Ionicons name="flash" size={16} color={Colors.warning} />
            <Text style={styles.actionPillText}>Test Auto-Lock</Text>
          </Pressable>
        </View>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <Pressable style={styles.statPressable} onPress={() => navigation?.navigate('Admin')}>
            <GlassCard style={styles.statCard} glowColor={Colors.success}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
              <Text style={styles.statValue}>{safeCount}</Text>
              <Text style={styles.statLabel}>Protected</Text>
            </GlassCard>
          </Pressable>

          <Pressable style={styles.statPressable} onPress={() => navigation?.navigate('Admin')}>
            <GlassCard style={styles.statCard} glowColor={Colors.primary}>
              <Ionicons name="scan" size={20} color={Colors.primary} />
              <Text style={styles.statValue}>{devices.length}</Text>
              <Text style={styles.statLabel}>Audited</Text>
            </GlassCard>
          </Pressable>

          <Pressable style={styles.statPressable} onPress={() => setShowAlertsModal(true)}>
            <GlassCard style={styles.statCard} glowColor={Colors.warning}>
              <Ionicons name="alert" size={20} color={Colors.warning} />
              <Text style={styles.statValue}>{activeAlerts.length}</Text>
              <Text style={styles.statLabel}>Alerts</Text>
            </GlassCard>
          </Pressable>
        </View>

        {/* 3D Protection Ring + Risk */}
        <GlassCard style={styles.sectionCard} intensity={50}>
          <View style={styles.ringRow}>
            <ProtectionRing
              progress={healthScore}
              size={135}
              label={healthScore >= 80 ? 'Optimal' : 'Hardening Req.'}
              subLabel="Security Score"
            />
            <View style={styles.ringInfo}>
              <Text style={styles.sectionTitle}>Zero-Trust Health</Text>
              <Text style={styles.sectionDesc}>
                {healthScore >= 90
                  ? 'All devices enforced with MQTTS/TLS encryption.'
                  : 'Vulnerabilities discovered: Port 23 Telnet & 554 RTSP active.'}
              </Text>
              <View style={styles.scoreTags}>
                <View style={[styles.tag, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                  <Text style={[styles.tagText, { color: Colors.success }]}>D2D Isolation ✓</Text>
                </View>
                <View style={[styles.tag, { backgroundColor: 'rgba(34,211,238,0.15)' }]}>
                  <Text style={[styles.tagText, { color: Colors.accent }]}>Metadata Strip ✓</Text>
                </View>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Threat Wave Chart */}
        <GlassCard style={styles.sectionCard}>
          <ThreatWaveChart height={140} />
        </GlassCard>

        {/* Threat Level Distribution */}
        <GlassCard style={styles.sectionCard}>
          <RiskMeter
            critical={criticalCount}
            high={highCount}
            medium={medCount}
            low={safeCount}
          />
        </GlassCard>

        {/* Live Device Activity Bars */}
        <GlassCard style={styles.sectionCard}>
          <ActivityBars />
        </GlassCard>

        {/* Connected devices header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>Connected Devices</Text>
          <Pressable onPress={() => navigation?.navigate('Admin')}>
            <Text style={styles.seeAll}>Admin Hub →</Text>
          </Pressable>
        </View>

        {/* Connected Device Cards */}
        {devices.map((d) => (
          <DeviceCard
            key={d.id}
            name={d.device_name}
            type={d.device_type}
            status={d.is_quarantined ? 'critical' : d.risk_score > 50 ? 'warning' : 'safe'}
            lastSeen={d.is_quarantined ? 'QUARANTINED' : `${d.ip_address}`}
            onPress={() => handleDevicePress(d)}
          />
        ))}
      </ScrollView>

      {/* Device Detail Inspection Modal */}
      <DeviceDetailModal
        device={selectedDevice}
        visible={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
        onQuarantineToggle={handleQuarantine}
        onEnforceEncryption={handleEnforceEncryption}
      />

      {/* Biometric Step-Up Authorization Modal */}
      <BiometricModal
        visible={showBiometricModal}
        title="Biometric Step-Up Authorization"
        subtitle={`Command requires on-device biometric prompt before sending control signals to ${pendingHighRiskAction?.device?.device_name || 'Smart Lock'}.`}
        actionLabel="Authenticate Fingerprint"
        onSuccess={handleBiometricSuccess}
        onCancel={() => setShowBiometricModal(false)}
      />

      {/* Active Alerts Modal */}
      <Modal visible={showAlertsModal} transparent animationType="slide">
        <View style={styles.alertsOverlay}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,8,16,0.85)' }]} />
          <View style={styles.alertsSheet}>
            <View style={styles.alertsHeader}>
              <Text style={styles.alertsTitle}>Security Alerts ({activeAlerts.length})</Text>
              <Pressable onPress={() => setShowAlertsModal(false)}>
                <Ionicons name="close-circle" size={26} color={Colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              {activeAlerts.length === 0 ? (
                <Text style={styles.noAlertsText}>No active alerts. All devices secure.</Text>
              ) : (
                activeAlerts.map((a) => (
                  <View key={a.id} style={styles.alertCard}>
                    <View style={styles.alertTop}>
                      <Text style={[styles.alertSeverity, { color: a.severity === 'CRITICAL' ? Colors.danger : Colors.warning }]}>
                        {a.severity}
                      </Text>
                      <Pressable
                        onPress={() =>
                          executeAction({ type: 'RESOLVE_ALERT', alertId: a.id }).then(loadData)
                        }
                      >
                        <Text style={styles.resolveBtn}>Dismiss</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.alertItemTitle}>{a.title}</Text>
                    <Text style={styles.alertDesc}>{a.description}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <Pressable
              style={styles.remediateAllBtn}
              onPress={() => {
                handleAutoRemediate();
                setShowAlertsModal(false);
              }}
            >
              <Text style={styles.remediateAllText}>Resolve All Threats</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.25,
  },
  orb1: {
    width: 220,
    height: 220,
    backgroundColor: Colors.primary,
    top: -60,
    right: -40,
  },
  orb2: {
    width: 180,
    height: 180,
    backgroundColor: Colors.accent,
    bottom: 200,
    left: -60,
  },
  scroll: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  heroPressable: {
    marginBottom: 16,
  },
  heroBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  botContainer: {
    alignItems: 'center',
  },
  speechBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(34,211,238,0.4)',
    marginTop: 6,
  },
  speechBubbleText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.accent,
  },
  heroText: {
    flex: 1,
    marginLeft: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    marginBottom: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 28,
  },
  heroSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  actionStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  actionPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statPressable: {
    flex: 1,
  },
  statCard: {
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionCard: {
    padding: 16,
    marginBottom: 16,
  },
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringInfo: {
    flex: 1,
    marginLeft: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  sectionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  scoreTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryLight,
  },
  alertsOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  alertsSheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  alertCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  alertTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  alertSeverity: {
    fontSize: 11,
    fontWeight: '800',
  },
  resolveBtn: {
    fontSize: 11,
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  alertItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  alertDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  noAlertsText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginVertical: 20,
  },
  remediateAllBtn: {
    backgroundColor: Colors.success,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: 12,
  },
  remediateAllText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
});
