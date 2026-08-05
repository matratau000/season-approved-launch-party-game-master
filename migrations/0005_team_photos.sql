CREATE TABLE IF NOT EXISTS team_photos (
  season TEXT PRIMARY KEY CHECK (season IN ('Winter', 'Spring', 'Summer', 'Autumn')),
  object_key TEXT NOT NULL UNIQUE,
  previous_object_key TEXT,
  content_type TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
