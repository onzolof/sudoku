import { ProgressSchema, PuzzleProgress } from '../types';
import { type Difficulty } from '../utils';

export class ProgressService {
    constructor(private userDb: any, private puzzleService?: any) {}

    setPuzzleService(puzzleService: any) {
        this.puzzleService = puzzleService;
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

    async getProgressRecordsPaginated(offset: number, limit: number, difficulty?: Difficulty): Promise<PuzzleProgress[]> {
        try {
            if (!difficulty || !this.puzzleService) {
                // Fallback to original behavior if no difficulty filter or puzzle service
                const records = await this.userDb.getAllAsync(
                    'SELECT id, puzzleId, puzzle, moves, notes, solved FROM progress ORDER BY id ASC LIMIT ? OFFSET ?;',
                    [limit, offset]
                ) as PuzzleProgress[];
                return records;
            }

            // Get puzzle IDs for the specified difficulty
            const puzzleIds = await this.puzzleService.getPuzzleIdsByDifficulty(difficulty);
            if (puzzleIds.length === 0) {
                return [];
            }

            // Create placeholders for the IN clause
            const placeholders = puzzleIds.map(() => '?').join(',');
            const query = `
                SELECT id, puzzleId, puzzle, moves, notes, solved 
                FROM progress 
                WHERE puzzleId IN (${placeholders})
                ORDER BY id ASC 
                LIMIT ? OFFSET ?
            `;

            const records = await this.userDb.getAllAsync(query, [...puzzleIds, limit, offset]) as PuzzleProgress[];
            return records;
        } catch (error) {
            console.error('Failed to load paginated progress records:', error);
            return [];
        }
    }

    async getTotalProgressCount(difficulty?: Difficulty): Promise<number> {
        try {
            if (!difficulty || !this.puzzleService) {
                // Fallback to original behavior if no difficulty filter or puzzle service
                const result = await this.userDb.getFirstAsync('SELECT COUNT(*) as count FROM progress;') as { count: number };
                return result.count;
            }

            // Get puzzle IDs for the specified difficulty
            const puzzleIds = await this.puzzleService.getPuzzleIdsByDifficulty(difficulty);
            if (puzzleIds.length === 0) {
                return 0;
            }

            // Create placeholders for the IN clause
            const placeholders = puzzleIds.map(() => '?').join(',');
            const query = `SELECT COUNT(*) as count FROM progress WHERE puzzleId IN (${placeholders})`;

            const result = await this.userDb.getFirstAsync(query, puzzleIds) as { count: number };
            return result.count;
        } catch (error) {
            console.error('Failed to get total progress count:', error);
            return 0;
        }
    }

    async getProgressRecordOffset(progressId: number, difficulty?: Difficulty): Promise<number> {
        try {
            if (!difficulty || !this.puzzleService) {
                // Fallback to original behavior if no difficulty filter or puzzle service
                const result = await this.userDb.getFirstAsync('SELECT COUNT(*) as offset FROM progress WHERE id <= ?;', [progressId]) as { offset: number };
                return Math.max(0, result.offset - 1); // Convert to 0-based offset
            }

            // Get puzzle IDs for the specified difficulty
            const puzzleIds = await this.puzzleService.getPuzzleIdsByDifficulty(difficulty);
            if (puzzleIds.length === 0) {
                return 0;
            }

            // Create placeholders for the IN clause
            const placeholders = puzzleIds.map(() => '?').join(',');
            const query = `SELECT COUNT(*) as offset FROM progress WHERE puzzleId IN (${placeholders}) AND id <= ?`;

            const result = await this.userDb.getFirstAsync(query, [...puzzleIds, progressId]) as { offset: number };
            return Math.max(0, result.offset - 1); // Convert to 0-based offset
        } catch (error) {
            console.error('Failed to get progress record offset:', error);
            return 0;
        }
    }
}
