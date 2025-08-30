import { PuzzleService } from './puzzleService';
import { ProgressService } from './progressService';
import { PuzzleProgress } from '../types';

export class GameService {
    constructor(
        private puzzleService: PuzzleService,
        private progressService: ProgressService
    ) {}

    async preFetchNextPuzzle(excludeIds: string[]): Promise<string | null> {
        return await this.puzzleService.findRandomPuzzleId(excludeIds, [100, 300]);
    }

    async pickRandomPuzzleId(excludeIds: string[]): Promise<string | null> {
        return await this.puzzleService.findRandomPuzzleId(excludeIds, [20, 40, 80, 160]);
    }

    async createNewGame(puzzleId: string): Promise<void> {
        const puzzleSeed = await this.puzzleService.getPuzzleSeed(puzzleId);
        if (!puzzleSeed) {
            throw new Error(`Puzzle seed not found for ID: ${puzzleId}`);
        }
        
        await this.progressService.createProgressRecord(puzzleId, puzzleSeed);
    }

    async getCurrentGameState(puzzleId: string): Promise<{
        progress: PuzzleProgress | null;
        canGoPrevious: boolean;
        canGoNext: boolean;
        nextPuzzleId: string | null;
    }> {
        const progressRecords = await this.progressService.loadProgressRecords();
        const currentIndex = progressRecords.findIndex(r => r.puzzleId === puzzleId);
        
        return {
            progress: progressRecords[currentIndex] || null,
            canGoPrevious: currentIndex > 0,
            canGoNext: currentIndex < progressRecords.length - 1,
            nextPuzzleId: null // This would be set by the component
        };
    }
}
