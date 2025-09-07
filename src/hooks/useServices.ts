import { useMemo } from 'react';
import { usePuzzlesDb, useUserDb } from '../db/dbProviders';
import { PuzzleService, ProgressService } from '../services';

export function useServices() {
    const puzzlesDb = usePuzzlesDb();
    const userDb = useUserDb();
    
    const services = useMemo(() => {
        const progressService = new ProgressService(userDb);
        const puzzleService = new PuzzleService(puzzlesDb, progressService);
        
        // Pass puzzle service to progress service for difficulty filtering
        progressService.setPuzzleService(puzzleService);
        
        return {
            puzzleService,
            progressService
        };
    }, [puzzlesDb, userDb]);
    
    return services;
}
