import {createContext, ReactNode, useContext} from 'react';
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
    return <UserDbCtx.Provider value={db}>{children}</UserDbCtx.Provider>;
}

export function UserDbProvider({children}: { children: ReactNode }) {
    return (
        <SQLiteProvider
            databaseName="user.db"
            assetSource={{assetId: require('../../user.db')}}
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
