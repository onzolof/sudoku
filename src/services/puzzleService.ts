import { PuzzleSchema } from '../types';

export class PuzzleService {
    constructor(private puzzlesDb: any) {}

    async findRandomPuzzleId(excludeIds: string[], batchSizes: number[]): Promise<string | null> {
        try {
            for (const batchSize of batchSizes) {
                const randomPuzzles = await this.puzzlesDb.getAllAsync(
                    'SELECT id FROM puzzle ORDER BY RANDOM() LIMIT ?;',
                    [batchSize]
                ) as { id: string }[];

                const availablePuzzles = randomPuzzles.filter(p => !excludeIds.includes(p.id));

                if (availablePuzzles.length > 0) {
                    return availablePuzzles[0].id;
                }
            }
            return null;
        } catch (error) {
            console.error('Failed to find random puzzle ID:', error);
            return null;
        }
    }

    async getPuzzleSeed(puzzleId: string): Promise<string | null> {
        try {
            const puzzle = await this.puzzlesDb.getFirstAsync(
                'SELECT seed FROM puzzle WHERE id = ? LIMIT 1;',
                [puzzleId]
            ) as PuzzleSchema | null;

            return puzzle?.seed || null;
        } catch (error) {
            console.error('Failed to get puzzle seed:', error);
            return null;
        }
    }
}
