import {PuzzleService} from './puzzleService';
import {ProgressService} from './progressService';
import {PuzzleProgress} from '../types';

export class GameService {
    constructor(
        private puzzleService: PuzzleService,
        private progressService: ProgressService
    ) {
    }

    async createNewGame(puzzleId: string): Promise<number> {
        const puzzleSeed = await this.puzzleService.getPuzzleSeed(puzzleId);
        if (!puzzleSeed) {
            throw new Error(`Puzzle seed not found for ID: ${puzzleId}`);
        }

        return await this.progressService.createProgressRecord(puzzleId, puzzleSeed);
    }
}
