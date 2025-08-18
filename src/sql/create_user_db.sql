PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS progress (
  puzzle_id TEXT PRIMARY KEY,            -- puzzles.puzzle.id
  current   TEXT NOT NULL,               -- 81 chars, '0' = empty
  notes     TEXT,                        -- JSON for candidates (optional)
  solved    INTEGER NOT NULL DEFAULT 0   -- boolean: 0=false, 1=true
        CHECK (solved IN (0,1))
);

CREATE INDEX IF NOT EXISTS idx_progress_solved ON progress(solved);

PRAGMA user_version = 1;
