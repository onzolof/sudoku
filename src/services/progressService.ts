import { ProgressSchema, PuzzleProgress } from '../types';

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

    async getProgressRecordsPaginated(offset: number, limit: number): Promise<PuzzleProgress[]> {
        try {
            const records = await this.userDb.getAllAsync(
                'SELECT id, puzzleId, puzzle, moves, notes, solved FROM progress ORDER BY id ASC LIMIT ? OFFSET ?;',
                [limit, offset]
            ) as PuzzleProgress[];
            return records;
        } catch (error) {
            console.error('Failed to load paginated progress records:', error);
            return [];
        }
    }

    async getTotalProgressCount(): Promise<number> {
        try {
            const result = await this.userDb.getFirstAsync(
                'SELECT COUNT(*) as count FROM progress;'
            ) as { count: number };
            return result.count;
        } catch (error) {
            console.error('Failed to get total progress count:', error);
            return 0;
        }
    }

    async getProgressRecordOffset(progressId: number): Promise<number> {
        try {
            const result = await this.userDb.getFirstAsync(
                'SELECT COUNT(*) as offset FROM progress WHERE id <= ?;',
                [progressId]
            ) as { offset: number };
            return Math.max(0, result.offset - 1); // Convert to 0-based offset
        } catch (error) {
            console.error('Failed to get progress record offset:', error);
            return 0;
        }
    }
}
