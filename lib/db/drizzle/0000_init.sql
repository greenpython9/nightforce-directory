PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS verification_requests (
  id TEXT PRIMARY KEY NOT NULL,
  discord_handle TEXT NOT NULL,
  region TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wallet_bindings (
  id TEXT PRIMARY KEY NOT NULL,
  verification_request_id TEXT NOT NULL UNIQUE,
  midnight_wallet_address TEXT NOT NULL UNIQUE,
  bound_at TEXT NOT NULL,
  is_active TEXT NOT NULL DEFAULT 'true',
  updated_at TEXT NOT NULL,
  FOREIGN KEY (verification_request_id)
    REFERENCES verification_requests(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY NOT NULL,
  verification_request_id TEXT NOT NULL UNIQUE,
  wallet_binding_id TEXT NOT NULL UNIQUE,
  public_id TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,
  display_name TEXT,
  country TEXT,
  role TEXT,
  bio TEXT,
  avatar_url TEXT,
  website_url TEXT,
  socials TEXT NOT NULL DEFAULT '[]',
  field_visibility TEXT NOT NULL,
  encrypted_hidden_payload TEXT,
  publish_state TEXT NOT NULL DEFAULT 'draft',
  requested_visibility TEXT NOT NULL DEFAULT 'public',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT,
  inactive_at TEXT,
  FOREIGN KEY (verification_request_id)
    REFERENCES verification_requests(id)
    ON DELETE CASCADE,
  FOREIGN KEY (wallet_binding_id)
    REFERENCES wallet_bindings(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_status
  ON verification_requests(status);

CREATE INDEX IF NOT EXISTS idx_wallet_bindings_wallet
  ON wallet_bindings(midnight_wallet_address);

CREATE INDEX IF NOT EXISTS idx_profiles_publish_visibility
  ON profiles(publish_state, requested_visibility);

CREATE INDEX IF NOT EXISTS idx_profiles_public_id
  ON profiles(public_id);