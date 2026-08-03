ALTER TABLE submissions ADD COLUMN season TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_active_team_color
  ON submissions(season, color_hex)
  WHERE status != 'rejected' AND season != '' AND color_hex != '';

CREATE TABLE IF NOT EXISTS game_state (
  game_id INTEGER PRIMARY KEY CHECK (game_id BETWEEN 1 AND 4),
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'live', 'completed')),
  started_at TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  external_url TEXT NOT NULL DEFAULT ''
);

INSERT OR IGNORE INTO game_state (game_id, duration_seconds, external_url) VALUES
  (1, 0, ''),
  (2, 0, ''),
  (3, 0, 'https://kahoot.it'),
  (4, 600, '');

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_live_game
  ON game_state(status) WHERE status = 'live';

CREATE TABLE IF NOT EXISTS game_scores (
  id TEXT PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES game_state(game_id),
  slot TEXT NOT NULL,
  season TEXT NOT NULL CHECK (season IN ('Winter', 'Spring', 'Summer', 'Autumn')),
  participant TEXT,
  points INTEGER NOT NULL CHECK (points >= 0),
  detail TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (game_id, slot)
);

CREATE INDEX IF NOT EXISTS idx_game_scores_season ON game_scores(season);
