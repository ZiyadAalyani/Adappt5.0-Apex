-- Neon PostgreSQL Schema for CyberGuard & AegisBot
-- Run this directly in the Neon SQL Console

CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(50) PRIMARY KEY,
    device_name VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    mac_address VARCHAR(17) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    risk_score INT DEFAULT 0,
    is_quarantined BOOLEAN DEFAULT FALSE,
    encryption_enforced BOOLEAN DEFAULT FALSE,
    telemetry_throttled BOOLEAN DEFAULT FALSE,
    open_ports INT[] DEFAULT '{}',
    unencrypted_protocols TEXT[] DEFAULT '{}',
    egress_mbps NUMERIC(5,2) DEFAULT 0.5,
    packets_per_sec INT DEFAULT 45,
    status VARCHAR(20) DEFAULT 'safe',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_alerts (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(id) ON DELETE CASCADE,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_policies (
    id INT PRIMARY KEY DEFAULT 1,
    current_privacy_mode VARCHAR(20) DEFAULT 'NORMAL',
    d2d_isolation_enabled BOOLEAN DEFAULT TRUE,
    metadata_stripping_enabled BOOLEAN DEFAULT TRUE,
    biometric_step_up_enabled BOOLEAN DEFAULT TRUE,
    geofence_lock_enabled BOOLEAN DEFAULT TRUE,
    auto_block_unknown_devices BOOLEAN DEFAULT TRUE,
    overall_health_score INT DEFAULT 78
);

CREATE TABLE IF NOT EXISTS d2d_matrix_rules (
    id SERIAL PRIMARY KEY,
    source_device_id VARCHAR(50) NOT NULL,
    target_device_id VARCHAR(50) NOT NULL,
    allowed BOOLEAN DEFAULT FALSE,
    reason VARCHAR(150),
    UNIQUE(source_device_id, target_device_id)
);

CREATE TABLE IF NOT EXISTS sentinel_incidents (
    id SERIAL PRIMARY KEY,
    source_ip VARCHAR(45) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    incident_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    evidence_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed System Policy
INSERT INTO system_policies (id, current_privacy_mode, overall_health_score, d2d_isolation_enabled, metadata_stripping_enabled, biometric_step_up_enabled, geofence_lock_enabled, auto_block_unknown_devices)
VALUES (1, 'NORMAL', 78, TRUE, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (id) DO UPDATE SET
    current_privacy_mode = EXCLUDED.current_privacy_mode,
    overall_health_score = EXCLUDED.overall_health_score;

-- Seed Smart Devices
INSERT INTO devices (id, device_name, ip_address, mac_address, device_type, risk_score, is_quarantined, encryption_enforced, open_ports, unencrypted_protocols, egress_mbps, packets_per_sec, status)
VALUES
('cam_01', 'Living Room Camera', '192.168.1.105', 'AA:BB:CC:11:22:33', 'camera', 75, FALSE, FALSE, ARRAY[80, 554], ARRAY['HTTP', 'RTSP'], 14.8, 320, 'warning'),
('lock_01', 'Front Door Smart Lock', '192.168.1.110', 'AA:BB:CC:44:55:66', 'lock', 10, FALSE, TRUE, ARRAY[8883], ARRAY[]::TEXT[], 0.1, 5, 'safe'),
('bulb_01', 'Bedroom Smart Bulb', '192.168.1.115', 'AA:BB:CC:77:88:99', 'light', 55, FALSE, FALSE, ARRAY[23, 1883], ARRAY['Telnet', 'MQTT'], 0.2, 12, 'warning'),
('rogue_01', 'Unknown ESP32 Device', '192.168.1.199', 'DE:AD:BE:EF:00:01', 'unknown', 90, FALSE, FALSE, ARRAY[23, 80], ARRAY['Telnet', 'HTTP'], 4.5, 110, 'critical'),
('speaker_01', 'Living Room Smart Speaker', '192.168.1.120', 'AA:BB:CC:AA:BB:CC', 'speaker', 35, FALSE, FALSE, ARRAY[8008, 443], ARRAY['HTTP'], 2.1, 40, 'safe'),
('thermostat_01', 'Smart Thermostat', '192.168.1.140', 'AA:BB:CC:DD:EE:FF', 'thermostat', 15, FALSE, TRUE, ARRAY[443], ARRAY[]::TEXT[], 0.05, 3, 'safe'),
('garage_01', 'Garage Door Opener', '192.168.1.130', 'AA:BB:CC:12:34:56', 'lock', 12, FALSE, TRUE, ARRAY[8883], ARRAY[]::TEXT[], 0.08, 4, 'safe')
ON CONFLICT (id) DO NOTHING;

-- Seed Alerts
INSERT INTO security_alerts (id, device_id, severity, title, description, resolved)
VALUES
(1, 'cam_01', 'HIGH', 'Unencrypted RTSP Video Streaming', 'Port 554 active. Living Room Camera streams video without TLS encryption.', FALSE),
(2, 'bulb_01', 'CRITICAL', 'Unauthorized D2D Lateral Movement Attempt', 'Bedroom Smart Bulb attempted to push RPC commands directly to Front Door Smart Lock.', FALSE),
(3, 'rogue_01', 'CRITICAL', 'Rogue Device / Evil Twin Detected', 'Unrecognized MAC address DE:AD:BE:EF:00:01 joined home Wi-Fi subnet with active Telnet service.', FALSE),
(4, 'cam_01', 'WARNING', 'Off-Hours Outbound Streaming Spike', 'Living Room Camera transmitted 850MB of data at 3:12 AM to external cloud IP.', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Seed Zero Trust D2D Matrix Rules
INSERT INTO d2d_matrix_rules (source_device_id, target_device_id, allowed, reason)
VALUES
('bulb_01', 'lock_01', FALSE, 'Zero-Trust Policy: Lightbulb cannot communicate with Smart Lock'),
('speaker_01', 'lock_01', FALSE, 'Zero-Trust Policy: Smart Speaker voice relay restricted from Smart Lock'),
('rogue_01', 'cam_01', FALSE, 'Quarantine Policy: Unknown device traffic completely isolated'),
('rogue_01', 'lock_01', FALSE, 'Quarantine Policy: Unknown device traffic completely isolated'),
('thermostat_01', 'speaker_01', TRUE, 'Permitted automation trigger'),
('lock_01', 'cam_01', TRUE, 'Secure entry camera snapshot verification')
ON CONFLICT (source_device_id, target_device_id) DO NOTHING;
