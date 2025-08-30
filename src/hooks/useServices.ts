import { useMemo } from 'react';
import { usePuzzlesDb, useUserDb } from '../db/dbProviders';
import { PuzzleService, ProgressService, GameService } from '../services';

export function useServices() {
    const puzzlesDb = usePuzzlesDb();
    const userDb = useUserDb();
    
    const services = useMemo(() => {
        const puzzleService = new PuzzleService(puzzlesDb);
        const progressService = new ProgressService(userDb);
        const gameService = new GameService(puzzleService, progressService);
        
        return {
            puzzleService,
            progressService,
            gameService
        };
    }, [puzzlesDb, userDb]);
    
    return services;
}
