-- QR scan event logs (separate material / production domains)
CREATE SCHEMA IF NOT EXISTS logs;

CREATE TABLE IF NOT EXISTS logs.qr_scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logged_at timestamp NOT NULL DEFAULT now(),
  domain varchar(30) NOT NULL,
  action varchar(40) NOT NULL,
  qr_code varchar(255) NOT NULL,
  user_id varchar(64) NULL,
  username varchar(100) NULL,
  department_id varchar(64) NULL,
  is_success boolean NOT NULL DEFAULT true,
  error_message text NULL,
  metadata jsonb NULL
);

CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_logged_at
  ON logs.qr_scan_logs (logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_domain_action
  ON logs.qr_scan_logs (domain, action);

CREATE INDEX IF NOT EXISTS idx_qr_scan_logs_qr_code
  ON logs.qr_scan_logs (qr_code);
