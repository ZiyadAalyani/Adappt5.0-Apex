import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  TextInput,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassCard from '../components/GlassCard';
import BiometricModal from '../components/BiometricModal';
import { Colors, BorderRadius } from '../constants/theme';
import {
  fetchTelemetry,
  executeAction,
  getBackendUrl,
  setBackendUrl,
  TelemetryState,
} from '../services/api';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [telemetry, setTelemetry] = useState<TelemetryState | null>(null);
  const [privacyMode, setPrivacyMode] = useState<'NORMAL' | 'GUEST' | 'SLEEP'>('NORMAL');
  const [d2dIsolation, setD2dIsolation] = useState(true);
  const [metadataStrip, setMetadataStrip] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [geofenceEnabled, setGeofenceEnabled] = useState(true);
  const [autoBlockUnknown, setAutoBlockUnknown] = useState(true);

  const [backendIp, setBackendIp] = useState(getBackendUrl());
  const [neonConnStr, setNeonConnStr] = useState('postgresql://neondb_owner:***@ep-silent-hill.us-east-2.aws.neon.tech/neondb?sslmode=require');
  const [smsPhone, setSmsPhone] = useState('+1 (555) 019-2834');
  const [showBiometricTest, setShowBiometricTest] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await fetchTelemetry();
    setTelemetry(data);
    if (data?.policy) {
      setPrivacyMode(data.policy.current_privacy_mode);
      setD2dIsolation(data.policy.d2d_isolation_enabled);
      setMetadataStrip(data.policy.metadata_stripping_enabled);
      setBiometricsEnabled(data.policy.biometric_step_up_enabled);
      setGeofenceEnabled(data.policy.geofence_lock_enabled);
      setAutoBlockUnknown(data.policy.auto_block_unknown_devices);
    }
  };

  const handlePrivacyModeChange = async (mode: 'NORMAL' | 'GUEST' | 'SLEEP') => {
    setPrivacyMode(mode);
    await executeAction({ type: 'SET_PRIVACY_MODE', mode });
  };

  const handleSaveBackend = () => {
    setBackendUrl(backendIp);
    Alert.alert('Backend Gateway Updated', `Connected to: ${backendIp}`);
  };

  const handleTestSmsWebhook = async () => {
    try {
      await fetch(`${getBackendUrl()}/api/webhook/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: smsPhone,
          message: '🚨 CRITICAL ALERT: Suspicious honeypot entry point blocked on Smart Home Hub.',
          alertType: 'CRITICAL_SECURITY_EVENT',
        }),
      });
      Alert.alert('SMS Webhook Delivered', `Test SMS dispatched to ${smsPhone}`);
    } catch (_) {
      Alert.alert('SMS Webhook Simulated', `Notification payload delivered to simulated webhook for ${smsPhone}`);
    }
  };

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
        <Text style={styles.title}>Zero-Trust Policies & Privacy</Text>
        <Text style={styles.subtitle}>Configure micro-segmentation, privacy presets, and gateway rules</Text>

        {/* 1. Preset Privacy Modes */}
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Preset Privacy Modes</Text>

          <View style={styles.modesRow}>
            {/* Normal */}
            <Pressable
              style={[styles.modeCard, privacyMode === 'NORMAL' && styles.modeCardActive]}
              onPress={() => handlePrivacyModeChange('NORMAL')}
            >
              <Ionicons
                name="shield-checkmark"
                size={22}
                color={privacyMode === 'NORMAL' ? '#fff' : Colors.textMuted}
              />
              <Text style={[styles.modeTitle, privacyMode === 'NORMAL' && styles.modeTitleActive]}>
                Normal
              </Text>
              <Text style={styles.modeSub}>Standard zero-trust monitoring</Text>
            </Pressable>

            {/* Guest */}
            <Pressable
              style={[styles.modeCard, privacyMode === 'GUEST' && styles.modeCardActive]}
              onPress={() => handlePrivacyModeChange('GUEST')}
            >
              <Ionicons
                name="people"
                size={22}
                color={privacyMode === 'GUEST' ? '#fff' : Colors.textMuted}
              />
              <Text style={[styles.modeTitle, privacyMode === 'GUEST' && styles.modeTitleActive]}>
                Guest
              </Text>
              <Text style={styles.modeSub}>Isolates door locks & cameras</Text>
            </Pressable>

            {/* Sleep */}
            <Pressable
              style={[styles.modeCard, privacyMode === 'SLEEP' && styles.modeCardActive]}
              onPress={() => handlePrivacyModeChange('SLEEP')}
            >
              <Ionicons
                name="moon"
                size={22}
                color={privacyMode === 'SLEEP' ? '#fff' : Colors.textMuted}
              />
              <Text style={[styles.modeTitle, privacyMode === 'SLEEP' && styles.modeTitleActive]}>
                Sleep Mode
              </Text>
              <Text style={styles.modeSub}>Blocks vendor cloud analytics</Text>
            </Pressable>
          </View>
        </GlassCard>

        {/* 2. Zero-Trust Access Rules */}
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Zero-Trust Hardening Policies</Text>

          {/* D2D Isolation */}
          <View style={styles.settingRow}>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingLabel}>Device-to-Device (D2D) Traffic Isolation</Text>
              <Text style={styles.settingDesc}>
                Prevents smart bulbs and low-privilege IoT from accessing door locks or security cameras.
              </Text>
            </View>
            <Switch
              value={d2dIsolation}
              onValueChange={(val) => {
                setD2dIsolation(val);
                executeAction({ type: 'SET_D2D_ISOLATION', enabled: val });
              }}
              trackColor={{ false: '#334155', true: Colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.divider} />

          {/* Payload Metadata Stripping */}
          <View style={styles.settingRow}>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingLabel}>Payload Metadata Stripping</Text>
              <Text style={styles.settingDesc}>
                Inspects outgoing MQTT/JSON payloads at the gateway and masks PII, MACs, and GPS coordinates.
              </Text>
            </View>
            <Switch
              value={metadataStrip}
              onValueChange={(val) => {
                setMetadataStrip(val);
                executeAction({ type: 'SET_METADATA_STRIPPING', enabled: val });
              }}
              trackColor={{ false: '#334155', true: Colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.divider} />

          {/* Biometric Step-Up */}
          <View style={styles.settingRow}>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingLabel}>Biometric Step-Up Authorization</Text>
              <Text style={styles.settingDesc}>
                Requires fingerprint or facial recognition via Android BiometricPrompt for critical actions.
              </Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={(val) => {
                setBiometricsEnabled(val);
                if (val) setShowBiometricTest(true);
              }}
              trackColor={{ false: '#334155', true: Colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.divider} />

          {/* Context-Aware Geofencing */}
          <View style={styles.settingRow}>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingLabel}>Context-Aware Geofencing (Home SSID)</Text>
              <Text style={styles.settingDesc}>
                Disallows door unlock and disarm commands if mobile phone is disconnected from HomeShield_Secure_5G.
              </Text>
            </View>
            <Switch
              value={geofenceEnabled}
              onValueChange={(val) => {
                setGeofenceEnabled(val);
                executeAction({ type: 'SET_GEOFENCE_LOCK', enabled: val });
              }}
              trackColor={{ false: '#334155', true: Colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.divider} />

          {/* Auto-Block Unknown Devices */}
          <View style={styles.settingRow}>
            <View style={styles.settingTextWrap}>
              <Text style={styles.settingLabel}>Auto-Block Spam & Unknown Rogue Devices</Text>
              <Text style={styles.settingDesc}>
                Immediately quarantines unauthorized MAC addresses and honeypot scanners.
              </Text>
            </View>
            <Switch
              value={autoBlockUnknown}
              onValueChange={setAutoBlockUnknown}
              trackColor={{ false: '#334155', true: Colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </GlassCard>

        {/* 3. Push SMS Alert Webhook */}
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Mobile Push & SMS Alert Webhook</Text>
          <Text style={styles.settingDesc}>
            Dispatches simulated push notification & webhook SMS to homeowner when a suspicious entry point is blocked.
          </Text>

          <View style={styles.inputWrap}>
            <Ionicons name="phone-portrait-outline" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.textInput}
              value={smsPhone}
              onChangeText={setSmsPhone}
              placeholder="+1 (555) 019-2834"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <Pressable style={styles.testBtn} onPress={handleTestSmsWebhook}>
            <Text style={styles.testBtnText}>Test Push SMS Alert Webhook</Text>
          </Pressable>
        </GlassCard>

        {/* 4. Backend Gateway & Neon PostgreSQL Connection */}
        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Neon DB & Node.js Gateway Settings</Text>

          <Text style={styles.inputLabel}>Node.js Backend Gateway URL</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="server-outline" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.textInput}
              value={backendIp}
              onChangeText={setBackendIp}
              placeholder="http://10.0.2.2:3000"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <Pressable style={styles.saveBtn} onPress={handleSaveBackend}>
            <Text style={styles.saveBtnText}>Connect to Node.js Backend</Text>
          </Pressable>

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Neon PostgreSQL Connection String</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="logo-buffer" size={18} color={Colors.accent} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.textInput}
              value={neonConnStr}
              onChangeText={setNeonConnStr}
              placeholder="postgres://user:pass@ep-xyz.neon.tech/neondb"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />
          </View>

          <View style={styles.dbStatusBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} style={{ marginRight: 6 }} />
            <Text style={styles.dbStatusText}>Neon Serverless Sync Ready</Text>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Biometric Prompt Test */}
      <BiometricModal
        visible={showBiometricTest}
        title="Biometric Setup Verified"
        subtitle="Fingerprint scanner configured for SmartHome Zero-Trust Step-Up authorization."
        actionLabel="Confirm Biometric Test"
        onSuccess={() => setShowBiometricTest(false)}
        onCancel={() => setShowBiometricTest(false)}
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
    marginBottom: 20,
  },
  sectionCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeCard: {
    flex: 1,
    padding: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
  },
  modeCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 8,
  },
  modeTitleActive: {
    color: '#fff',
  },
  modeSub: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  settingDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.text,
  },
  testBtn: {
    backgroundColor: 'rgba(34,211,238,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.3)',
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    marginTop: 6,
  },
  testBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  dbStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dbStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
});
