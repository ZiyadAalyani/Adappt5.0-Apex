/**
 * CyberGuard API Service
 * Connects React Native Expo frontend to the CyberGuard Sentinel & AegisBot Node.js backend.
 * Includes graceful offline fallback simulation so all features work in any environment.
 */

export interface SmartDevice {
  id: string;
  device_name: string;
  ip_address: string;
  mac_address: string;
  device_type: 'camera' | 'lock' | 'light' | 'speaker' | 'thermostat' | 'unknown' | 'hub';
  risk_score: number;
  is_quarantined: boolean;
  encryption_enforced: boolean;
  telemetry_throttled?: boolean;
  open_ports: number[];
  unencrypted_protocols: string[];
  egress_mbps?: number;
  packets_per_sec?: number;
  status: 'safe' | 'warning' | 'critical' | 'offline';
}

export interface SecurityAlert {
  id: number;
  device_id: string;
  severity: 'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  resolved: boolean;
  created_at: string;
}

export interface SystemPolicy {
  id: number;
  current_privacy_mode: 'NORMAL' | 'GUEST' | 'SLEEP';
  d2d_isolation_enabled: boolean;
  metadata_stripping_enabled: boolean;
  biometric_step_up_enabled: boolean;
  geofence_lock_enabled: boolean;
  auto_block_unknown_devices: boolean;
  overall_health_score: number;
}

export interface D2DRule {
  id: number;
  source: string;
  target: string;
  allowed: boolean;
  reason?: string;
}

export interface SentinelIncident {
  id: number;
  sourceIp: string;
  severity: string;
  type: string;
  message: string;
  timestamp: string;
}

export interface TelemetryState {
  devices: SmartDevice[];
  alerts: SecurityAlert[];
  policy: SystemPolicy;
  d2dRules: D2DRule[];
  incidents: SentinelIncident[];
}

let BACKEND_URL = 'http://10.0.2.2:3000'; // Default for Android Emulator; fallback to localhost
let customBackendUrl = '';

export function setBackendUrl(url: string) {
  customBackendUrl = url.trim();
}

export function getBackendUrl(): string {
  if (customBackendUrl) return customBackendUrl;
  // Deployed web build (e.g. Vercel): API lives on the same origin
  if (typeof window !== 'undefined' && window.location && /^https?:$/.test(window.location.protocol)) {
    const h = window.location.hostname;
    if (h !== 'localhost' && h !== '127.0.0.1') return window.location.origin;
  }
  return BACKEND_URL;
}

