import { ProgressSchema } from '../types';

export class ProgressService {
    constructor(private userDb: any) {}

    async createProgressRecord(puzzleId: string, puzzleSeed: string, difficulty: string): Promise<number> {
        try {
            const result = await this.userDb.runAsync(
                'INSERT INTO progress (puzzleId, puzzle, difficulty, moves, notes, solved) VALUES (?, ?, ?, NULL, NULL, 0);',
                [puzzleId, puzzleSeed, difficulty]
            );
            return result.lastInsertRowId;
        } catch (error) {
            console.error('Failed to create progress record:', error);
            throw error;
        }
    }

    async getProgressRecordById(id: number): Promise<ProgressSchema | null> {
        try {
            const result = await this.userDb.getFirstAsync(
                'SELECT * FROM progress WHERE id = ? LIMIT 1;',
                [id]
            );
            
            if (!result) return null;
            
            // Parse JSON fields that are stored as strings in the database
            const parsedResult: ProgressSchema = {
                ...result,
                moves: result.moves ? JSON.parse(result.moves) : null,
                notes: result.notes ? JSON.parse(result.notes) : null
            };
            
            return parsedResult;
        } catch (error) {
            console.error('Failed to get progress record by id:', error);
            return null;
        }
    }

    /**
     * Get progress records for navigation (previous, current, next) for a specific difficulty
     * Returns an object with previous, current, and next progress records
     */
    async getProgressNavigation(currentId: number | null, difficulty: string): Promise<{
        previous: ProgressSchema | null;
        current: ProgressSchema | null;
        next: ProgressSchema | null;
    }> {
        try {
            // Get all progress records for this difficulty, ordered by id
            // todo: is it possible to avoid loading everything here?
            const allProgressRaw = await this.userDb.getAllAsync(
                'SELECT * FROM progress WHERE difficulty = ? ORDER BY id ASC',
                [difficulty]
            );
            
            // Parse JSON fields for each progress record
            const allProgress = allProgressRaw.map((result: any) => ({
                ...result,
                moves: result.moves ? JSON.parse(result.moves) : null,
                notes: result.notes ? JSON.parse(result.notes) : null
            })) as ProgressSchema[];

            if (allProgress.length === 0) {
                return { previous: null, current: null, next: null };
            }

            let currentIndex = -1;
            if (currentId) {
                currentIndex = allProgress.findIndex(p => p.id === currentId);
            }

            const result = {
                previous: null as ProgressSchema | null,
                current: null as ProgressSchema | null,
                next: null as ProgressSchema | null,
            };

            if (currentIndex >= 0) {
                result.current = allProgress[currentIndex];
                result.previous = currentIndex > 0 ? allProgress[currentIndex - 1] : null;
                result.next = currentIndex < allProgress.length - 1 ? allProgress[currentIndex + 1] : null;
            } else if (allProgress.length > 0) {
                // If no current ID provided, return the first record as current
                result.current = allProgress[0];
                result.next = allProgress.length > 1 ? allProgress[1] : null;
            }

            return result;
        } catch (error) {
            console.error('Failed to get progress navigation:', error);
            return { previous: null, current: null, next: null };
        }
    }

    async updateProgress(progress: ProgressSchema): Promise<void> {
        try {
            await this.userDb.runAsync(
                'UPDATE progress SET moves = ?, solved = ? WHERE id = ?;',
                [JSON.stringify(progress.moves), progress.solved, progress.id]
            );
        } catch (error) {
            console.error('Failed to update progress:', error);
            throw error;
        }
    }
}
