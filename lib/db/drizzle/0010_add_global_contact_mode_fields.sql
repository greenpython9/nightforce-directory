ALTER TABLE profiles ADD COLUMN contact_mode_architecture TEXT NOT NULL DEFAULT 'per_profile';
ALTER TABLE profiles ADD COLUMN contact_mode_profile_key TEXT;
ALTER TABLE profiles ADD COLUMN contact_mode_owner_commitment TEXT;
ALTER TABLE profiles ADD COLUMN contact_mode_entry_status TEXT NOT NULL DEFAULT 'not_registered';
ALTER TABLE profiles ADD COLUMN contact_mode_entry_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN contact_mode_global_contract_address TEXT;
ALTER TABLE profiles ADD COLUMN contact_mode_global_network_id TEXT;
