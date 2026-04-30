ALTER TABLE profiles ADD COLUMN contact_mode_network_id TEXT;

UPDATE profiles
SET contact_mode_network_id = 'preprod'
WHERE contact_mode_contract_address IS NOT NULL
  AND contact_mode_contract_address <> '';