// Internal State Fallback
let localFallbackState: TelemetryState = {
  policy: {
    id: 1,
    current_privacy_mode: 'NORMAL',
    d2d_isolation_enabled: true,
    metadata_stripping_enabled: true,
    biometric_step_up_enabled: true,
    geofence_lock_enabled: true,
    auto_block_unknown_devices: true,
    overall_health_score: 78,
  },
  devices: [
    {
      id: 'cam_01',
      device_name: 'Living Room Camera',
      ip_address: '192.168.1.105',
      mac_address: 'AA:BB:CC:11:22:33',
      device_type: 'camera',
      risk_score: 75,
      is_quarantined: false,
      encryption_enforced: false,
      telemetry_throttled: false,
      open_ports: [80, 554],
      unencrypted_protocols: ['HTTP', 'RTSP'],
      egress_mbps: 14.8,
      packets_per_sec: 320,
      status: 'warning',
    },
    {
      id: 'lock_01',
      device_name: 'Front Door Smart Lock',
      ip_address: '192.168.1.110',
      mac_address: 'AA:BB:CC:44:55:66',
      device_type: 'lock',
      risk_score: 10,
      is_quarantined: false,
      encryption_enforced: true,
      telemetry_throttled: false,
      open_ports: [8883],
      unencrypted_protocols: [],
      egress_mbps: 0.1,
      packets_per_sec: 5,
      status: 'safe',
    },
    {
      id: 'bulb_01',
      device_name: 'Bedroom Smart Bulb',
      ip_address: '192.168.1.115',
      mac_address: 'AA:BB:CC:77:88:99',
      device_type: 'light',
      risk_score: 55,
      is_quarantined: false,
      encryption_enforced: false,
      telemetry_throttled: false,
      open_ports: [23, 1883],
      unencrypted_protocols: ['Telnet', 'MQTT'],
      egress_mbps: 0.2,
      packets_per_sec: 12,
      status: 'warning',
    },
    {
      id: 'rogue_01',
      device_name: 'Unknown ESP32 Device',
      ip_address: '192.168.1.199',
      mac_address: 'DE:AD:BE:EF:00:01',
      device_type: 'unknown',
      risk_score: 90,
      is_quarantined: false,
      encryption_enforced: false,
      telemetry_throttled: false,
      open_ports: [23, 80],
      unencrypted_protocols: ['Telnet', 'HTTP'],
      egress_mbps: 4.5,
      packets_per_sec: 110,
      status: 'critical',
    },
    {
      id: 'speaker_01',
      device_name: 'Living Room Smart Speaker',
      ip_address: '192.168.1.120',
      mac_address: 'AA:BB:CC:AA:BB:CC',
      device_type: 'speaker',
      risk_score: 35,
      is_quarantined: false,
      encryption_enforced: false,
      telemetry_throttled: false,
      open_ports: [8008, 443],
      unencrypted_protocols: ['HTTP'],
      egress_mbps: 2.1,
      packets_per_sec: 40,
      status: 'safe',
    },
    {
      id: 'thermostat_01',
      device_name: 'Smart Thermostat',
      ip_address: '192.168.1.140',
      mac_address: 'AA:BB:CC:DD:EE:FF',
      device_type: 'thermostat',
      risk_score: 15,
      is_quarantined: false,
      encryption_enforced: true,
      telemetry_throttled: false,
      open_ports: [443],
      unencrypted_protocols: [],
      egress_mbps: 0.05,
      packets_per_sec: 3,
      status: 'safe',
    },
    {
      id: 'garage_01',
      device_name: 'Garage Door Opener',
      ip_address: '192.168.1.130',
      mac_address: 'AA:BB:CC:12:34:56',
      device_type: 'lock',
      risk_score: 12,
      is_quarantined: false,
      encryption_enforced: true,
      telemetry_throttled: false,
      open_ports: [8883],
      unencrypted_protocols: [],
      egress_mbps: 0.08,
      packets_per_sec: 4,
      status: 'safe',
    },
  ],
  alerts: [
    {
      id: 1,
      device_id: 'cam_01',
      severity: 'HIGH',
      title: 'Unencrypted RTSP Video Streaming',
      description: 'Port 554 active. Living Room Camera streams video without TLS encryption.',
      resolved: false,
      created_at: '35m ago',
    },
    {
      id: 2,
      device_id: 'bulb_01',
      severity: 'CRITICAL',
      title: 'Unauthorized D2D Lateral Movement Attempt',
      description: 'Bedroom Smart Bulb attempted to push RPC commands directly to Front Door Smart Lock.',
      resolved: false,
      created_at: '20m ago',
    },
    {
      id: 3,
      device_id: 'rogue_01',
      severity: 'CRITICAL',
      title: 'Rogue Device / Evil Twin Detected',
      description: 'Unrecognized MAC address DE:AD:BE:EF:00:01 joined home Wi-Fi subnet with active Telnet service.',
      resolved: false,
      created_at: '10m ago',
    },
    {
      id: 4,
      device_id: 'cam_01',
      severity: 'WARNING',
      title: 'Off-Hours Outbound Streaming Spike',
      description: 'Living Room Camera transmitted 850MB of data at 3:12 AM to external cloud IP.',
      resolved: false,
      created_at: '5m ago',
    },
  ],
  d2dRules: [
    { id: 1, source: 'bulb_01', target: 'lock_01', allowed: false, reason: 'Zero-Trust: Bulb cannot control Door Lock' },
    { id: 2, source: 'speaker_01', target: 'lock_01', allowed: false, reason: 'Zero-Trust: Speaker isolated from Door Lock' },
    { id: 3, source: 'rogue_01', target: 'cam_01', allowed: false, reason: 'Rogue quarantine isolation' },
    { id: 4, source: 'rogue_01', target: 'lock_01', allowed: false, reason: 'Rogue quarantine isolation' },
    { id: 5, source: 'thermostat_01', target: 'speaker_01', allowed: true, reason: 'Allowed automation' },
    { id: 6, source: 'lock_01', target: 'cam_01', allowed: true, reason: 'Entry snapshot verification' },
  ],
  incidents: [
    {
      id: 1,
      sourceIp: '203.0.113.88',
      severity: 'HIGH',
      type: 'AUTO_BLOCK',
      message: '5 failed login attempts in 60s from 203.0.113.88. Source auto-blocked.',
      timestamp: '14:32:10',
    },
    {
      id: 2,
      sourceIp: '198.51.100.24',
      severity: 'CRITICAL',
      type: 'DECOY_TRAP_HIT',
      message: 'Attacker accessed honeypot decoy /.env on smart hub. IP blacklisted.',
      timestamp: '09:15:44',
    },
  ],
};

