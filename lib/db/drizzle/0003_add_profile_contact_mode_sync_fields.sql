ALTER TABLE profiles ADD COLUMN contact_mode_contract_address TEXT;
ALTER TABLE profiles ADD COLUMN contact_mode_sync_status TEXT NOT NULL DEFAULT 'not_created';
ALTER TABLE profiles ADD COLUMN contact_mode_last_synced_at TEXT;
ALTER TABLE profiles ADD COLUMN contact_mode_sync_error TEXT;