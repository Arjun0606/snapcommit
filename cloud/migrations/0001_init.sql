CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,         -- in prod: store hash, not the raw token
  tier TEXT NOT NULL DEFAULT 'free',
  monthly_quota INTEGER NOT NULL DEFAULT 5,
  dodo_customer_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usage_monthly (
  user_id TEXT NOT NULL,
  year_month TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, year_month)
);

CREATE TABLE IF NOT EXISTS extraction_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  ok INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_extraction_log_user ON extraction_log(user_id, ts);
