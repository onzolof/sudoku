PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    puzzleId TEXT NOT NULL,            -- puzzles.puzzle.id
    puzzle   TEXT NOT NULL,               -- 81 chars, '0' = empty
    difficulty TEXT NOT NULL,             -- difficulty level
    moves    TEXT,                        -- JSON for moves
    notes    TEXT,                        -- JSON for candidates
    solved   INTEGER NOT NULL DEFAULT 0   -- boolean: 0=false, 1=true
         CHECK (solved IN (0,1))
);

-- Indexes for efficient pagination and queries
CREATE INDEX IF NOT EXISTS idx_progress_id ON progress(id);
CREATE INDEX IF NOT EXISTS idx_progress_puzzleId ON progress(puzzleId);
CREATE INDEX IF NOT EXISTS idx_progress_solved ON progress(solved);
CREATE INDEX IF NOT EXISTS idx_progress_difficulty ON progress(difficulty);

PRAGMA user_version = 1;
