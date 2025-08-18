#!/usr/bin/env python3
import os, re, csv, time, glob, argparse, sqlite3, hashlib

# Match filenames like: 20_easy_puzzles.csv
FILENAME_RE = re.compile(r'(?i)(\d+)_([a-z]+)_puzzles\.csv$')

def parse_filename(fname: str):
    m = FILENAME_RE.search(os.path.basename(fname))
    if not m:
        raise ValueError(f"Filename must look like '<number>_<difficulty>_puzzles.csv'  got={fname}")
    clues = int(m.group(1))
    difficulty = m.group(2).lower()
    return clues, difficulty

def init_db(conn: sqlite3.Connection):
    cur = conn.cursor()
    cur.executescript("""
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    CREATE TABLE IF NOT EXISTS puzzle(
      id TEXT PRIMARY KEY,           -- sha1(seed+solution)[0:24]
      seed TEXT NOT NULL,            -- CSV 'puzzle'
      solution TEXT NOT NULL,        -- CSV 'solution'
      difficulty TEXT NOT NULL,      -- from filename
      number_of_clues INTEGER NOT NULL, -- from filename
      version INTEGER NOT NULL,      -- batch version (increments each import file)
      added_at INTEGER NOT NULL      -- unix time
    );
    CREATE UNIQUE INDEX IF NOT EXISTS uniq_seed_solution ON puzzle(seed, solution);
    CREATE INDEX IF NOT EXISTS idx_puzzle_diff   ON puzzle(difficulty);
    CREATE INDEX IF NOT EXISTS idx_puzzle_clues  ON puzzle(number_of_clues);
    CREATE INDEX IF NOT EXISTS idx_puzzle_version ON puzzle(version);
    """ )
    conn.commit()

def current_max_version(conn: sqlite3.Connection) -> int:
    cur = conn.cursor()
    row = cur.execute("SELECT COALESCE(MAX(version), 0) FROM puzzle;").fetchone()
    return int(row[0] or 0)

def sha1_id(seed: str, solution: str) -> str:
    return hashlib.sha1((seed + solution).encode('utf-8')).hexdigest()[:24]

def file_version_for_import(conn: sqlite3.Connection) -> int:
    # version = 1 if table empty, else max(version)+1
    return current_max_version(conn) + 1

def import_csv_file(conn: sqlite3.Connection, path: str):
    number_of_clues, difficulty = parse_filename(path)
    version = file_version_for_import(conn)
    now = int(time.time())

    seen = imported = dupes = skipped = 0
    cur = conn.cursor()
    cur.execute("BEGIN;")

    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            seed = (row.get('puzzle') or '').strip()
            solution = (row.get('solution') or '').strip()
            # Basic validations
            if len(seed) != 81 or len(solution) != 81:
                skipped += 1; continue
            if any(a != '0' and a != b for a,b in zip(seed, solution)):
                skipped += 1; continue
            seen += 1
            pid = sha1_id(seed, solution)
            try:
                cur.execute(
                    "INSERT INTO puzzle(id, seed, solution, difficulty, number_of_clues, version, added_at) "
                    "VALUES(?,?,?,?,?,?,?)",
                    (pid, seed, solution, difficulty, number_of_clues, version, now)
                )
                imported += 1
            except sqlite3.IntegrityError:
                dupes += 1
                continue
    cur.execute("COMMIT;")
    conn.commit()
    return { 'file': os.path.basename(path), 'version': version, 'seen': seen, 'imported': imported, 'duplicates': dupes, 'skipped': skipped }

def main():
    ap = argparse.ArgumentParser(description='Import CSV puzzles into puzzles.db')
    ap.add_argument('--input_dir', default='.', help="Directory to scan (recursively) for '*_*_puzzles.csv'")
    ap.add_argument('--out_db', default='puzzles.db', help='Output SQLite DB path')
    args = ap.parse_args()

    # Recursively find files
    paths = sorted(glob.glob(os.path.join(args.input_dir, '**', '*_*_puzzles.csv'), recursive=True))
    if not paths:
        print('No files found.'); return

    conn = sqlite3.connect(args.out_db)
    init_db(conn)

    totals = {'seen':0,'imported':0,'duplicates':0,'skipped':0}
    for p in paths:
        res = import_csv_file(conn, p)
        print(f"{res['file']}  version={res['version']}  seen={res['seen']}  imported={res['imported']}  dupes={res['duplicates']}  skipped={res['skipped']}")
        for k in totals.keys():
            totals[k] += res[k]

    cur = conn.cursor()
    count = cur.execute('SELECT COUNT(*) FROM puzzle;').fetchone()[0]
    maxv  = cur.execute('SELECT COALESCE(MAX(version),0) FROM puzzle;').fetchone()[0]
    print(f"\nDone. puzzles in DB: {count}  max_version={maxv}  (seen={totals['seen']}, imported={totals['imported']}, dupes={totals['duplicates']}, skipped={totals['skipped']})")

if __name__ == '__main__':
    main()