function calculateHealthScore() {
  let score = 100;
  localFallbackState.devices.forEach((d) => {
    if (d.is_quarantined) return;
    if (d.risk_score >= 80) score -= 18;
    else if (d.risk_score >= 50) score -= 10;
    else if (d.risk_score >= 20) score -= 4;
    if (d.unencrypted_protocols.length > 0) score -= 6;
  });
  if (localFallbackState.policy.current_privacy_mode === 'SLEEP') score += 4;
  if (localFallbackState.policy.current_privacy_mode === 'GUEST') score += 3;
  if (!localFallbackState.policy.d2d_isolation_enabled) score -= 12;
  localFallbackState.policy.overall_health_score = Math.max(15, Math.min(100, score));
}

// 1. Fetch Telemetry
export async function fetchTelemetry(): Promise<TelemetryState> {
  const urls = [getBackendUrl(), 'http://localhost:3000', 'http://127.0.0.1:3000'];
  for (const base of urls) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${base}/api/telemetry`, { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) {
        const data = await res.json();
        localFallbackState = {
          ...localFallbackState,
          ...data,
          devices: data.devices || localFallbackState.devices,
          alerts: data.alerts || localFallbackState.alerts,
          policy: data.policy || localFallbackState.policy,
          d2dRules: data.d2dRules || localFallbackState.d2dRules,
          incidents: data.incidents || localFallbackState.incidents,
        };
        return localFallbackState;
      }
    } catch (_) {}
  }
  calculateHealthScore();
  return localFallbackState;
}

// 2. Dispatch Action
export async function executeAction(action: {
  type: string;
  deviceId?: string;
  mode?: string;
  enabled?: boolean;
  alertId?: number;
}): Promise<TelemetryState> {
  const actionType = action.type.toUpperCase();

  // Try API first
  try {
    const res = await fetch(`${getBackendUrl()}/api/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.telemetry) {
        localFallbackState = { ...localFallbackState, ...data.telemetry };
        return localFallbackState;
      }
    }
  } catch (_) {}

  // Local fallback execution
  switch (actionType) {
    case 'QUARANTINE_DEVICE': {
      const dev = localFallbackState.devices.find((d) => d.id === action.deviceId);
      if (dev) {
        dev.is_quarantined = true;
        dev.status = 'critical';
        dev.risk_score = 0;
      }
      break;
    }
    case 'UNQUARANTINE_DEVICE': {
      const dev = localFallbackState.devices.find((d) => d.id === action.deviceId);
      if (dev) {
        dev.is_quarantined = false;
        dev.status = dev.unencrypted_protocols.length > 0 ? 'warning' : 'safe';
        dev.risk_score = dev.device_type === 'unknown' ? 85 : 30;
      }
      break;
    }
    case 'SET_PRIVACY_MODE': {
      if (action.mode) {
        localFallbackState.policy.current_privacy_mode = action.mode as any;
      }
      break;
    }
    case 'ENFORCE_ENCRYPTION': {
      const dev = localFallbackState.devices.find((d) => d.id === action.deviceId);
      if (dev) {
        dev.encryption_enforced = true;
        dev.unencrypted_protocols = [];
        dev.open_ports = dev.open_ports.map((p) => (p === 1883 ? 8883 : p === 80 ? 443 : p === 23 ? 22 : p));
        dev.risk_score = Math.max(10, dev.risk_score - 45);
        dev.status = 'safe';
      }
      break;
    }
    case 'SET_D2D_ISOLATION': {
      if (action.enabled !== undefined) {
        localFallbackState.policy.d2d_isolation_enabled = action.enabled;
      }
      break;
    }
    case 'SET_METADATA_STRIPPING': {
      if (action.enabled !== undefined) {
        localFallbackState.policy.metadata_stripping_enabled = action.enabled;
      }
      break;
    }
    case 'RESOLVE_ALERT': {
      const alert = localFallbackState.alerts.find((a) => a.id === action.alertId);
      if (alert) alert.resolved = true;
      break;
    }
    case 'AUTO_REMEDIATE_ALL': {
      localFallbackState.devices.forEach((d) => {
        if (d.id === 'rogue_01') {
          d.is_quarantined = true;
          d.risk_score = 0;
        } else {
          d.encryption_enforced = true;
          d.unencrypted_protocols = [];
          d.risk_score = Math.min(15, d.risk_score);
          d.status = 'safe';
        }
      });
      localFallbackState.alerts.forEach((a) => (a.resolved = true));
      localFallbackState.policy.current_privacy_mode = 'SLEEP';
      break;
    }
  }

  calculateHealthScore();
  return { ...localFallbackState };
}

