ALTER TABLE verification_requests
  ADD COLUMN midnight_wallet_address text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_requests_midnight_wallet_address
  ON verification_requests(midnight_wallet_address)
  WHERE midnight_wallet_address IS NOT NULL;