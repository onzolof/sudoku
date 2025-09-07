import { ProgressSchema } from '../types';

export class ProgressService {
    constructor(private userDb: any) {}

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