// 3. Subnet Audit
export async function triggerSubnetScan(): Promise<any> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/scan/subnet`);
    if (res.ok) return await res.json();
  } catch (_) {}

  return {
    subnet: '192.168.1.0/24',
    gateway: '192.168.1.1',
    scannedCount: localFallbackState.devices.length,
    vulnerableCount: 3,
    rogueCount: 1,
    devices: localFallbackState.devices.map((d) => ({
      id: d.id,
      name: d.device_name,
      ip: d.ip_address,
      mac: d.mac_address,
      openPorts: d.open_ports,
      unencryptedProtocols: d.unencrypted_protocols,
      isRogue: d.device_type === 'unknown',
      riskScore: d.risk_score,
      vulnerabilities: [
        ...(d.open_ports.includes(23) ? ['Telnet cleartext shell on port 23'] : []),
        ...(d.open_ports.includes(80) ? ['Cleartext HTTP on port 80'] : []),
        ...(d.open_ports.includes(554) ? ['Unencrypted RTSP stream on port 554'] : []),
        ...(d.open_ports.includes(1883) ? ['Insecure MQTT on port 1883'] : []),
      ],
    })),
  };
}

// 4. D2D Rule Toggle
export async function toggleD2DRule(source: string, target: string, allowed: boolean): Promise<D2DRule[]> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/d2d/rule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, target, allowed }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.rules;
    }
  } catch (_) {}

  const rule = localFallbackState.d2dRules.find((r) => r.source === source && r.target === target);
  if (rule) rule.allowed = allowed;
  return [...localFallbackState.d2dRules];
}

// 5. Bandwidth & Outbound Telemetry
export async function fetchBandwidthTelemetry(): Promise<any> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/telemetry/bandwidth`);
    if (res.ok) return await res.json();
  } catch (_) {}

  return {
    offHoursActive: false,
    metadataStrippingActive: localFallbackState.policy.metadata_stripping_enabled,
    streams: localFallbackState.devices.map((d) => ({
      id: d.id,
      name: d.device_name,
      egressMbps: d.egress_mbps || 0.4,
      packetsPerSec: d.packets_per_sec || 20,
      throttled: d.telemetry_throttled || false,
      isOffHoursSpike: d.id === 'cam_01',
      cloudEndpoint: d.device_type === 'camera' ? 's3.us-west.amazonaws.com' : 'iot.vendor-cloud.net',
    })),
  };
}

