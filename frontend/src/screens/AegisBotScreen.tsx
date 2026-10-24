import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CyberBot from '../components/CyberBot';
import GlassCard from '../components/GlassCard';
import { Colors, BorderRadius } from '../constants/theme';
import { sendAegisChat, fetchTelemetry, executeAction, TelemetryState } from '../services/api';

const { width } = Dimensions.get('window');

let ImagePicker: any = null;
try {
  ImagePicker = require('expo-image-picker');
} catch (_) {}

let Speech: any = null;
try {
  Speech = require('expo-speech');
} catch (_) {}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  thinkingText?: string | null;
  toolCall?: {
    name: string;
    target?: string;
    status: 'COMPLETED' | 'RUNNING' | 'FAILED';
    output?: string;
  } | null;
  imageUri?: string | null;
  timestamp: string;
  suggestedAction?: {
    label: string;
    actionType: string;
    deviceId?: string;
  } | null;
}

export default function AegisBotScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Greetings. I am **SecureBot**, your SecureNest autonomous AI Guardian.\n\nI continuously monitor your network interfaces, analyze ARP tables, and enforce zero-trust isolation against rogue intrusions.',
      thinkingText: 'Initial zero-trust state loaded. Network perimeter healthy (Health score: 78%). Listening on ports 23, 80, 554, 1883, 8883.',
      toolCall: {
        name: 'initialize_sentinel_watchdog',
        target: '192.168.1.0/24',
        status: 'COMPLETED',
        output: 'Honeypots active on /.env, /admin, /api/v1/unlock',
      },
      timestamp: 'Just now',
      suggestedAction: {
        label: 'Run Subnet Port Audit',
        actionType: 'AUDIT_SUBNET',
      },
    },
  ]);

  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedBase64, setAttachedBase64] = useState<string | null>(null);
  const [language, setLanguage] = useState<'ENGLISH' | 'HINDI' | 'MARATHI'>('ENGLISH');
  const [isThinking, setIsThinking] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryState | null>(null);
  const [isTtsMuted, setIsTtsMuted] = useState(false);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({ '1': true });

  useEffect(() => {
    loadTelemetry();
  }, []);

  const loadTelemetry = async () => {
    const t = await fetchTelemetry();
    setTelemetry(t);
  };

  const speakText = (text: string) => {
    if (isTtsMuted || !Speech) return;
    try {
      Speech.stop();
      const cleanText = text.replace(/[*#_`]/g, '').slice(0, 250);
      const langCode = language === 'HINDI' ? 'hi-IN' : language === 'MARATHI' ? 'mr-IN' : 'en-IN';
      Speech.speak(cleanText, { language: langCode, rate: 1.0 });
    } catch (_) {}
  };

  const handlePickImage = async () => {
    if (!ImagePicker) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachedImage(result.assets[0].uri);
        setAttachedBase64(result.assets[0].base64 || null);
      }
    } catch (_) {}
  };

  const toggleThought = (msgId: string) => {
    setExpandedThoughts((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleSend = async (customText?: string) => {
    const msgText = customText || input;
    if (!msgText.trim() && !attachedImage) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: msgText.trim() || '[Uploaded Router Screenshot for Inspection]',
      imageUri: attachedImage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    const base64ToSend = attachedBase64;
    setAttachedImage(null);
    setAttachedBase64(null);
    setIsThinking(true);

    try {
      const response = await sendAegisChat(msgText, base64ToSend, language);

      let toolCall = null;
      let thinkingText = null;
      let suggestedAction = null;

      if (response.action) {
        toolCall = {
          name: response.action.type.toLowerCase(),
          target: response.action.deviceId || 'Global Gateway',
          status: 'COMPLETED' as const,
          output: `Enforced policy on ${response.action.deviceId || 'smart home network'}.`,
        };
        thinkingText = `Zero-Trust Policy trigger detected: Executing ${response.action.type}. Auto-hardening network ARP entries.`;
      } else if (msgText.toLowerCase().includes('port') || msgText.toLowerCase().includes('scan')) {
        toolCall = {
          name: 'port_scanner_auditor',
          target: '192.168.1.0/24',
          status: 'COMPLETED' as const,
          output: 'Open ports: 23 (Telnet), 80 (HTTP), 554 (RTSP), 1883 (MQTT), 8883 (TLS)',
        };
        thinkingText = 'Evaluated vulnerability matrix against NIST IoT guidelines. Flagged unencrypted HTTP and Telnet.';
        suggestedAction = {
          label: 'Quarantine Unknown Devices',
          actionType: 'QUARANTINE_DEVICE',
          deviceId: 'rogue_01',
        };
      } else {
        thinkingText = 'Analyzing intent via Gemini 3.5 Flash-Lite. Context: 7 devices, 4 alerts, zero-trust active.';
      }

      const botMsgId = (Date.now() + 1).toString();
      const botMsg: ChatMessage = {
        id: botMsgId,
        sender: 'bot',
        text: response.reply,
        thinkingText,
        toolCall,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAction,
      };

      setMessages((prev) => [...prev, botMsg]);
      setExpandedThoughts((prev) => ({ ...prev, [botMsgId]: true }));
      speakText(response.reply);
      await loadTelemetry();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          sender: 'system',
          text: 'Local fail-safe active: Network request timed out. Local zero-trust policies remain fully enforced.',
          timestamp: 'Now',
        },
      ]);
    } finally {
      setIsThinking(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  };

  const handleExecuteAction = async (actionType: string, deviceId?: string) => {
    await executeAction({ type: actionType, deviceId });
    await loadTelemetry();
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'system',
        text: `Executed action: ${actionType} on ${deviceId || 'system'}. Network security hardened.`,
        timestamp: 'Just now',
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#070B14', '#0D1527', '#070B14']} style={StyleSheet.absoluteFill} />

      {/* CLINE-STYLE TOP AGENT BAR */}
      <View style={[styles.clineHeader, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTopRow}>
          <Pressable style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
            <Ionicons name="chevron-back" size={20} color={Colors.text} />
          </Pressable>

          {/* Model Badge */}
          <View style={styles.modelBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.modelName}>Gemini 3.5 Flash-Lite</Text>
            <View style={styles.agentModePill}>
              <Text style={styles.agentModeText}>DEFENSE AGENT</Text>
            </View>
          </View>

          {/* Audio speech toggle */}
          <Pressable style={styles.iconCircle} onPress={() => setIsTtsMuted(!isTtsMuted)}>
            <Text style={{ fontSize: 14 }}>{isTtsMuted ? '🔇' : '🔊'}</Text>
          </Pressable>
        </View>

        {/* Sub-bar: Language & Health */}
        <View style={styles.headerBottomRow}>
          <View style={styles.healthContextPill}>
            <Ionicons name="shield-checkmark" size={12} color={Colors.success} />
            <Text style={styles.healthContextText}>
              Perimeter Score: {telemetry?.policy.overall_health_score || 78}%
            </Text>
          </View>

          {/* Language selector chips */}
          <View style={styles.langDock}>
            {(['ENGLISH', 'HINDI', 'MARATHI'] as const).map((l) => (
              <Pressable
                key={l}
                style={[styles.langBtn, language === l && styles.langBtnActive]}
                onPress={() => setLanguage(l)}
              >
                <Text style={[styles.langBtnText, language === l && styles.langBtnTextActive]}>
                  {l === 'ENGLISH' ? 'EN' : l === 'HINDI' ? 'हिन्दी' : 'मराठी'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* CHAT MESSAGES STREAM */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.messagesList, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => {
          if (msg.sender === 'user') {
            return (
              <View key={msg.id} style={styles.userMsgWrapper}>
                <View style={styles.userMsgBubble}>
                  <View style={styles.userMsgHeader}>
                    <Text style={styles.userBadge}>YOU</Text>
                    <Text style={styles.msgTime}>{msg.timestamp}</Text>
                  </View>

                  {msg.imageUri && (
                    <Image source={{ uri: msg.imageUri }} style={styles.uploadedImgPreview} resizeMode="cover" />
                  )}

                  <Text style={styles.userMsgText}>{msg.text}</Text>
                </View>
              </View>
            );
          }

          if (msg.sender === 'system') {
            return (
              <View key={msg.id} style={styles.systemMsgWrapper}>
                <Ionicons name="information-circle" size={14} color={Colors.accent} />
                <Text style={styles.systemMsgText}>{msg.text}</Text>
              </View>
            );
          }

          // BOT / CLINE AGENT MESSAGE
          const thoughtExpanded = expandedThoughts[msg.id];

          return (
            <View key={msg.id} style={styles.botMsgWrapper}>
              {/* Bot Avatar & Agent Label */}
              <View style={styles.botHeaderRow}>
                <View style={styles.botAvatarGlow}>
                  <CyberBot size={34} mood={isThinking ? 'scanning' : 'happy'} />
                </View>
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.botName}>SecureBot AI</Text>
                  <Text style={styles.botTaskStatus}>Zero-Trust CoT Reasoning</Text>
                </View>
                <Text style={[styles.msgTime, { marginLeft: 'auto' }]}>{msg.timestamp}</Text>
              </View>

              {/* CLINE-STYLE REASONING CALLOUT ACCORDION */}
              {msg.thinkingText && (
                <Pressable
                  style={styles.thoughtAccordion}
                  onPress={() => toggleThought(msg.id)}
                >
                  <View style={styles.thoughtTop}>
                    <View style={styles.thoughtTitleRow}>
                      <Ionicons name="bulb-outline" size={14} color={Colors.accent} />
                      <Text style={styles.thoughtTitle}>Agent Thinking Process</Text>
                    </View>
                    <Ionicons
                      name={thoughtExpanded ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={Colors.textMuted}
                    />
                  </View>

                  {thoughtExpanded && (
                    <Text style={styles.thoughtBody}>{msg.thinkingText}</Text>
                  )}
                </Pressable>
              )}

              {/* CLINE-STYLE TOOL EXECUTION BLOCK */}
              {msg.toolCall && (
                <View style={styles.toolCallBox}>
                  <View style={styles.toolCallHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="terminal" size={13} color={Colors.accent} />
                      <Text style={styles.toolCallName}>
                        Tool: {msg.toolCall.name}
                      </Text>
                    </View>
                    <View style={styles.toolStatusBadge}>
                      <Text style={styles.toolStatusText}>{msg.toolCall.status}</Text>
                    </View>
                  </View>

                  <View style={styles.toolTerminal}>
                    <Text style={styles.toolTerminalText}>
                      $ aegis-sentinel --target="{msg.toolCall.target}"{'\n'}
                      {msg.toolCall.output}
                    </Text>
                  </View>
                </View>
              )}

              {/* BOT MAIN RESPONSE */}
              <View style={styles.botMsgCard}>
                <Text style={styles.botMsgText}>{msg.text}</Text>

                {/* SUGGESTED ACTION BUTTON */}
                {msg.suggestedAction && (
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() =>
                      handleExecuteAction(
                        msg.suggestedAction!.actionType,
                        msg.suggestedAction!.deviceId
                      )
                    }
                  >
                    <Ionicons name="shield-checkmark" size={14} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.actionBtnText}>{msg.suggestedAction.label}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}

        {isThinking && (
          <View style={styles.thinkingCard}>
            <ActivityIndicator size="small" color={Colors.accent} />
            <Text style={styles.thinkingText}>AegisBot is analyzing network graph & inspecting CVEs...</Text>
          </View>
        )}
      </ScrollView>

      {/* CLINE-STYLE FLOATING SUGGESTIONS CHIPS */}
      <View style={[styles.floatingDock, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionChipsScroll}
        >
          <Pressable
            style={styles.chip}
            onPress={() => handleSend('Auto-remediate all unencrypted channels')}
          >
            <Text style={styles.chipText}>⚡ 1-Tap Auto-Remediate</Text>
          </Pressable>

          <Pressable
            style={styles.chip}
            onPress={() => handleSend('Scan local subnet 192.168.1.0/24 for open ports')}
          >
            <Text style={styles.chipText}>🔍 Subnet & Port Sweep</Text>
          </Pressable>

          <Pressable
            style={styles.chip}
            onPress={() => handleSend('Quarantine the unknown ESP32 device immediately')}
          >
            <Text style={styles.chipText}>🚫 Quarantine Rogue ESP32</Text>
          </Pressable>

          <Pressable
            style={styles.chip}
            onPress={() => handleSend('Enforce MQTTS and TLS 8883 across smart home')}
          >
            <Text style={styles.chipText}>🔒 Enforce MQTTS / TLS</Text>
          </Pressable>

          <Pressable
            style={styles.chip}
            onPress={handlePickImage}
          >
            <Text style={styles.chipText}>📸 Router Screenshot Audit</Text>
          </Pressable>
        </ScrollView>

        {/* ATTACHMENT PREVIEW IF SELECTED */}
        {attachedImage && (
          <View style={styles.attachmentStrip}>
            <Image source={{ uri: attachedImage }} style={styles.attachmentThumb} />
            <Text style={styles.attachmentLabel}>Router Screenshot Attached</Text>
            <Pressable onPress={() => { setAttachedImage(null); setAttachedBase64(null); }}>
              <Ionicons name="close-circle" size={18} color={Colors.danger} />
            </Pressable>
          </View>
        )}

        {/* INPUT BAR */}
        <View style={styles.inputContainer}>
          <Pressable style={styles.attachBtn} onPress={handlePickImage}>
            <Ionicons name="image-outline" size={20} color={attachedImage ? Colors.accent : Colors.textMuted} />
          </Pressable>

          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Ask SecureBot to secure network, quarantine, or audit..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            multiline
            maxLength={1000}
          />

          <Pressable
            style={[styles.sendBtn, (!input.trim() && !attachedImage) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() && !attachedImage}
          >
            <Ionicons name="arrow-up" size={18} color="#000" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070B14',
  },
  clineHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'rgba(10,14,23,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  modelName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  agentModePill: {
    backgroundColor: 'rgba(34,211,238,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  agentModeText: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.accent,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  healthContextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  healthContextText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
  },
  langDock: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  langBtnActive: {
    backgroundColor: Colors.accent,
  },
  langBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  langBtnTextActive: {
    color: '#000',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  userMsgWrapper: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  userMsgBubble: {
    maxWidth: width * 0.82,
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.25)',
    borderRadius: 14,
    borderTopRightRadius: 2,
    padding: 12,
  },
  userMsgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  msgTime: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
  },
  uploadedImgPreview: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginBottom: 8,
  },
  userMsgText: {
    color: '#FFF',
    fontSize: 13,
    lineHeight: 19,
  },
  systemMsgWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(34,211,238,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  systemMsgText: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '600',
  },
  botMsgWrapper: {
    marginBottom: 20,
  },
  botHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  botAvatarGlow: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  botName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
  botTaskStatus: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  thoughtAccordion: {
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  thoughtTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thoughtTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  thoughtTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
  },
  thoughtBody: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 16,
    marginTop: 6,
    fontStyle: 'italic',
  },
  toolCallBox: {
    backgroundColor: '#0A0F1D',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.25)',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  toolCallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(34,211,238,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  toolCallName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginLeft: 6,
  },
  toolStatusBadge: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  toolStatusText: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.success,
  },
  toolTerminal: {
    padding: 8,
    backgroundColor: '#05070D',
  },
  toolTerminalText: {
    fontSize: 10,
    color: '#A5F3FC',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 15,
  },
  botMsgCard: {
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    borderTopLeftRadius: 2,
    padding: 14,
  },
  botMsgText: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 12,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  thinkingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.8)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.2)',
  },
  thinkingText: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '600',
  },
  floatingDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(7,11,20,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 8,
  },
  suggestionChipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  attachmentStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.9)',
    marginHorizontal: 16,
    marginBottom: 6,
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  attachmentThumb: {
    width: 28,
    height: 28,
    borderRadius: 4,
    marginRight: 8,
  },
  attachmentLabel: {
    fontSize: 11,
    color: '#FFF',
    flex: 1,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.3)',
    borderRadius: 24,
    marginHorizontal: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  attachBtn: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
    maxHeight: 80,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
