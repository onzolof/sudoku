import { useMemo } from 'react';
import { usePuzzlesDb, useUserDb } from '../provider/DbProviders';
import { PuzzleService, ProgressService } from '../services';

export function useServices() {
    const puzzlesDb = usePuzzlesDb();
    const userDb = useUserDb();
    
    const services = useMemo(() => {
        const progressService = new ProgressService(userDb);
        const puzzleService = new PuzzleService(puzzlesDb, progressService);
        
        return {
            puzzleService,
            progressService
        };
    }, [puzzlesDb, userDb]);
    
    return services;
}
