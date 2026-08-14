CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE CHECK (length(trim(name)) BETWEEN 1 AND 50),
  season TEXT NOT NULL CHECK (season IN ('Winter', 'Spring', 'Summer', 'Autumn')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (season, name)
);

CREATE INDEX IF NOT EXISTS idx_participants_season_name ON participants(season, name);
