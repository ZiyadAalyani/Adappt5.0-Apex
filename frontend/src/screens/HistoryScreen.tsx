import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import GlassCard from '../components/GlassCard';
import PushAlertBanner from '../components/PushAlertBanner';
import { Colors, BorderRadius } from '../constants/theme';
import {
  fetchTelemetry,
  simulateAttack,
  SentinelIncident,
} from '../services/api';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [incidents, setIncidents] = useState<SentinelIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<SentinelIncident | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'TRAP' | 'AUTO_BLOCK'>('ALL');
  const [simulatedAlert, setSimulatedAlert] = useState<any>(null);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    const t = await fetchTelemetry();
    setIncidents(t.incidents || []);
  };

  const handleSimulateAttack = async () => {
    const res = await simulateAttack();
    if (res.pushNotification) {
      setSimulatedAlert(res.pushNotification);
    }
    loadIncidents();
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (activeFilter === 'CRITICAL') return inc.severity === 'CRITICAL';
    if (activeFilter === 'TRAP') return inc.type === 'DECOY_TRAP_HIT';
    if (activeFilter === 'AUTO_BLOCK') return inc.type === 'AUTO_BLOCK';
    return true;
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0A0E17', '#0F172A', '#0A0E17']} style={StyleSheet.absoluteFill} />

      {/* Simulated Alert Push Banner */}
      <PushAlertBanner
        visible={!!simulatedAlert}
        title={simulatedAlert?.title || ''}
        message={simulatedAlert?.body || ''}
        severity="CRITICAL"
        onDismiss={() => setSimulatedAlert(null)}
        onInspect={() => {
          setSimulatedAlert(null);
          if (incidents.length > 0) setSelectedIncident(incidents[0]);
        }}
      />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Real-Time Threat Console</Text>
        <Text style={styles.subtitle}>Sentinel forensic logs, honeypot decoy traps & auto-blocked attacks</Text>

        {/* Quick Simulation Banner */}
        <GlassCard style={styles.simCard} glowColor={Colors.danger}>
          <View style={styles.simHeader}>
            <Ionicons name="flash" size={22} color={Colors.danger} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.simTitle}>SmartHome Sentinel Live Honeypot</Text>
              <Text style={styles.simSub}>
                Decoys active at /.env, /wp-login.php, /api/v1/unlock. Instant auto-block on scanner touch.
              </Text>
            </View>
          </View>
          <Pressable style={styles.simBtn} onPress={handleSimulateAttack}>
            <LinearGradient
              colors={['#DC2626', '#991B1B']}
              style={styles.simBtnGrad}
            >
              <Ionicons name="bug" size={16} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.simBtnText}>Simulate Honeypot Breach & Test Alert</Text>
            </LinearGradient>
          </Pressable>
        </GlassCard>

        {/* Filter Chips */}
        <View style={styles.filtersRow}>
          {(['ALL', 'CRITICAL', 'TRAP', 'AUTO_BLOCK'] as const).map((filter) => (
            <Pressable
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                {filter === 'ALL'
                  ? 'All Threats'
                  : filter === 'CRITICAL'
                  ? 'Critical'
                  : filter === 'TRAP'
                  ? 'Decoy Traps'
                  : 'Auto-Blocked'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Incidents List */}
        <Text style={styles.sectionHeading}>Forensic Incident Timeline</Text>
        {filteredIncidents.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="shield-checkmark" size={36} color={Colors.success} />
            <Text style={styles.emptyText}>No Active Threats in this Category</Text>
          </GlassCard>
        ) : (
          filteredIncidents.map((inc) => {
            const isCrit = inc.severity === 'CRITICAL';
            const isTrap = inc.type === 'DECOY_TRAP_HIT';

            return (
              <GlassCard key={inc.id} style={styles.incidentCard}>
                <View style={styles.incidentTop}>
                  <View style={[styles.iconWrap, { backgroundColor: isCrit ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)' }]}>
                    <Ionicons
                      name={isTrap ? 'skull' : 'hand-left'}
                      size={20}
                      color={isCrit ? Colors.danger : Colors.warning}
                    />
                  </View>

                  <View style={styles.incidentMeta}>
                    <View style={styles.typeRow}>
                      <Text style={[styles.typeBadge, { color: isCrit ? Colors.danger : Colors.warning }]}>
                        {isTrap ? 'HONEYPOT TRAP TRIPPED' : 'BRUTE-FORCE AUTO-BLOCK'}
                      </Text>
                      <Text style={styles.timestamp}>{inc.timestamp}</Text>
                    </View>
                    <Text style={styles.sourceIp}>Attacker IP: {inc.sourceIp}</Text>
                  </View>
                </View>

                <Text style={styles.messageText}>{inc.message}</Text>

                <View style={styles.cardActions}>
                  <Pressable
                    style={styles.evidenceBtn}
                    onPress={() => setSelectedIncident(inc)}
                  >
                    <Ionicons name="document-text-outline" size={14} color={Colors.primaryLight} style={{ marginRight: 4 }} />
                    <Text style={styles.evidenceBtnText}>View Forensic Evidence</Text>
                  </Pressable>
                  <View style={styles.blockedPill}>
                    <Ionicons name="ban" size={12} color={Colors.danger} style={{ marginRight: 4 }} />
                    <Text style={styles.blockedText}>Blacklisted</Text>
                  </View>
                </View>
              </GlassCard>
            );
          })
        )}
      </ScrollView>

      {/* Forensic Evidence Modal */}
      <Modal visible={!!selectedIncident} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,8,16,0.85)' }]} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="finger-print" size={24} color={Colors.accent} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Forensic Attack Evidence</Text>
              </View>
              <Pressable onPress={() => setSelectedIncident(null)}>
                <Ionicons name="close-circle" size={26} color={Colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.evidenceField}>
                <Text style={styles.fieldLabel}>SOURCE IP ADDRESS</Text>
                <Text style={styles.fieldVal}>{selectedIncident?.sourceIp}</Text>
              </View>

              <View style={styles.evidenceField}>
                <Text style={styles.fieldLabel}>INCIDENT TYPE</Text>
                <Text style={styles.fieldVal}>{selectedIncident?.type}</Text>
              </View>

              <View style={styles.evidenceField}>
                <Text style={styles.fieldLabel}>DETECTION REASON</Text>
                <Text style={styles.fieldVal}>{selectedIncident?.message}</Text>
              </View>

              <View style={styles.evidenceField}>
                <Text style={styles.fieldLabel}>MITIGATION ACTIONS TAKEN</Text>
                <Text style={styles.fieldVal}>
                  • IP blacklisted in kernel firewall{'\n'}
                  • Session tokens invalidated{'\n'}
                  • IoT locks set to high-security fail-secure state{'\n'}
                  • Mobile intrusion alert pushed
                </Text>
              </View>

              <View style={styles.evidenceField}>
                <Text style={styles.fieldLabel}>TARGET HONEYPOT PATHS</Text>
                <Text style={styles.fieldCode}>
                  [GET] /api/v1/unlock - 401 Unauthorized{'\n'}
                  [GET] /.env - 401 Unauthorized{'\n'}
                  [POST] /login - 401 Failed Authentication
                </Text>
              </View>
            </ScrollView>

            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setSelectedIncident(null)}
            >
              <Text style={styles.modalCloseText}>Close Forensic View</Text>
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
  simCard: {
    padding: 16,
    marginBottom: 16,
  },
  simHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  simTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  simSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  simBtn: {
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  simBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  simBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  filterTextActive: {
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
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 10,
  },
  incidentCard: {
    padding: 14,
    marginBottom: 10,
  },
  incidentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  incidentMeta: {
    flex: 1,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timestamp: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  sourceIp: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  messageText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
  },
  evidenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  evidenceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryLight,
  },
  blockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  blockedText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.danger,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.xl,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  modalScroll: {
    marginBottom: 16,
  },
  evidenceField: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.accent,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  fieldVal: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  fieldCode: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#34D399',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 8,
    borderRadius: 6,
    lineHeight: 16,
  },
  modalCloseBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
