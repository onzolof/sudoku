import {PuzzleSchema} from '../types';
import {type Difficulty} from '../utils';

export class PuzzleService {
    constructor(private puzzlesDb: any, private progressService: any) {}

    async findRandomPuzzleId(difficulty?: Difficulty): Promise<string | null> {
        try {
            let query = 'SELECT id FROM puzzle';
            let params: any[] = [];

            if (difficulty) {
                query += ' WHERE difficulty = ?';
                params.push(difficulty);
            }

            query += ' ORDER BY RANDOM() LIMIT 1;';

            const randomPuzzle = await this.puzzlesDb.getFirstAsync(query, params) as { id: string } | null;

            return randomPuzzle?.id || null;
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

    async getPuzzleById(puzzleId: string): Promise<PuzzleSchema | null> {
        try {
            return await this.puzzlesDb.getFirstAsync(
                'SELECT * FROM puzzle WHERE id = ? LIMIT 1;',
                [puzzleId]
            ) as PuzzleSchema | null;
        } catch (error) {
            console.error('Failed to get puzzle by ID:', error);
            return null;
        }
    }

    async createNewSudoku(difficulty?: Difficulty): Promise<number | null> {
        try {
            const puzzleId = await this.findRandomPuzzleId(difficulty);
            if (!puzzleId) {
                console.error('No random puzzle available');
                return null;
            }

            const puzzleSeed = await this.getPuzzleSeed(puzzleId);
            if (!puzzleSeed) {
                console.error('Puzzle seed not found');
                return null;
            }

            const puzzle = await this.getPuzzleById(puzzleId);
            if (!puzzle) {
                console.error('Puzzle not found');
                return null;
            }

            console.debug('Creating new random puzzle');

            return await this.progressService.createProgressRecord(puzzleId, puzzleSeed, puzzle.difficulty);
        } catch (error) {
            console.error('Failed to create new Sudoku:', error);
            return null;
        }
    }
}
