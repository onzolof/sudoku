import { ProgressSchema, PuzzleProgress } from '../types';

export class ProgressService {
    constructor(private userDb: any) {}

    async loadProgressRecords(): Promise<PuzzleProgress[]> {
        try {
            const records = await this.userDb.getAllAsync(
                'SELECT id, puzzleId, puzzle, moves, notes, solved FROM progress ORDER BY id ASC;'
            ) as PuzzleProgress[];
            return records;
        } catch (error) {
            console.error('Failed to load progress records:', error);
            return [];
        }
    }

    async createProgressRecord(puzzleId: string, puzzleSeed: string): Promise<number> {
        try {
            const result = await this.userDb.runAsync(
                'INSERT INTO progress (puzzleId, puzzle, moves, notes, solved) VALUES (?, ?, NULL, NULL, 0);',
                [puzzleId, puzzleSeed]
            );
            return result.lastInsertRowId;
        } catch (error) {
            console.error('Failed to create progress record:', error);
            throw error;
        }
    }

    async getProgressRecordById(id: number): Promise<ProgressSchema | null> {
        try {
            return await this.userDb.getFirstAsync(
                'SELECT * FROM progress WHERE id = ? LIMIT 1;',
                [id]
            ) as ProgressSchema;
        } catch (error) {
            console.error('Failed to get progress record by id:', error);
            return null;
        }
    }
}
