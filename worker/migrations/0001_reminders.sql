CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  subscription TEXT NOT NULL,
  time TEXT NOT NULL,
  timezone TEXT NOT NULL,
  language TEXT NOT NULL,
  next_run INTEGER NOT NULL,
  last_sent_date TEXT,
  lease_until INTEGER NOT NULL DEFAULT 0,
  failures INTEGER NOT NULL DEFAULT 0,
  last_test INTEGER NOT NULL DEFAULT 0,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS reminders_due ON reminders(next_run);