// 6. Simulate Attack
export async function simulateAttack(): Promise<any> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/sentinel/simulate`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      if (data.incident) {
        localFallbackState.incidents.unshift(data.incident);
      }
      return data;
    }
  } catch (_) {}

  const randIp = `203.0.113.${Math.floor(Math.random() * 200) + 10}`;
  const inc: SentinelIncident = {
    id: localFallbackState.incidents.length + 1,
    sourceIp: randIp,
    severity: 'CRITICAL',
    type: 'DECOY_TRAP_HIT',
    message: `Honeypot Decoy Trap (/api/v1/unlock) tripped by ${randIp}. Source auto-blocked.`,
    timestamp: new Date().toLocaleTimeString(),
  };
  localFallbackState.incidents.unshift(inc);
  return {
    simulatedIp: randIp,
    trapTripped: '/api/v1/unlock',
    status: 'ATTACK_BLOCKED',
    incident: inc,
    pushNotification: {
      title: '🚨 ATTACK BLOCKED: Decoy Trap Tripped',
      body: `Scanner IP ${randIp} blacklisted after attacking smart door unlock endpoint.`,
      severity: 'CRITICAL',
    },
  };
}

// 7. AegisBot AI Chat
export async function sendAegisChat(
  message: string,
  attachedImageBase64?: string | null,
  language = 'ENGLISH'
): Promise<{ reply: string; action?: any; healthScore?: number }> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/aegis/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, attachedImageBase64, language }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.action) {
        await executeAction(data.action);
      }
      return data;
    }
  } catch (_) {}

  // Direct Gemini 3.5 Flash Lite call fallback if backend is offline
  // Optional direct fallback; set EXPO_PUBLIC_GEMINI_KEY at build time. Left empty by default so no key ships in the bundle.
  const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY || '';
  try {
    if (!GEMINI_KEY) throw new Error('no direct key configured');
    const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_KEY}`;
    const userParts: any[] = [{ text: `Smart Home Security Context: Score ${localFallbackState.policy.overall_health_score}/100. Mode: ${localFallbackState.policy.current_privacy_mode}. Devices: Living Room Camera, Front Door Smart Lock, Bedroom Smart Bulb, Rogue ESP32. User language: ${language}. User says: ${message || 'Audit my smart home.'}` }];
    if (attachedImageBase64) {
      userParts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: attachedImageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
        },
      });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const geminiRes = await fetch(directUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: userParts }],
      }),
    });
    clearTimeout(timer);

    if (geminiRes.ok) {
      const gData = await geminiRes.json();
      const rawText = gData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (rawText) {
        const actionMatch = rawText.match(/<<<ACTION:(.*?)>>>/);
        const cleanReply = rawText.replace(/<<<ACTION:(.*?)>>>/g, '').trim();
        let actionObj = null;
        if (actionMatch) {
          try {
            actionObj = JSON.parse(actionMatch[1]);
            await executeAction(actionObj);
          } catch (_) {}
        }
        return {
          reply: cleanReply,
          action: actionObj,
          healthScore: localFallbackState.policy.overall_health_score,
        };
      }
    }
  } catch (_) {}

  // Local fallback reasoning
  const q = (message || '').toLowerCase();
  const lang = language.toUpperCase();

  if (q.includes('quarantine') || q.includes('rogue') || q.includes('ब्लॉक') || q.includes('क्वारंटाइन')) {
    const target = q.includes('bulb') ? 'bulb_01' : 'rogue_01';
    await executeAction({ type: 'QUARANTINE_DEVICE', deviceId: target });
    return {
      reply: lang === 'HINDI'
        ? `मैंने [${target}] को तुरंत नेटवर्क से क्वारंटाइन कर दिया है। Zero-Trust सुरक्षा सक्रिय है।`
        : lang === 'MARATHI'
        ? `मी [${target}] डिव्हाइस तात्काळ नेटवर्कवरून क्वारंटाइन केले आहे. झिरो-ट्रस्ट नियम लागू केले.`
        : `I have quarantined [${target}] from your smart home network. Zero-trust isolation active.`,
      action: { type: 'QUARANTINE_DEVICE', deviceId: target },
      healthScore: localFallbackState.policy.overall_health_score,
    };
  }

  if (q.includes('sleep') || q.includes('guest') || q.includes('स्लीप') || q.includes('गेस्ट')) {
    const mode = q.includes('guest') || q.includes('गेस्ट') ? 'GUEST' : 'SLEEP';
    await executeAction({ type: 'SET_PRIVACY_MODE', mode });
    return {
      reply: lang === 'HINDI'
        ? `प्राइवेसी शील्ड को [${mode}] मोड पर सेट कर दिया गया है। क्लाउड एक्सफिल्ट्रेशन ब्लॉक है।`
        : lang === 'MARATHI'
        ? `प्रायव्हसी शील्ड आता [${mode}] मोडवर सक्रिय केले आहे. क्लाउड टेलिमेट्री थांबवली आहे.`
        : `Smart Home Privacy Shield switched to [${mode}] mode. External telemetry exfiltration halted.`,
      action: { type: 'SET_PRIVACY_MODE', mode },
      healthScore: localFallbackState.policy.overall_health_score,
    };
  }

  if (attachedImageBase64) {
    return {
      reply: lang === 'HINDI'
        ? `मैंने आपके राउटर स्क्रीनशॉट का विश्लेषण किया है। पोर्ट 554 (RTSP) और पोर्ट 23 (Telnet) खुले हुए हैं। सुरक्षा के लिए मैं इन्हें एन्क्रिप्ट या क्वारंटाइन करने की सलाह देता हूँ।`
        : lang === 'MARATHI'
        ? `मी स्क्रीनशॉटचे विश्लेषण केले आहे. पोर्ट 554 (RTSP) व पोर्ट 23 (Telnet) उघडे आढळले. सुरक्षिततेसाठी हे बंद करणे गरजेचे आहे.`
        : `I analyzed your router screenshot. Exposed ports detected: 554 (Unencrypted RTSP video) and 23 (Cleartext Telnet shell). Recommend initiating protocol encryption and quarantine.`,
      action: { type: 'START_SUBNET_SCAN' },
      healthScore: localFallbackState.policy.overall_health_score,
    };
  }

  return {
    reply: lang === 'HINDI'
      ? `नमस्ते! मैं AegisBot हूँ। आपके घर का सिक्योरिटी स्कोर ${localFallbackState.policy.overall_health_score}/100 है। Living Room Camera (Port 554 RTSP) और Rogue ESP32 को क्वारंटाइन करने के लिए मुझे कहें।`
      : lang === 'MARATHI'
      ? `नमस्कार! मी AegisBot आहे. तुमच्या घराचा सुरक्षा स्कोअर ${localFallbackState.policy.overall_health_score}/100 आहे. कॅमेरा आणि संशयास्पद ESP32 डिव्हाइस सुरक्षित करण्यासाठी मी तयार आहे.`
      : `Hello! I am AegisBot AI Guardian. Your Smart Home Health Score is ${localFallbackState.policy.overall_health_score}/100. Living Room Camera (Unencrypted RTSP) and Rogue ESP32 require remediation. Would you like me to quarantine them?`,
    healthScore: localFallbackState.policy.overall_health_score,
  };
}
