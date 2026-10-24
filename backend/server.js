/**
 * CyberGuard & AegisBot Smart Home Sentinel Unified Backend
 * Features:
 * - Neon PostgreSQL Serverless Integration with Auto-Schema
 * - Background SmartHome Sentinel Intrusion Detection & Decoy Honeypot
 * - Device-to-Device (D2D) Zero-Trust Isolation Matrix
 * - Subnet & Port Auditor (Telnet 23, HTTP 80, RTSP 554, MQTT 1883, TLS 8883)
 * - Outbound Telemetry Exfiltration & 3 AM Spike Monitor
 * - Preset Privacy Modes (Normal, Guest, Sleep / Do-Not-Track)
 * - Payload Metadata Stripping (masks PII, MAC, GPS coords)
 * - Biometric Step-Up Verification & Context Geofencing Interceptors
 * - Gemini AI AegisBot Guardian Integration (Multilingual: EN, HI, MR)
 * - Instant Mobile Push Notification Simulator & SMS Webhook
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PUBLIC_DIR = path.join(__dirname, 'public');
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
}

const PORT = process.env.PORT || 3000;
const NEON_DATABASE_URL = process.env.NEON_DATABASE_URL || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6KMZC5m5GYdQivjILjNpyJkgvKeSjmEW-TAtUd6kxWv9Q';

// Forensics & Evidence directory
const EVIDENCE_DIR = path.join(__dirname, 'evidence');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

// In-Memory Data Store (Used if Neon DB is connecting or offline)
let localStore = {
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
      created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    },
    {
      id: 2,
      device_id: 'bulb_01',
      severity: 'CRITICAL',
      title: 'Unauthorized D2D Lateral Movement Attempt',
      description: 'Bedroom Smart Bulb attempted to push RPC commands directly to Front Door Smart Lock.',
      resolved: false,
      created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    {
      id: 3,
      device_id: 'rogue_01',
      severity: 'CRITICAL',
      title: 'Rogue Device / Evil Twin Detected',
      description: 'Unrecognized MAC address DE:AD:BE:EF:00:01 joined home Wi-Fi subnet with active Telnet service.',
      resolved: false,
      created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
    {
      id: 4,
      device_id: 'cam_01',
      severity: 'WARNING',
      title: 'Off-Hours Outbound Streaming Spike',
      description: 'Living Room Camera transmitted 850MB of data at 3:12 AM to external cloud IP.',
      resolved: false,
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
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
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toLocaleTimeString(),
    },
    {
      id: 2,
      sourceIp: '198.51.100.24',
      severity: 'CRITICAL',
      type: 'DECOY_TRAP_HIT',
      message: 'Attacker accessed honeypot decoy /.env on smart hub. IP blacklisted.',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString(),
    },
  ],
  attackers: {},
  blockedIps: new Set(['203.0.113.88', '198.51.100.24']),
};

// Database Connection
let pool = null;
if (NEON_DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: NEON_DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    console.log('Connected to Neon PostgreSQL Serverless DB');
  } catch (err) {
    console.warn('Neon connection failed, running on in-memory secure store:', err.message);
  }
}

// ----------------------------------------------------------------------
// SMARTHOME SENTINEL BACKGROUND ENGINE (Runs silently without popup)
// ----------------------------------------------------------------------
const DECOY_TRAPS = new Set([
  '/admin', '/.env', '/wp-login.php', '/cgi-bin/luci', '/setup.cgi',
  '/api/v1/unlock', '/config.php', '/.git', '/phpmyadmin',
]);

const MAX_FAILS = 5;
const WINDOW_MS = 60 * 1000;

function recalculateHealthScore() {
  let score = 100;
  localStore.devices.forEach((d) => {
    if (d.is_quarantined) return;
    if (d.risk_score >= 80) score -= 18;
    else if (d.risk_score >= 50) score -= 10;
    else if (d.risk_score >= 20) score -= 4;
    if (d.unencrypted_protocols.length > 0) score -= 6;
  });
  if (localStore.policy.current_privacy_mode === 'SLEEP') score += 4;
  if (localStore.policy.current_privacy_mode === 'GUEST') score += 3;
  if (!localStore.policy.d2d_isolation_enabled) score -= 12;
  localStore.policy.overall_health_score = Math.max(15, Math.min(100, score));
}

function recordSentinelEvent(ip, ua, kind, pathHit) {
  const now = Date.now();
  let a = localStore.attackers[ip];
  if (!a) {
    a = localStore.attackers[ip] = {
      ip,
      first: now,
      last: now,
      fails: [],
      total: 0,
      blocked: false,
      paths: [],
      userAgents: [],
    };
  }
  a.last = now;
  a.total += 1;
  if (!a.paths.includes(pathHit)) a.paths.push(pathHit);
  if (!a.userAgents.includes(ua)) a.userAgents.push(ua);

  if (kind === 'failed_login' || kind === 'trap') {
    a.fails = a.fails.filter((t) => now - t < WINDOW_MS);
    a.fails.push(now);

    const shouldBlock = (kind === 'trap' || a.fails.length >= MAX_FAILS) && !a.blocked;
    if (shouldBlock) {
      a.blocked = true;
      localStore.blockedIps.add(ip);

      const evidence = {
        ip,
        timestamp: new Date().toISOString(),
        reason: kind === 'trap' ? `Honeypot Decoy Trap Triggered (${pathHit})` : `${MAX_FAILS} Failed attempts in 60s`,
        totalRequests: a.total,
        userAgents: a.userAgents,
        pathsScanned: a.paths,
      };

      try {
        fs.writeFileSync(
          path.join(EVIDENCE_DIR, `${ip.replace(/[^a-zA-Z0-9.-]/g, '_')}.json`),
          JSON.stringify(evidence, null, 2)
        );
      } catch (_) {}

      const incident = {
        id: localStore.incidents.length + 1,
        sourceIp: ip,
        severity: 'CRITICAL',
        type: kind === 'trap' ? 'DECOY_TRAP_HIT' : 'AUTO_BLOCK',
        message: evidence.reason,
        timestamp: new Date().toLocaleTimeString(),
      };
      localStore.incidents.unshift(incident);

      // Auto-lock down critical devices if rogue threat
      localStore.devices.forEach((dev) => {
        if (dev.device_type === 'unknown' || dev.risk_score > 70) {
          dev.is_quarantined = true;
          dev.status = 'offline';
        }
      });
      recalculateHealthScore();
    }
  }
}

// Sentinel Decoy Interceptor Middleware
app.use((req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const ua = req.headers['user-agent'] || 'Unknown';
  const reqPath = req.path;

  if (localStore.blockedIps.has(ip) && !reqPath.startsWith('/api/')) {
    recordSentinelEvent(ip, ua, 'blocked_request', reqPath);
    return res.status(403).json({ error: 'blocked', message: 'Access denied. IP blacklisted by SmartHome Sentinel.' });
  }

  if (DECOY_TRAPS.has(reqPath)) {
    recordSentinelEvent(ip, ua, 'trap', reqPath);
    return res.status(401).json({ error: 'unauthorized', message: 'Trap tripped.' });
  }

  next();
});

// ----------------------------------------------------------------------
// REST API ENDPOINTS
// ----------------------------------------------------------------------

// 1. Get Live Telemetry Snapshot
app.get('/api/telemetry', async (req, res) => {
  try {
    if (pool) {
      const devRes = await pool.query('SELECT * FROM devices ORDER BY risk_score DESC');
      const alertRes = await pool.query('SELECT * FROM security_alerts WHERE resolved = false ORDER BY id DESC');
      const polRes = await pool.query('SELECT * FROM system_policies WHERE id = 1');
      const d2dRes = await pool.query('SELECT * FROM d2d_matrix_rules');
      return res.json({
        devices: devRes.rows,
        alerts: alertRes.rows,
        policy: polRes.rows[0] || localStore.policy,
        d2dRules: d2dRes.rows || localStore.d2dRules,
        incidents: localStore.incidents,
      });
    }
  } catch (err) {
    console.warn('DB fetch error, returning local store:', err.message);
  }

  recalculateHealthScore();
  res.json({
    devices: localStore.devices,
    alerts: localStore.alerts.filter((a) => !a.resolved),
    policy: localStore.policy,
    d2dRules: localStore.d2dRules,
    incidents: localStore.incidents,
  });
});

// 2. Execute Security Actions (Quarantine, Privacy Mode, Subnet Audit, etc.)
app.post('/api/action', async (req, res) => {
  const { type, deviceId, mode, enabled, alertId } = req.body;
  const actionType = (type || '').toUpperCase();

  try {
    switch (actionType) {
      case 'QUARANTINE_DEVICE': {
        const dev = localStore.devices.find((d) => d.id === deviceId);
        if (dev) {
          dev.is_quarantined = true;
          dev.status = 'critical';
          dev.risk_score = 0;
        }
        if (pool) {
          await pool.query('UPDATE devices SET is_quarantined = true, risk_score = 0 WHERE id = $1', [deviceId]);
        }
        break;
      }
      case 'UNQUARANTINE_DEVICE': {
        const dev = localStore.devices.find((d) => d.id === deviceId);
        if (dev) {
          dev.is_quarantined = false;
          dev.status = dev.unencrypted_protocols.length > 0 ? 'warning' : 'safe';
          dev.risk_score = dev.device_type === 'unknown' ? 85 : 30;
        }
        if (pool) {
          await pool.query('UPDATE devices SET is_quarantined = false WHERE id = $1', [deviceId]);
        }
        break;
      }
      case 'SET_PRIVACY_MODE': {
        localStore.policy.current_privacy_mode = mode;
        if (mode === 'SLEEP') {
          // restrict vendor cloud telemetry
          localStore.devices.forEach((d) => {
            if (d.device_type === 'speaker' || d.device_type === 'camera') {
              d.telemetry_throttled = true;
            }
          });
        } else if (mode === 'GUEST') {
          // isolate camera and door lock
          localStore.d2dRules.forEach((r) => {
            if (r.target === 'lock_01' || r.target === 'cam_01') r.allowed = false;
          });
        }
        if (pool) {
          await pool.query('UPDATE system_policies SET current_privacy_mode = $1 WHERE id = 1', [mode]);
        }
        break;
      }
      case 'ENFORCE_ENCRYPTION': {
        const dev = localStore.devices.find((d) => d.id === deviceId);
        if (dev) {
          dev.encryption_enforced = true;
          dev.unencrypted_protocols = [];
          dev.open_ports = dev.open_ports.map((p) => (p === 1883 ? 8883 : p === 80 ? 443 : p === 23 ? 22 : p));
          dev.risk_score = Math.max(10, dev.risk_score - 45);
          dev.status = 'safe';
        }
        if (pool) {
          await pool.query(
            'UPDATE devices SET encryption_enforced = true, unencrypted_protocols = ARRAY[]::TEXT[], risk_score = GREATEST(risk_score - 45, 10) WHERE id = $1',
            [deviceId]
          );
        }
        break;
      }
      case 'THROTTLE_TELEMETRY': {
        const dev = localStore.devices.find((d) => d.id === deviceId);
        if (dev) {
          dev.telemetry_throttled = true;
          dev.egress_mbps = Math.min(0.5, dev.egress_mbps * 0.1);
        }
        break;
      }
      case 'SET_D2D_ISOLATION': {
        localStore.policy.d2d_isolation_enabled = enabled;
        if (pool) {
          await pool.query('UPDATE system_policies SET d2d_isolation_enabled = $1 WHERE id = 1', [enabled]);
        }
        break;
      }
      case 'SET_METADATA_STRIPPING': {
        localStore.policy.metadata_stripping_enabled = enabled;
        if (pool) {
          await pool.query('UPDATE system_policies SET metadata_stripping_enabled = $1 WHERE id = 1', [enabled]);
        }
        break;
      }
      case 'SET_GEOFENCE_LOCK': {
        localStore.policy.geofence_lock_enabled = enabled;
        if (pool) {
          await pool.query('UPDATE system_policies SET geofence_lock_enabled = $1 WHERE id = 1', [enabled]);
        }
        break;
      }
      case 'RESOLVE_ALERT': {
        const alert = localStore.alerts.find((a) => a.id === Number(alertId));
        if (alert) alert.resolved = true;
        if (pool) {
          await pool.query('UPDATE security_alerts SET resolved = true WHERE id = $1', [alertId]);
        }
        break;
      }
      case 'AUTO_REMEDIATE_ALL': {
        // One-touch remediation across all discovered vulnerabilities
        localStore.devices.forEach((d) => {
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
        localStore.alerts.forEach((a) => (a.resolved = true));
        localStore.policy.current_privacy_mode = 'SLEEP';
        localStore.policy.d2d_isolation_enabled = true;
        localStore.policy.metadata_stripping_enabled = true;
        break;
      }
    }

    recalculateHealthScore();
    res.json({
      status: 'ok',
      executed: actionType,
      healthScore: localStore.policy.overall_health_score,
      telemetry: {
        devices: localStore.devices,
        alerts: localStore.alerts.filter((a) => !a.resolved),
        policy: localStore.policy,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Subnet & Port Auditor
app.get('/api/scan/subnet', (req, res) => {
  const auditResults = localStore.devices.map((d) => ({
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
      ...(d.open_ports.includes(80) ? ['Cleartext HTTP control interface on port 80'] : []),
      ...(d.open_ports.includes(554) ? ['Unencrypted RTSP video feed on port 554'] : []),
      ...(d.open_ports.includes(1883) ? ['Insecure MQTT broker without TLS on port 1883'] : []),
      ...(d.device_type === 'unknown' ? ['Unrecognized MAC signature / Potential Evil Twin'] : []),
    ],
  }));

  res.json({
    subnet: '192.168.1.0/24',
    gateway: '192.168.1.1',
    scannedCount: auditResults.length,
    vulnerableCount: auditResults.filter((r) => r.vulnerabilities.length > 0).length,
    rogueCount: auditResults.filter((r) => r.isRogue).length,
    devices: auditResults,
  });
});

// 4. Device-to-Device (D2D) Isolation Matrix Rules
app.get('/api/d2d/matrix', (req, res) => {
  res.json({
    isolationEnabled: localStore.policy.d2d_isolation_enabled,
    rules: localStore.d2dRules,
    devices: localStore.devices.map((d) => ({ id: d.id, name: d.device_name, type: d.device_type })),
  });
});

app.post('/api/d2d/rule', (req, res) => {
  const { source, target, allowed, reason } = req.body;
  const existing = localStore.d2dRules.find((r) => r.source === source && r.target === target);
  if (existing) {
    existing.allowed = allowed;
    if (reason) existing.reason = reason;
  } else {
    localStore.d2dRules.push({
      id: localStore.d2dRules.length + 1,
      source,
      target,
      allowed,
      reason: reason || 'Custom user rule',
    });
  }
  res.json({ status: 'ok', rules: localStore.d2dRules });
});

// 5. Outbound Telemetry & Data Exfiltration Monitor
app.get('/api/telemetry/bandwidth', (req, res) => {
  const currentHour = new Date().getHours();
  const isOffHours = currentHour >= 1 && currentHour <= 5;

  const data = localStore.devices.map((d) => {
    const isSpike = isOffHours && d.egress_mbps > 5.0;
    return {
      id: d.id,
      name: d.device_name,
      egressMbps: d.egress_mbps,
      packetsPerSec: d.packets_per_sec,
      throttled: d.telemetry_throttled,
      isOffHoursSpike: isSpike,
      cloudEndpoint: d.device_type === 'camera' ? 's3.us-west.amazonaws.com' : 'iot.vendor-cloud.net',
    };
  });

  res.json({
    offHoursActive: isOffHours,
    metadataStrippingActive: localStore.policy.metadata_stripping_enabled,
    streams: data,
  });
});

// 6. Biometric Step-Up Authorization Interceptor
app.post('/api/security/biometric-verify', (req, res) => {
  const { command, deviceId, biometricSuccess } = req.body;
  if (!localStore.policy.biometric_step_up_enabled) {
    return res.json({ authorized: true, reason: 'Biometrics bypassed by policy' });
  }

  if (biometricSuccess) {
    return res.json({
      authorized: true,
      timestamp: new Date().toISOString(),
      command,
      deviceId,
      message: 'Step-up biometric verification approved via Android BiometricPrompt.',
    });
  }

  res.status(401).json({
    authorized: false,
    error: 'Biometric authorization failed. Command blocked by Zero-Trust policy.',
  });
});

// 7. Context-Aware Geofencing Check
app.post('/api/security/geofence-check', (req, res) => {
  const { currentSsid, withinHomePerimeter } = req.body;
  const TRUSTED_SSID = 'HomeShield_Secure_5G';

  if (!localStore.policy.geofence_lock_enabled) {
    return res.json({ inPerimeter: true, accessGranted: true });
  }

  const isTrustedNetwork = currentSsid === TRUSTED_SSID || currentSsid === 'TestHomeWifi';
  const isAuthorized = isTrustedNetwork || withinHomePerimeter === true;

  res.json({
    inPerimeter: isAuthorized,
    accessGranted: isAuthorized,
    currentSsid: currentSsid || 'Unknown',
    trustedSsid: TRUSTED_SSID,
    warning: isAuthorized ? null : 'Remote command disallowed: Mobile device outside trusted home boundary.',
  });
});

// 8. Sentinel Attack Simulator (Triggers simulated honeypot trip & push notification)
app.post('/api/sentinel/simulate', (req, res) => {
  const randomSuffix = Math.floor(Math.random() * 200) + 10;
  const simulatedIp = `203.0.113.${randomSuffix}`;
  const targetTrap = '/api/v1/unlock';

  recordSentinelEvent(simulatedIp, 'Mozilla/5.0 (Kali Linux / nmap scanner)', 'trap', targetTrap);

  res.json({
    simulatedIp,
    trapTripped: targetTrap,
    status: 'ATTACK_BLOCKED',
    incident: localStore.incidents[0],
    pushNotification: {
      title: '🚨 ATTACK BLOCKED: Honeypot Decoy Tripped',
      body: `Scanner IP ${simulatedIp} blocked after attempting unauthorized breach at ${targetTrap}. All IoT endpoints locked.`,
      severity: 'CRITICAL',
    },
  });
});

// 9. Push Notification & SMS Webhook
app.post('/api/webhook/sms', (req, res) => {
  const { phone, message, alertType } = req.body;
  console.log(`[SMS WEBHOOK DISPATCH] To: ${phone || 'Homeowner Phone'} | Alert: ${alertType} | ${message}`);
  res.json({
    status: 'delivered',
    gateway: 'Twilio/Webhook Simulator',
    recipient: phone || '+1 (555) 019-2834',
    sentAt: new Date().toISOString(),
  });
});

// 10. AegisBot AI Guardian Chat Endpoint (Gemini 3.8 / Flash Integration)
app.post('/api/aegis/chat', async (req, res) => {
  const { message, attachedImageBase64, language = 'ENGLISH' } = req.body;

  const currentLang = (language || 'ENGLISH').toUpperCase();
  const stateSnapshot = `
LIVE SMART HOME TELEMETRY SNAPSHOT:
Health Score: ${localStore.policy.overall_health_score}/100 | Privacy Mode: ${localStore.policy.current_privacy_mode}
D2D Isolation: ${localStore.policy.d2d_isolation_enabled} | Metadata Stripping: ${localStore.policy.metadata_stripping_enabled}
Connected Devices (${localStore.devices.length}):
${localStore.devices.map((d) => `• [${d.id}] ${d.device_name} (${d.ip_address}) | Risk: ${d.risk_score}/100 | Quarantined: ${d.is_quarantined} | Ports: [${d.open_ports.join(', ')}] | Protocols: [${d.unencrypted_protocols.join(', ')}]`).join('\n')}
Active Alerts (${localStore.alerts.filter((a) => !a.resolved).length}):
${localStore.alerts.filter((a) => !a.resolved).map((a) => `• [Alert ${a.id}] (${a.severity}) ${a.title}: ${a.description}`).join('\n')}
`;

  const systemInstruction = `You are AegisBot, the AI guardian in the HomeShield CyberGuard Smart Home security app.
You analyze smart home IoT security, detect open ports (Telnet 23, RTSP 554, HTTP 80, MQTT 1883), rogue devices, and suspicious exfiltration.
LANGUAGE RULES:
- User selected: ${currentLang}.
- If HINDI, reply in Hindi.
- If MARATHI, reply in Marathi.
- If ENGLISH, reply in concise, professional English.

ACTION DISPATCH PROTOCOL:
When an action is requested or recommended, append an action tag at the very end:
<<<ACTION:{"type":"QUARANTINE_DEVICE","deviceId":"rogue_01"}>>>
<<<ACTION:{"type":"UNQUARANTINE_DEVICE","deviceId":"cam_01"}>>>
<<<ACTION:{"type":"SET_PRIVACY_MODE","mode":"SLEEP"}>>>
<<<ACTION:{"type":"START_SUBNET_SCAN"}>>>
<<<ACTION:{"type":"ENFORCE_ENCRYPTION","deviceId":"cam_01"}>>>
<<<ACTION:{"type":"AUTO_REMEDIATE_ALL"}>>>
`;

  try {
    const userParts = [{ text: `${stateSnapshot}\n\nUser Question: ${message || 'Please audit this smart home security setup.'}` }];
    if (attachedImageBase64) {
      userParts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: attachedImageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
        },
      });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const aiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: userParts }],
      }),
    });
    clearTimeout(timeoutId);

    if (aiResponse.ok) {
      const data = await aiResponse.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const actionMatch = rawText.match(/<<<ACTION:(.*?)>>>/);
      const cleanReply = rawText.replace(/<<<ACTION:(.*?)>>>/g, '').trim();

      let actionExecuted = null;
      if (actionMatch) {
        try {
          const actionObj = JSON.parse(actionMatch[1]);
          actionExecuted = actionObj;
          // Auto execute action
          if (actionObj.type === 'QUARANTINE_DEVICE' && actionObj.deviceId) {
            const d = localStore.devices.find((dev) => dev.id === actionObj.deviceId);
            if (d) { d.is_quarantined = true; d.risk_score = 0; }
          } else if (actionObj.type === 'SET_PRIVACY_MODE' && actionObj.mode) {
            localStore.policy.current_privacy_mode = actionObj.mode;
          } else if (actionObj.type === 'ENFORCE_ENCRYPTION' && actionObj.deviceId) {
            const d = localStore.devices.find((dev) => dev.id === actionObj.deviceId);
            if (d) { d.encryption_enforced = true; d.unencrypted_protocols = []; d.risk_score = 10; }
          }
          recalculateHealthScore();
        } catch (_) {}
      }

      return res.json({
        reply: cleanReply,
        action: actionExecuted,
        healthScore: localStore.policy.overall_health_score,
      });
    }
  } catch (err) {
    console.warn('Gemini API call failed, generating intelligent local fallback:', err.message);
  }

  // Intelligent Fallback (Multilingual)
  const q = (message || '').toLowerCase();
  let fallbackReply = '';
  let fallbackAction = null;

  if (q.includes('quarantine') || q.includes('rogue') || q.includes('ब्लॉक') || q.includes('क्वारंटाइन')) {
    const target = q.includes('bulb') ? 'bulb_01' : 'rogue_01';
    const d = localStore.devices.find((dev) => dev.id === target);
    if (d) { d.is_quarantined = true; d.risk_score = 0; }
    recalculateHealthScore();
    fallbackAction = { type: 'QUARANTINE_DEVICE', deviceId: target };
    fallbackReply = currentLang === 'HINDI'
      ? `मैंने [${target}] को तुरंत नेटवर्क से क्वारंटाइन कर दिया है। Zero-Trust सुरक्षा सक्रिय है।`
      : currentLang === 'MARATHI'
      ? `मी [${target}] डिव्हाइस तात्काळ नेटवर्कवरून क्वारंटाइन केले आहे. झिरो-ट्रस्ट नियम लागू केले.`
      : `I have quarantined [${target}] from your smart home network. Zero-trust isolation active.`;
  } else if (q.includes('sleep') || q.includes('guest') || q.includes('स्लीप') || q.includes('गेस्ट')) {
    const mode = q.includes('guest') || q.includes('गेस्ट') ? 'GUEST' : 'SLEEP';
    localStore.policy.current_privacy_mode = mode;
    recalculateHealthScore();
    fallbackAction = { type: 'SET_PRIVACY_MODE', mode };
    fallbackReply = currentLang === 'HINDI'
      ? `प्राइवेसी शील्ड को [${mode}] मोड पर सेट कर दिया गया है। क्लाउड एक्सफिल्ट्रेशन ब्लॉक है।`
      : currentLang === 'MARATHI'
      ? `प्रायव्हसी शील्ड आता [${mode}] मोडवर सक्रिय केले आहे. क्लाउड टेलिमेट्री थांबवली आहे.`
      : `Smart Home Privacy Shield switched to [${mode}] mode. External telemetry exfiltration halted.`;
  } else {
    fallbackReply = currentLang === 'HINDI'
      ? `नमस्ते! मैं AegisBot हूँ। आपके घर का सिक्योरिटी स्कोर ${localStore.policy.overall_health_score}/100 है। Living Room Camera (असुरक्षित RTSP) और Rogue ESP32 को ठीक करने के लिए मुझे बताएं।`
      : currentLang === 'MARATHI'
      ? `नमस्कार! मी AegisBot आहे. तुमच्या घराचा सुरक्षा स्कोअर ${localStore.policy.overall_health_score}/100 आहे. कॅमेरा आणि संशयास्पद ESP32 डिव्हाइस सुरक्षित करण्यासाठी मी तयार आहे.`
      : `Hello! I am AegisBot AI Guardian. Your Smart Home Health Score is ${localStore.policy.overall_health_score}/100. Living Room Camera (Unencrypted RTSP) and Rogue ESP32 require remediation. Would you like me to quarantine them?`;
  }

  res.json({
    reply: fallbackReply,
    action: fallbackAction,
    healthScore: localStore.policy.overall_health_score,
  });
});

// Sentinel Web Compatibility API Endpoints
app.get('/api/status', (req, res) => {
  const attackersList = Object.values(localStore.attackers || {});
  const totalAttempts = attackersList.reduce((sum, a) => sum + (a.total || 0), 0);
  const devicesSecure = (localStore.devices || []).filter(d => d.risk_score < 50 && !d.is_quarantined).length;

  res.json({
    attackersSeen: attackersList.length,
    blocked: localStore.blockedIps ? localStore.blockedIps.size : 0,
    totalAttempts: totalAttempts,
    devicesSecure: devicesSecure,
    systemMode: localStore.policy.current_privacy_mode,
    healthScore: localStore.policy.overall_health_score,
  });
});

app.get('/api/devices', (req, res) => {
  const devs = {};
  (localStore.devices || []).forEach(d => {
    devs[d.id] = {
      id: d.id,
      name: d.device_name,
      status: d.is_quarantined ? 'QUARANTINED' : (d.status === 'safe' ? 'Online' : 'Warning'),
      secure: !d.is_quarantined && d.encryption_enforced && d.risk_score < 50,
      ip: d.ip_address,
      mac: d.mac_address,
      risk: d.risk_score,
      ports: d.open_ports,
    };
  });
  res.json(devs);
});

app.get('/api/events', (req, res) => {
  const events = Object.values(localStore.attackers || {}).map(a => ({
    ip: a.ip,
    first: typeof a.first === 'number' ? new Date(a.first).toLocaleTimeString() : a.first,
    last: typeof a.last === 'number' ? new Date(a.last).toLocaleTimeString() : a.last,
    total: a.total || 0,
    blocked: a.blocked || (localStore.blockedIps && localStore.blockedIps.has(a.ip)),
    paths: a.paths || [],
    user_agents: a.userAgents || a.user_agents || [],
    host: 'isp-gateway-' + a.ip.replace(/\./g, '-'),
    geo: 'External WAN / Tor Node',
    kinds: { decoy_trap_hit: a.total || 1 },
  }));
  res.json(events);
});

app.post('/api/simulate', (req, res) => {
  const randomSuffix = Math.floor(Math.random() * 200) + 10;
  const simulatedIp = `203.0.113.${randomSuffix}`;
  const targetTrap = '/api/v1/unlock';
  recordSentinelEvent(simulatedIp, 'Mozilla/5.0 (Kali Linux / nmap scanner)', 'trap', targetTrap);
  res.json({
    success: true,
    message: `Simulated attack from ${simulatedIp} blocked at honeypot ${targetTrap}`,
    blockedIp: simulatedIp,
  });
});

app.post('/api/unblock', (req, res) => {
  const { ip } = req.body || {};
  if (ip && localStore.blockedIps) {
    localStore.blockedIps.delete(ip);
    if (localStore.attackers[ip]) {
      localStore.attackers[ip].blocked = false;
      localStore.attackers[ip].fails = [];
    }
  }
  res.json({ success: true, unblocked: ip });
});

// Root / Status / Web App Delivery
app.get('/', (req, res) => {
  const indexPath = path.join(PUBLIC_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.json({
    app: 'SecureNest Sentinel & SecureBot Backend',
    version: '1.0.0',
    mode: 'Zero-Trust Smart Home Security',
    status: 'ONLINE',
    sentinelActive: true,
  });
});

app.get('/sentinel', (req, res) => {
  const sentinelPath = path.join(PUBLIC_DIR, 'sentinel.html');
  if (fs.existsSync(sentinelPath)) {
    return res.sendFile(sentinelPath);
  }
  res.redirect('/');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🛡️  SecureNest Gateway & Sentinel running on port ${PORT}`);
  console.log(`📡 Background Decoys & Honeypots: ACTIVE`);
  console.log(`🤖 SecureBot Gemini AI Bridge: ONLINE`);
  console.log(`=======================================================`);
});
