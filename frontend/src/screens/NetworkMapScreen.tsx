import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from '../components/GlassCard';
import InteractiveTopologyMap from '../components/InteractiveTopologyMap';
import DeviceDetailModal from '../components/DeviceDetailModal';
import { Colors, BorderRadius } from '../constants/theme';
import {
  fetchTelemetry,
  executeAction,
  toggleD2DRule,
  SmartDevice,
  TelemetryState,
} from '../services/api';

export default function NetworkMapScreen() {
  const insets = useSafeAreaInsets();
  const [telemetry, setTelemetry] = useState<TelemetryState | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<SmartDevice | null>(null);
  const [activeTab, setActiveTab] = useState<'MAP' | 'MATRIX' | 'EXFILTRATION'>('MAP');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const t = await fetchTelemetry();
    setTelemetry(t);
  };

  const handleQuarantineToggle = async (deviceId: string, isQuarantined: boolean) => {
    const newTelemetry = await executeAction({
      type: isQuarantined ? 'UNQUARANTINE_DEVICE' : 'QUARANTINE_DEVICE',
      deviceId,
    });
    setTelemetry(newTelemetry);
    if (selectedDevice && selectedDevice.id === deviceId) {
      const updated = newTelemetry.devices.find((d) => d.id === deviceId);
      if (updated) setSelectedDevice(updated);
    }
  };

  const handleEnforceEncryption = async (deviceId: string) => {
    const newTelemetry = await executeAction({
      type: 'ENFORCE_ENCRYPTION',
      deviceId,
    });
    setTelemetry(newTelemetry);
    if (selectedDevice && selectedDevice.id === deviceId) {
      const updated = newTelemetry.devices.find((d) => d.id === deviceId);
      if (updated) setSelectedDevice(updated);
    }
  };

  const handleRuleToggle = async (source: string, target: string, currentAllowed: boolean) => {
    const updatedRules = await toggleD2DRule(source, target, !currentAllowed);
    if (telemetry) {
      setTelemetry({ ...telemetry, d2dRules: updatedRules });
    }
  };

  const devices = telemetry?.devices || [];
  const rules = telemetry?.d2dRules || [];
  const d2dEnabled = telemetry?.policy.d2d_isolation_enabled ?? true;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0A0E17', '#0F172A', '#0A0E17']} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>Micro-Segmented Hub</Text>
        <Text style={styles.subtitle}>Interactive Zero-Trust Network Topology & D2D Matrix</Text>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'MAP' && styles.tabBtnActive]}
            onPress={() => setActiveTab('MAP')}
          >
            <Ionicons name="git-network" size={14} color={activeTab === 'MAP' ? '#fff' : Colors.textMuted} style={{ marginRight: 6 }} />
            <Text style={[styles.tabBtnText, activeTab === 'MAP' && styles.tabBtnTextActive]}>Interactive Map</Text>
          </Pressable>

          <Pressable
            style={[styles.tabBtn, activeTab === 'MATRIX' && styles.tabBtnActive]}
            onPress={() => setActiveTab('MATRIX')}
          >
            <Ionicons name="shield-checkmark" size={14} color={activeTab === 'MATRIX' ? '#fff' : Colors.textMuted} style={{ marginRight: 6 }} />
            <Text style={[styles.tabBtnText, activeTab === 'MATRIX' && styles.tabBtnTextActive]}>D2D Isolation</Text>
          </Pressable>

          <Pressable
            style={[styles.tabBtn, activeTab === 'EXFILTRATION' && styles.tabBtnActive]}
            onPress={() => setActiveTab('EXFILTRATION')}
          >
            <Ionicons name="speedometer" size={14} color={activeTab === 'EXFILTRATION' ? '#fff' : Colors.textMuted} style={{ marginRight: 6 }} />
            <Text style={[styles.tabBtnText, activeTab === 'EXFILTRATION' && styles.tabBtnTextActive]}>Telemetry</Text>
          </Pressable>
        </View>

        {/* 1. Interactive Topology Map View */}
        {activeTab === 'MAP' && (
          <View>
            <GlassCard style={styles.mapCard}>
              <View style={styles.mapHeader}>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>3D Topology Active</Text>
                </View>
                <Text style={styles.mapHelp}>Tap any node to audit & quarantine</Text>
              </View>

              <InteractiveTopologyMap
                devices={devices}
                d2dRules={rules}
                onSelectDevice={(dev) => setSelectedDevice(dev)}
              />
            </GlassCard>

            {/* Quick Device List */}
            <Text style={styles.sectionHeading}>Monitored Node Roster</Text>
            {devices.map((d) => (
              <Pressable
                key={d.id}
                style={styles.deviceRow}
                onPress={() => setSelectedDevice(d)}
              >
                <View style={[styles.rowIcon, { backgroundColor: d.is_quarantined ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.15)' }]}>
                  <Ionicons
                    name={
                      d.device_type === 'camera'
                        ? 'videocam'
                        : d.device_type === 'lock'
                        ? 'lock-closed'
                        : d.device_type === 'light'
                        ? 'bulb'
                        : d.device_type === 'speaker'
                        ? 'volume-high'
                        : 'hardware-chip'
                    }
                    size={20}
                    color={d.is_quarantined ? Colors.danger : Colors.primaryLight}
                  />
                </View>

                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{d.device_name}</Text>
                  <Text style={styles.rowIp}>{d.ip_address} • Ports: [{d.open_ports.join(', ')}]</Text>
                </View>

                <View style={styles.rowStatus}>
                  <Text
                    style={[
                      styles.rowStatusText,
                      { color: d.is_quarantined ? Colors.danger : d.risk_score > 50 ? Colors.warning : Colors.success },
                    ]}
                  >
                    {d.is_quarantined ? 'QUARANTINED' : d.risk_score > 50 ? 'AT RISK' : 'SECURE'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginTop: 2 }} />
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* 2. Zero-Trust D2D Isolation Matrix View */}
        {activeTab === 'MATRIX' && (
          <View>
            <GlassCard style={styles.matrixCard}>
              <View style={styles.policyRow}>
                <View>
                  <Text style={styles.matrixTitle}>Zero-Trust Traffic Isolation</Text>
                  <Text style={styles.matrixSub}>
                    Enforces strict firewall policies preventing compromised IoT devices from pivoting laterally.
                  </Text>
                </View>
                <Switch
                  value={d2dEnabled}
                  onValueChange={(val) =>
                    executeAction({ type: 'SET_D2D_ISOLATION', enabled: val }).then(loadData)
                  }
                  trackColor={{ false: '#334155', true: Colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </GlassCard>

            <Text style={styles.sectionHeading}>Device-to-Device Rules</Text>
            {rules.map((r) => {
              const srcDev = devices.find((d) => d.id === r.source);
              const tgtDev = devices.find((d) => d.id === r.target);

              return (
                <GlassCard key={r.id} style={styles.ruleCard}>
                  <View style={styles.ruleLeft}>
                    <View style={styles.routePill}>
                      <Text style={styles.srcText}>{srcDev?.device_name || r.source}</Text>
                      <Ionicons
                        name={r.allowed ? 'arrow-forward' : 'close-circle'}
                        size={14}
                        color={r.allowed ? Colors.success : Colors.danger}
                        style={{ marginHorizontal: 6 }}
                      />
                      <Text style={styles.tgtText}>{tgtDev?.device_name || r.target}</Text>
                    </View>
                    <Text style={styles.ruleReason}>{r.reason}</Text>
                  </View>

                  <View style={styles.ruleRight}>
                    <Pressable
                      style={[
                        styles.togglePill,
                        { backgroundColor: r.allowed ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)' },
                      ]}
                      onPress={() => handleRuleToggle(r.source, r.target, r.allowed)}
                    >
                      <Text
                        style={[
                          styles.toggleText,
                          { color: r.allowed ? Colors.success : Colors.danger },
                        ]}
                      >
                        {r.allowed ? 'ALLOWED' : 'BLOCKED'}
                      </Text>
                    </Pressable>
                  </View>
                </GlassCard>
              );
            })}
          </View>
        )}

        {/* 3. Outbound Telemetry & Data Exfiltration Monitor */}
        {activeTab === 'EXFILTRATION' && (
          <View>
            <GlassCard style={styles.matrixCard}>
              <View style={styles.exfilHeader}>
                <Ionicons name="cloud-upload" size={24} color={Colors.accent} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.matrixTitle}>Outbound Telemetry & Exfiltration</Text>
                  <Text style={styles.matrixSub}>
                    Flags abnormal off-hours spikes (e.g. cameras transmitting at 3 AM). Gateway strips PII, MAC, and GPS tags.
                  </Text>
                </View>
              </View>
            </GlassCard>

            <Text style={styles.sectionHeading}>Live Egress Bandwidth Streams</Text>
            {devices.map((d) => {
              const isSpike = d.id === 'cam_01';
              return (
                <GlassCard key={d.id} style={styles.telemetryCard}>
                  <View style={styles.telemetryHeader}>
                    <View>
                      <Text style={styles.telDevName}>{d.device_name}</Text>
                      <Text style={styles.telEndpoint}>
                        Cloud Relay: {d.device_type === 'camera' ? 's3.us-west.amazonaws.com' : 'iot.vendor-cloud.net'}
                      </Text>
                    </View>
                    {isSpike && (
                      <View style={styles.spikeBadge}>
                        <Ionicons name="warning" size={12} color={Colors.warning} />
                        <Text style={styles.spikeText}>3 AM Spike (850MB)</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.bandwidthMeterRow}>
                    <View style={styles.bandwidthBarTrack}>
                      <View
                        style={[
                          styles.bandwidthBarFill,
                          {
                            width: `${Math.min(100, ((d.egress_mbps || 0.5) / 15) * 100)}%`,
                            backgroundColor: isSpike ? Colors.warning : Colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.bandwidthVal}>{d.egress_mbps || 0.4} MB/s</Text>
                  </View>

                  <View style={styles.telFooter}>
                    <Text style={styles.packetRate}>{d.packets_per_sec || 20} pkts/sec</Text>
                    <Pressable
                      style={[
                        styles.throttlePill,
                        d.telemetry_throttled && { backgroundColor: 'rgba(245,158,11,0.2)' },
                      ]}
                      onPress={() =>
                        executeAction({ type: 'THROTTLE_TELEMETRY', deviceId: d.id }).then(loadData)
                      }
                    >
                      <Text
                        style={[
                          styles.throttleText,
                          d.telemetry_throttled && { color: Colors.warning },
                        ]}
                      >
                        {d.telemetry_throttled ? 'Throttled (0.05 MB/s)' : 'Throttle Telemetry'}
                      </Text>
                    </Pressable>
                  </View>
                </GlassCard>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Device Detail Modal */}
      <DeviceDetailModal
        device={selectedDevice}
        visible={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
        onQuarantineToggle={handleQuarantineToggle}
        onEnforceEncryption={handleEnforceEncryption}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
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
    marginBottom: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tabBtnTextActive: {
    color: '#fff',
  },
  mapCard: {
    padding: 12,
    marginBottom: 20,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  mapHelp: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  rowIp: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  rowStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowStatusText: {
    fontSize: 11,
    fontWeight: '800',
    marginRight: 4,
  },
  matrixCard: {
    padding: 16,
    marginBottom: 16,
  },
  policyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matrixTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  matrixSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    maxWidth: 260,
    lineHeight: 17,
  },
  ruleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
  },
  ruleLeft: {
    flex: 1,
  },
  routePill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  srcText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  tgtText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  ruleReason: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  ruleRight: {
    marginLeft: 12,
  },
  togglePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  exfilHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  telemetryCard: {
    padding: 14,
    marginBottom: 10,
  },
  telemetryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  telDevName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  telEndpoint: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  spikeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  spikeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.warning,
    marginLeft: 4,
  },
  bandwidthMeterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bandwidthBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  bandwidthBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  bandwidthVal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    width: 60,
    textAlign: 'right',
  },
  telFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packetRate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  throttlePill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  throttleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
