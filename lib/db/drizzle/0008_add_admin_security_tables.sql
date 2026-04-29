CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL DEFAULT 250000,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT,
  disabled_at TEXT
);

CREATE INDEX IF NOT EXISTS admin_users_status_idx
  ON admin_users (status);

CREATE TABLE IF NOT EXISTS admin_audit_events (
  id TEXT PRIMARY KEY NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS admin_audit_events_created_at_idx
  ON admin_audit_events (created_at);

CREATE INDEX IF NOT EXISTS admin_audit_events_actor_email_idx
  ON admin_audit_events (actor_email);

CREATE INDEX IF NOT EXISTS admin_audit_events_action_idx
  ON admin_audit_events (action);
