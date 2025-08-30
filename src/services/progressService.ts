import { ProgressSchema, PuzzleProgress } from '../types';

export class ProgressService {
    constructor(private userDb: any) {}

    async loadProgressRecords(): Promise<PuzzleProgress[]> {
        try {
            const records = await this.userDb.getAllAsync(
                'SELECT puzzleId, puzzle, moves, notes, solved FROM progress ORDER BY id ASC;'
            ) as PuzzleProgress[];
            return records;
        } catch (error) {
            console.error('Failed to load progress records:', error);
            return [];
        }
    }

    async createProgressRecord(puzzleId: string, puzzleSeed: string): Promise<void> {
        try {
            await this.userDb.runAsync(
                'INSERT INTO progress (puzzleId, puzzle, moves, notes, solved) VALUES (?, ?, NULL, NULL, 0);',
                [puzzleId, puzzleSeed]
            );
        } catch (error) {
            console.error('Failed to create progress record:', error);
            throw error;
        }
    }

    async getProgressRecord(puzzleId: string): Promise<ProgressSchema | null> {
        try {
            return await this.userDb.getFirstAsync(
                'SELECT * FROM progress WHERE puzzleId = ? LIMIT 1;',
                [puzzleId]
            ) as ProgressSchema;
        } catch (error) {
            console.error('Failed to get progress record:', error);
            return null;
        }
    }
}
