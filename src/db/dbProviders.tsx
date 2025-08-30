import {createContext, ReactNode, useContext, useEffect} from 'react';
import {SQLiteProvider, useSQLiteContext, type SQLiteDatabase} from 'expo-sqlite';

const PuzzlesDbCtx = createContext<SQLiteDatabase | null>(null);
const UserDbCtx = createContext<SQLiteDatabase | null>(null);

function PuzzlesDbInner({children}: { children: ReactNode }) {
    const db = useSQLiteContext();
    return <PuzzlesDbCtx.Provider value={db}>{children}</PuzzlesDbCtx.Provider>;
}

export function PuzzlesDbProvider({children}: { children: ReactNode }) {
    return (
        <SQLiteProvider
            databaseName="sudoku-puzzles.db"
            assetSource={{assetId: require('../../assets/data/puzzles.db')}}
        >
            <PuzzlesDbInner>{children}</PuzzlesDbInner>
        </SQLiteProvider>
    );
}

function UserDbInner({children}: { children: ReactNode }) {
    const db = useSQLiteContext();

    useEffect(() => {
        (async () => {
            try {
                // Check if table exists
                const tableExists = await db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table' AND name='progress';");
                
                if (tableExists.length === 0) {
                    // Create new table with proper schema
                    await db.runAsync(`
                        CREATE TABLE progress (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            puzzleId TEXT NOT NULL,
                            puzzle TEXT NOT NULL,
                            moves TEXT,
                            notes TEXT,
                            solved INTEGER NOT NULL DEFAULT 0 CHECK (solved IN (0,1))
                        );
                    `);
                    
                    // Create indexes for efficient pagination
                    await db.runAsync('CREATE INDEX idx_progress_id ON progress(id);');
                    await db.runAsync('CREATE INDEX idx_progress_puzzleId ON progress(puzzleId);');
                    await db.runAsync('CREATE INDEX idx_progress_solved ON progress(solved);');
                    
                    console.log('Created new progress table with id column and indexes');
                }
            } catch (error) {
                console.error('Error creating database schema:', error);
            }
        })();
    }, [db]);

    return <UserDbCtx.Provider value={db}>{children}</UserDbCtx.Provider>;
}

export function UserDbProvider({children}: { children: ReactNode }) {
    return (
        <SQLiteProvider
            databaseName="user.db"
        >
            <UserDbInner>{children}</UserDbInner>
        </SQLiteProvider>
    );
}

export const usePuzzlesDb = () => {
    const db = useContext(PuzzlesDbCtx);
    if (!db) throw new Error('usePuzzlesDb must be used inside <PuzzlesDbProvider>');
    return db;
};

export const useUserDb = () => {
    const db = useContext(UserDbCtx);
    if (!db) throw new Error('useUserDb must be used inside <UserDbProvider>');
    return db;
};
