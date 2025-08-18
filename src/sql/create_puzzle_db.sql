CREATE TABLE IF NOT EXISTS puzzle(
  id TEXT PRIMARY KEY,            -- sha1(seed+solution)[0:24]
  seed TEXT NOT NULL,             -- CSV 'puzzle'
  solution TEXT NOT NULL,         -- CSV 'solution'
  difficulty TEXT NOT NULL,       -- from filename
  number_of_clues INTEGER NOT NULL, -- from filename (CSV column is ignored)
  version INTEGER NOT NULL,       -- batch version per imported file
  added_at INTEGER NOT NULL       -- unix seconds
);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_seed_solution ON puzzle(seed, solution);
CREATE INDEX IF NOT EXISTS idx_puzzle_diff     ON puzzle(difficulty);
CREATE INDEX IF NOT EXISTS idx_puzzle_clues    ON puzzle(number_of_clues);
CREATE INDEX IF NOT EXISTS idx_puzzle_version  ON puzzle(version);
