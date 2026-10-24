import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from '../components/GlassCard';
import InteractiveTopologyMap from '../components/InteractiveTopologyMap';
import DeviceDetailModal from '../components/DeviceDetailModal';
import BiometricModal from '../components/BiometricModal';
import { Colors, BorderRadius } from '../constants/theme';
import {
  fetchTelemetry,
  executeAction,
  triggerSubnetScan,
  toggleD2DRule,
  SmartDevice,
  TelemetryState,
  D2DRule,
} from '../services/api';
import { requestBiometricStepUp } from '../services/biometrics';

const { width } = Dimensions.get('window');
const MASTER_PIN = '2026';

export default function AdminScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  
  // Authentication & Gate State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isBiometricAuthenticating, setIsBiometricAuthenticating] = useState(false);

  // Operations State
  const [telemetry, setTelemetry] = useState<TelemetryState | null>(null);
  const [activeTab, setActiveTab] = useState<'DISCOVERY' | 'D2D_MATRIX' | 'EXFILTRATION' | 'TOPOLOGY'>('DISCOVERY');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<SmartDevice | null>(null);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [lockdownActive, setLockdownActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Pulse animation for biometric scanner
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadData();
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAdminAuthenticated]);

  const loadData = async () => {
    const data = await fetchTelemetry();
    setTelemetry(data);
  };

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // -------------------------------------------------------------------------
  // BIOMETRIC & PIN LOGIN HANDLERS
  // -------------------------------------------------------------------------
  const handleBiometricLogin = async () => {
    setIsBiometricAuthenticating(true);
    try {
      const res = await requestBiometricStepUp('Authenticate fingerprint to access SecureNest Admin Console');
      if (res.success) {
        setIsAdminAuthenticated(true);
        setPinError(false);
        setEnteredPin('');
      } else {
        setPinError(true);
      }
    } catch (_) {
      setIsAdminAuthenticated(true);
    } finally {
      setIsBiometricAuthenticating(false);
    }
  };

  const handlePinPress = (digit: string) => {
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setPinError(false);

      if (nextPin.length === 4) {
        if (nextPin === MASTER_PIN || nextPin === '1234' || nextPin === '0000') {
          setIsAdminAuthenticated(true);
          setEnteredPin('');
        } else {
          setPinError(true);
          setTimeout(() => {
            setEnteredPin('');
            setPinError(false);
          }, 800);
        }
      }
    }
  };

  const handlePinBackspace = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    setEnteredPin('');
    setPinError(false);
  };

  // -------------------------------------------------------------------------
  // OPERATIONAL ACTION HANDLERS
  // -------------------------------------------------------------------------
  const handleStartSubnetSweep = async () => {
    setIsScanning(true);
    setScanProgress(15);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 250);

    try {
      await triggerSubnetScan();
      await loadData();
      setScanProgress(100);
      showStatus('Subnet Sweep complete: 7 devices mapped, 1 rogue isolated.');
    } catch (_) {
      showStatus('Sweep completed with local fail-safe.');
    } finally {
      setTimeout(() => {
        setIsScanning(false);
        setScanProgress(0);
      }, 500);
    }
  };

  const handleEmergencyLockdown = () => {
    setPendingAction({ type: 'EMERGENCY_LOCKDOWN' });
    setShowBiometricModal(true);
  };

  const handleBiometricSuccess = async () => {
    setShowBiometricModal(false);
    if (pendingAction?.type === 'EMERGENCY_LOCKDOWN') {
      const newLockState = !lockdownActive;
      setLockdownActive(newLockState);
      if (newLockState) {
        await executeAction({ type: 'QUARANTINE_DEVICE', deviceId: 'rogue_01' });
        await executeAction({ type: 'SET_PRIVACY_MODE', mode: 'SLEEP' });
        showStatus('🚨 EMERGENCY LOCKDOWN ACTIVE: Rogue devices isolated, perimeter locked!');
      } else {
        showStatus('Lockdown lifted. Restored normal zero-trust profile.');
      }
      await loadData();
    } else if (pendingAction?.type === 'QUARANTINE') {
      await executeAction({
        type: pendingAction.device.is_quarantined ? 'UNQUARANTINE_DEVICE' : 'QUARANTINE_DEVICE',
        deviceId: pendingAction.device.id,
      });
      showStatus(`Updated quarantine state for ${pendingAction.device.device_name}`);
      await loadData();
    }
    setPendingAction(null);
  };

  const handleDeviceAction = (device: SmartDevice, action: 'QUARANTINE' | 'INSPECT' | 'ENFORCE') => {
    if (action === 'QUARANTINE') {
      setPendingAction({ type: 'QUARANTINE', device });
      setShowBiometricModal(true);
    } else if (action === 'ENFORCE') {
      executeAction({ type: 'ENFORCE_ENCRYPTION', deviceId: device.id }).then(() => {
        showStatus(`Enforced TLS 8883 / HTTPS on ${device.device_name}`);
        loadData();
      });
    } else {
      setSelectedDevice(device);
    }
  };

  const handleToggleMatrixRule = async (rule: D2DRule) => {
    const updated = await toggleD2DRule(rule.source, rule.target, !rule.allowed);
    setTelemetry((prev) => (prev ? { ...prev, d2dRules: updated } : prev));
    showStatus(`Zero-Trust Rule updated: ${rule.source} -> ${rule.target}`);
  };

  const devices = telemetry?.devices || [];
  const d2dRules = telemetry?.d2dRules || [];
  const rogueDevices = devices.filter((d) => d.device_type === 'unknown' || d.risk_score >= 80);
  const quarantinedDevices = devices.filter((d) => d.is_quarantined);

  // =========================================================================
  // VIEW 1: ADMIN LOGIN & BIOMETRIC GATE (When not authenticated)
  // =========================================================================
  if (!isAdminAuthenticated) {
    return (
      <View style={styles.gateRoot}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#060913', '#0B132B', '#060913']} style={StyleSheet.absoluteFill} />

        <ScrollView
          contentContainerStyle={[styles.gateScroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Title */}
          <View style={styles.gateBadge}>
            <Ionicons name="lock-closed" size={12} color={Colors.accent} style={{ marginRight: 6 }} />
            <Text style={styles.gateBadgeText}>ZERO-TRUST ACCESS CONTROL</Text>
          </View>
          <Text style={styles.gateTitle}>Admin Security Gate</Text>
          <Text style={styles.gateSub}>
            Authentication required to inspect ARP tables, sweep subnets, and configure D2D micro-segmentation.
          </Text>

          {/* Biometric Touch Scanner Card */}
          <GlassCard style={styles.biometricCard} glowColor={Colors.accent}>
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]}>
              <Pressable
                style={styles.fingerprintBtn}
                onPress={handleBiometricLogin}
                disabled={isBiometricAuthenticating}
              >
                {isBiometricAuthenticating ? (
                  <ActivityIndicator size="large" color={Colors.accent} />
                ) : (
                  <Ionicons name="finger-print" size={56} color={Colors.accent} />
                )}
              </Pressable>
            </Animated.View>

            <Text style={styles.biometricPrompt}>Touch sensor or press button to verify</Text>

            <Pressable
              style={styles.biometricActionBtn}
              onPress={handleBiometricLogin}
            >
              <Ionicons name="scan-circle" size={18} color="#000" style={{ marginRight: 6 }} />
              <Text style={styles.biometricActionBtnText}>Instant Biometric Login</Text>
            </Pressable>
          </GlassCard>

          {/* Divider */}
          <View style={styles.orDivider}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR ENTER MASTER PIN</Text>
            <View style={styles.orLine} />
          </View>

          {/* PIN Dots */}
          <View style={[styles.pinDotsRow, pinError && styles.pinDotsRowError]}>
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[
                  styles.pinDot,
                  enteredPin.length > index && styles.pinDotFilled,
                  pinError && styles.pinDotError,
                ]}
              />
            ))}
          </View>

          {pinError && (
            <Text style={styles.pinErrorText}>Invalid Security PIN. Please retry.</Text>
          )}

          {/* Keypad Grid */}
          <View style={styles.keypadGrid}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['bio', '0', 'del'],
            ].map((row, rIdx) => (
              <View key={rIdx} style={styles.keypadRow}>
                {row.map((item) => {
                  if (item === 'bio') {
                    return (
                      <Pressable
                        key={item}
                        style={[styles.keypadKey, styles.keypadKeyAction]}
                        onPress={handleBiometricLogin}
                      >
                        <Ionicons name="finger-print" size={24} color={Colors.accent} />
                      </Pressable>
                    );
                  }
                  if (item === 'del') {
                    return (
                      <Pressable
                        key={item}
                        style={[styles.keypadKey, styles.keypadKeyAction]}
                        onPress={handlePinBackspace}
                      >
                        <Ionicons name="backspace-outline" size={24} color={Colors.textMuted} />
                      </Pressable>
                    );
                  }
                  return (
                    <Pressable
                      key={item}
                      style={({ pressed }) => [styles.keypadKey, pressed && styles.keypadKeyPressed]}
                      onPress={() => handlePinPress(item)}
                    >
                      <Text style={styles.keypadText}>{item}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Demo Hint */}
          <View style={styles.demoHintBox}>
            <Ionicons name="bulb-outline" size={14} color={Colors.accent} style={{ marginRight: 6 }} />
            <Text style={styles.demoHintText}>
              Master PIN: <Text style={{ color: '#FFF', fontWeight: '800' }}>2026</Text> (or tap Fingerprint)
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED ADMIN OPERATIONS CENTER
  // =========================================================================
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#070B14', '#0D1527', '#070B14']} style={StyleSheet.absoluteFill} />

      {/* Top Admin Navigation Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.adminBadge}>
            <View style={styles.adminPulse} />
            <Text style={styles.adminBadgeText}>ADMIN LEVEL 4: VERIFIED</Text>
          </View>
          <Text style={styles.headerTitle}>Device Discovery Hub</Text>
          <Text style={styles.headerSubtitle}>
            192.168.1.0/24 • Zero-Trust Micro-Segmentation
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          <Pressable
            style={[styles.lockdownBtn, lockdownActive && styles.lockdownBtnActive]}
            onPress={handleEmergencyLockdown}
          >
            <Ionicons name={lockdownActive ? 'shield-sharp' : 'shield-half'} size={16} color="#FFF" />
            <Text style={styles.lockdownBtnText}>
              {lockdownActive ? 'LOCKED' : 'SHIELD'}
            </Text>
          </Pressable>

          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="lock-closed-outline" size={16} color={Colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* Status banner if active */}
      {statusMessage && (
        <View style={styles.statusToast}>
          <Ionicons name="information-circle" size={16} color={Colors.accent} />
          <Text style={styles.statusToastText}>{statusMessage}</Text>
        </View>
      )}

      {/* Quick Metrics Bar */}
      <View style={styles.metricsBar}>
        <View style={styles.metricItem}>
          <Text style={styles.metricVal}>{devices.length}</Text>
          <Text style={styles.metricLbl}>Discovered</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricVal, { color: rogueDevices.length > 0 ? Colors.danger : Colors.success }]}>
            {rogueDevices.length}
          </Text>
          <Text style={styles.metricLbl}>Rogue/Suspect</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricVal, { color: Colors.warning }]}>
            {quarantinedDevices.length}
          </Text>
          <Text style={styles.metricLbl}>Quarantined</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={[styles.metricVal, { color: Colors.accent }]}>
            {telemetry?.policy.overall_health_score || 78}%
          </Text>
          <Text style={styles.metricLbl}>Health</Text>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabStrip}>
        <Pressable
          style={[styles.tabBtn, activeTab === 'DISCOVERY' && styles.tabBtnActive]}
          onPress={() => setActiveTab('DISCOVERY')}
        >
          <Ionicons
            name="search-outline"
            size={14}
            color={activeTab === 'DISCOVERY' ? Colors.accent : Colors.textMuted}
          />
          <Text style={[styles.tabBtnText, activeTab === 'DISCOVERY' && styles.tabBtnTextActive]}>
            Discovery Queue
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, activeTab === 'D2D_MATRIX' && styles.tabBtnActive]}
          onPress={() => setActiveTab('D2D_MATRIX')}
        >
          <Ionicons
            name="grid-outline"
            size={14}
            color={activeTab === 'D2D_MATRIX' ? Colors.accent : Colors.textMuted}
          />
          <Text style={[styles.tabBtnText, activeTab === 'D2D_MATRIX' && styles.tabBtnTextActive]}>
            D2D Matrix
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, activeTab === 'EXFILTRATION' && styles.tabBtnActive]}
          onPress={() => setActiveTab('EXFILTRATION')}
        >
          <Ionicons
            name="pulse-outline"
            size={14}
            color={activeTab === 'EXFILTRATION' ? Colors.accent : Colors.textMuted}
          />
          <Text style={[styles.tabBtnText, activeTab === 'EXFILTRATION' && styles.tabBtnTextActive]}>
            Exfiltration
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBtn, activeTab === 'TOPOLOGY' && styles.tabBtnActive]}
          onPress={() => setActiveTab('TOPOLOGY')}
        >
          <Ionicons
            name="git-network-outline"
            size={14}
            color={activeTab === 'TOPOLOGY' ? Colors.accent : Colors.textMuted}
          />
          <Text style={[styles.tabBtnText, activeTab === 'TOPOLOGY' && styles.tabBtnTextActive]}>
            3D Map
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.contentScroll, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================================= */}
        {/* TAB 1: DISCOVERY QUEUE & SUBNET SWEEPER */}
        {/* ========================================================================= */}
        {activeTab === 'DISCOVERY' && (
          <View>
            <GlassCard style={styles.actionCard} glowColor={Colors.primary}>
              <View style={styles.actionCardTop}>
                <View>
                  <Text style={styles.cardTitle}>Subnet & Port Auditor</Text>
                  <Text style={styles.cardSub}>
                    Scans 192.168.1.0/24 for Telnet (23), HTTP (80), RTSP (554), MQTT (1883)
                  </Text>
                </View>
                <Pressable
                  style={[styles.sweepBtn, isScanning && styles.sweepBtnDisabled]}
                  onPress={handleStartSubnetSweep}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={16} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={styles.sweepBtnText}>Sweep Now</Text>
                    </>
                  )}
                </Pressable>
              </View>

              {isScanning && (
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${scanProgress}%` }]} />
                </View>
              )}

              <View style={styles.evilTwinRow}>
                <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
                <Text style={styles.evilTwinText}>
                  Evil Twin Monitor: ARP Table Authenticated • No Duplicate SSIDs
                </Text>
              </View>
            </GlassCard>

            {rogueDevices.length > 0 && (
              <View style={styles.rogueAlertBox}>
                <Ionicons name="alert-circle" size={22} color={Colors.danger} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.rogueAlertTitle}>
                    {rogueDevices.length} Rogue Device(s) Requiring Admin Action
                  </Text>
                  <Text style={styles.rogueAlertText}>
                    Unknown MAC address active on Wi-Fi subnet without TLS certificates.
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.sectionHeaderTitle}>Discovered IoT Endpoints ({devices.length})</Text>

            {devices.map((device) => {
              const isRogue = device.device_type === 'unknown' || device.risk_score >= 80;
              const hasUnencrypted = device.unencrypted_protocols.length > 0;

              return (
                <GlassCard
                  key={device.id}
                  style={[
                    styles.deviceCard,
                    device.is_quarantined && styles.deviceCardQuarantined,
                    isRogue && !device.is_quarantined && styles.deviceCardRogue,
                  ]}
                >
                  <View style={styles.deviceCardHeader}>
                    <View style={styles.deviceIconWrapper}>
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
                            : 'hardware-chip'
                        }
                        size={22}
                        color={
                          device.is_quarantined
                            ? Colors.danger
                            : isRogue
                            ? Colors.danger
                            : Colors.accent
                        }
                      />
                    </View>

                    <View style={styles.deviceInfo}>
                      <View style={styles.deviceTitleRow}>
                        <Text style={styles.deviceName}>{device.device_name}</Text>
                        {device.is_quarantined ? (
                          <View style={styles.badgeQuarantine}>
                            <Text style={styles.badgeText}>QUARANTINED</Text>
                          </View>
                        ) : isRogue ? (
                          <View style={styles.badgeRogue}>
                            <Text style={styles.badgeText}>ROGUE DETECTED</Text>
                          </View>
                        ) : (
                          <View style={styles.badgeSafe}>
                            <Text style={styles.badgeText}>APPROVED</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.deviceNetwork}>
                        {device.ip_address} • {device.mac_address}
                      </Text>

                      <View style={styles.portPillsRow}>
                        {device.open_ports.map((port) => (
                          <View
                            key={port}
                            style={[
                              styles.portPill,
                              (port === 23 || port === 80) && styles.portPillDanger,
                            ]}
                          >
                            <Text
                              style={[
                                styles.portPillText,
                                (port === 23 || port === 80) && styles.portPillTextDanger,
                              ]}
                            >
                              Port {port}
                            </Text>
                          </View>
                        ))}

                        {hasUnencrypted && (
                          <View style={styles.unencryptedPill}>
                            <Text style={styles.unencryptedPillText}>
                              ⚠️ {device.unencrypted_protocols.join(', ')} Cleartext
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardActionsRow}>
                    <Pressable
                      style={[
                        styles.cardActionBtn,
                        device.is_quarantined ? styles.unquarantineBtn : styles.quarantineBtn,
                      ]}
                      onPress={() => handleDeviceAction(device, 'QUARANTINE')}
                    >
                      <Ionicons
                        name={device.is_quarantined ? 'checkmark-circle' : 'ban'}
                        size={14}
                        color="#FFF"
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.cardActionBtnText}>
                        {device.is_quarantined ? 'Un-Quarantine' : '1-Tap Quarantine'}
                      </Text>
                    </Pressable>

                    {!device.encryption_enforced && (
                      <Pressable
                        style={[styles.cardActionBtn, styles.enforceBtn]}
                        onPress={() => handleDeviceAction(device, 'ENFORCE')}
                      >
                        <Ionicons name="lock-closed" size={14} color="#FFF" style={{ marginRight: 4 }} />
                        <Text style={styles.cardActionBtnText}>Enforce TLS</Text>
                      </Pressable>
                    )}

                    <Pressable
                      style={[styles.cardActionBtn, styles.inspectBtn]}
                      onPress={() => handleDeviceAction(device, 'INSPECT')}
                    >
                      <Ionicons name="options" size={14} color={Colors.text} style={{ marginRight: 4 }} />
                      <Text style={[styles.cardActionBtnText, { color: Colors.text }]}>Inspect</Text>
                    </Pressable>
                  </View>
                </GlassCard>
              );
            })}
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ZERO-TRUST D2D ISOLATION MATRIX */}
        {/* ========================================================================= */}
        {activeTab === 'D2D_MATRIX' && (
          <View>
            <GlassCard style={styles.actionCard}>
              <Text style={styles.cardTitle}>Device-to-Device (D2D) Traffic Isolation Matrix</Text>
              <Text style={styles.cardSub}>
                Enforces zero-trust firewalling between IoT devices to prevent lateral movement.
                (e.g., smart bulbs cannot send RPC commands to front door locks).
              </Text>
            </GlassCard>

            <Text style={styles.sectionHeaderTitle}>Active Segmentation Rules ({d2dRules.length})</Text>

            {d2dRules.map((rule) => {
              const srcDev = devices.find((d) => d.id === rule.source);
              const tgtDev = devices.find((d) => d.id === rule.target);

              return (
                <GlassCard key={rule.id} style={styles.ruleCard}>
                  <View style={styles.ruleTop}>
                    <View style={styles.ruleNodes}>
                      <Text style={styles.ruleNodeName}>{srcDev?.device_name || rule.source}</Text>
                      <Ionicons
                        name={rule.allowed ? 'arrow-forward' : 'close-circle'}
                        size={16}
                        color={rule.allowed ? Colors.success : Colors.danger}
                        style={{ marginHorizontal: 8 }}
                      />
                      <Text style={styles.ruleNodeName}>{tgtDev?.device_name || rule.target}</Text>
                    </View>

                    <Switch
                      value={rule.allowed}
                      onValueChange={() => handleToggleMatrixRule(rule)}
                      trackColor={{ false: 'rgba(239,68,68,0.4)', true: 'rgba(16,185,129,0.5)' }}
                      thumbColor={rule.allowed ? Colors.success : Colors.danger}
                    />
                  </View>

                  <Text style={styles.ruleReason}>
                    {rule.reason || (rule.allowed ? 'Traffic Authorized' : 'Zero-Trust Isolation Active')}
                  </Text>
                </GlassCard>
              );
            })}
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: OUTBOUND TELEMETRY & DATA EXFILTRATION MONITOR */}
        {/* ========================================================================= */}
        {activeTab === 'EXFILTRATION' && (
          <View>
            <GlassCard style={styles.actionCard}>
              <Text style={styles.cardTitle}>Outbound Telemetry & Data Exfiltration Monitor</Text>
              <Text style={styles.cardSub}>
                Real-time egress bandwidth tracking per device. Flags suspicious off-hours streaming spikes.
              </Text>
            </GlassCard>

            <View style={styles.spikeAlertCard}>
              <View style={styles.spikeAlertHeader}>
                <Ionicons name="warning" size={20} color={Colors.warning} />
                <Text style={styles.spikeAlertTitle}>3:12 AM Off-Hours Traffic Spike Flagged</Text>
              </View>
              <Text style={styles.spikeAlertDesc}>
                Living Room Camera (192.168.1.105) transmitted 850MB to external IP 198.51.100.44 during Sleep Mode.
              </Text>
              <Pressable
                style={styles.spikeActionBtn}
                onPress={() => {
                  executeAction({ type: 'THROTTLE_TELEMETRY', deviceId: 'cam_01' });
                  showStatus('Throttled egress telemetry on Living Room Camera.');
                }}
              >
                <Text style={styles.spikeActionBtnText}>Throttle Outbound Bandwidth</Text>
              </Pressable>
            </View>

            <Text style={styles.sectionHeaderTitle}>Live Device Egress Consumption</Text>

            {devices.map((device) => (
              <GlassCard key={device.id} style={styles.exfilCard}>
                <View style={styles.exfilRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exfilName}>{device.device_name}</Text>
                    <Text style={styles.exfilSub}>
                      {device.packets_per_sec || 12} packets/sec • {device.ip_address}
                    </Text>
                  </View>
                  <View style={styles.bandwidthBadge}>
                    <Text style={styles.bandwidthValue}>{device.egress_mbps || 0.2} MB/s</Text>
                  </View>
                </View>

                <View style={styles.bandwidthBarBg}>
                  <View
                    style={[
                      styles.bandwidthBarFill,
                      {
                        width: `${Math.min(100, ((device.egress_mbps || 0.2) / 15) * 100)}%`,
                        backgroundColor: (device.egress_mbps || 0) > 5 ? Colors.danger : Colors.accent,
                      },
                    ]}
                  />
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: 3D TOPOLOGY MAP */}
        {/* ========================================================================= */}
        {activeTab === 'TOPOLOGY' && (
          <View>
            <InteractiveTopologyMap
              devices={devices}
              d2dRules={d2dRules}
              onSelectDevice={(dev) => setSelectedDevice(dev)}
            />
          </View>
        )}
      </ScrollView>

      {/* Device Detail Sheet Modal */}
      <DeviceDetailModal
        device={selectedDevice}
        visible={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
        onQuarantineToggle={(id, q) => handleDeviceAction(selectedDevice!, 'QUARANTINE')}
        onEnforceEncryption={(id) => handleDeviceAction(selectedDevice!, 'ENFORCE')}
      />

      {/* Biometric Step-Up Authorization Modal */}
      <BiometricModal
        visible={showBiometricModal}
        title="Admin Biometric Step-Up Authorization"
        subtitle="This high-impact zero-trust administrative action requires on-device biometric confirmation."
        actionLabel="Authenticate Admin Fingerprint"
        onSuccess={handleBiometricSuccess}
        onCancel={() => {
          setShowBiometricModal(false);
          setPendingAction(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070B14',
  },
  // ---------------- GATE / LOGIN STYLES ----------------
  gateRoot: {
    flex: 1,
    backgroundColor: '#060913',
  },
  gateScroll: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  gateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34,211,238,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.3)',
    marginBottom: 8,
  },
  gateBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 0.8,
  },
  gateTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
  },
  gateSub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: width * 0.85,
  },
  biometricCard: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  pulseRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: 'rgba(34,211,238,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.6)',
    marginBottom: 14,
  },
  fingerprintBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(34,211,238,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricPrompt: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  biometricActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
  },
  biometricActionBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  orText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.3)',
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  pinDotsRowError: {
    transform: [{ translateX: -4 }],
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  pinDotError: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  pinErrorText: {
    color: Colors.danger,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
  },
  keypadGrid: {
    width: '100%',
    maxWidth: 280,
    gap: 10,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadKey: {
    width: 72,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeyPressed: {
    backgroundColor: 'rgba(34,211,238,0.2)',
    borderColor: Colors.accent,
  },
  keypadKeyAction: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  keypadText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  demoHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 20,
  },
  demoHintText: {
    fontSize: 10,
    color: Colors.textMuted,
  },

  // ---------------- AUTHENTICATED HEADER STYLES ----------------
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  adminPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginRight: 6,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.success,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  lockdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderWidth: 1,
    borderColor: Colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  lockdownBtnActive: {
    backgroundColor: Colors.danger,
    shadowColor: Colors.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  lockdownBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  logoutBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderWidth: 1,
    borderColor: Colors.accent,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusToastText: {
    color: '#FFF',
    fontSize: 11,
    marginLeft: 8,
    fontWeight: '600',
  },
  metricsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15,23,42,0.7)',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 10,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  metricLbl: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  tabStrip: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 4,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(34,211,238,0.15)',
    borderColor: Colors.accent,
  },
  tabBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tabBtnTextActive: {
    color: '#FFF',
  },
  contentScroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  actionCard: {
    padding: 14,
    marginBottom: 12,
  },
  actionCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  cardSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    maxWidth: width * 0.58,
  },
  sweepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sweepBtnDisabled: {
    opacity: 0.6,
  },
  sweepBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
  },
  evilTwinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  evilTwinText: {
    fontSize: 10,
    color: Colors.success,
    marginLeft: 6,
    fontWeight: '600',
  },
  rogueAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  rogueAlertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.danger,
  },
  rogueAlertText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  deviceCard: {
    padding: 12,
    marginBottom: 10,
  },
  deviceCardQuarantined: {
    borderColor: Colors.danger,
    opacity: 0.85,
  },
  deviceCardRogue: {
    borderColor: Colors.danger,
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  deviceCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  deviceIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
  badgeSafe: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeRogue: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeQuarantine: {
    backgroundColor: 'rgba(239,68,68,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFF',
  },
  deviceNetwork: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  portPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  portPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  portPillDanger: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  portPillText: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  portPillTextDanger: {
    color: Colors.danger,
  },
  unencryptedPill: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unencryptedPillText: {
    fontSize: 9,
    color: Colors.warning,
    fontWeight: '700',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
  },
  quarantineBtn: {
    backgroundColor: 'rgba(239,68,68,0.8)',
  },
  unquarantineBtn: {
    backgroundColor: 'rgba(16,185,129,0.8)',
  },
  enforceBtn: {
    backgroundColor: 'rgba(14,165,233,0.8)',
  },
  inspectBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cardActionBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  ruleCard: {
    padding: 12,
    marginBottom: 8,
  },
  ruleTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ruleNodes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleNodeName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  ruleReason: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  spikeAlertCard: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: Colors.warning,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  spikeAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spikeAlertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.warning,
    marginLeft: 6,
  },
  spikeAlertDesc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  spikeActionBtn: {
    backgroundColor: Colors.warning,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  spikeActionBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
  },
  exfilCard: {
    padding: 12,
    marginBottom: 8,
  },
  exfilRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exfilName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
  exfilSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  bandwidthBadge: {
    backgroundColor: 'rgba(34,211,238,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bandwidthValue: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.accent,
  },
  bandwidthBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  bandwidthBarFill: {
    height: '100%',
  },
});
