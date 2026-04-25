CREATE TABLE IF NOT EXISTS visitor_activity (
  id TEXT PRIMARY KEY NOT NULL,
  alias TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'XX',
  country_name TEXT NOT NULL DEFAULT 'Unknown',
  path TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_visitor_activity_created_at
  ON visitor_activity(created_at);

CREATE INDEX IF NOT EXISTS idx_visitor_activity_country_code
  ON visitor_activity(country_code);